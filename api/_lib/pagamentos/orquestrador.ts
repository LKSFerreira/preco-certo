import pool from '../../../lib/database/banco.js';
import { fabricaGatewayPagamento } from '../gateways/fabrica';
import { gerarCodigoToken, calcularHash, obterDuracaoPorPlano } from '../tokens.js';

export type EstadoPagamentoDominio = 'pendente' | 'aprovado' | 'falha' | 'expirado' | 'pendente_manual';
export type ModoConfirmacao = 'automatico' | 'manual';
type PlanoId = 'plano_cafe' | 'plano_lanche' | 'plano_apoiador';
type PlanoBanco = 'cafe' | 'lanche' | 'apoiador';

type ResultadoConfirmacao =
    | { tipo: 'token_gerado'; token: string; plano: PlanoBanco; duracao_dias: number }
    | { tipo: 'token_existente'; plano: PlanoBanco; duracao_dias: number; mensagem: string }
    | { tipo: 'manual_necessaria'; mensagem: string }
    | { tipo: 'pagamento_nao_aprovado'; status_atual: EstadoPagamentoDominio };
type ResultadoGeracaoToken = Extract<ResultadoConfirmacao, { tipo: 'token_gerado' | 'token_existente' }>;

const TABELA_PRECOS: Record<PlanoId, { valor: number; descricao: string }> = {
    plano_cafe: { valor: 2.90, descricao: 'Plano Cafe - 15 dias' },
    plano_lanche: { valor: 4.90, descricao: 'Plano Lanche - 30 dias' },
    plano_apoiador: { valor: 9.90, descricao: 'Plano Apoiador - 60 dias' },
};

const MAPA_PLANO_FRONTEND_PARA_BANCO: Record<PlanoId, PlanoBanco> = {
    plano_cafe: 'cafe',
    plano_lanche: 'lanche',
    plano_apoiador: 'apoiador',
};

export class OrquestradorPagamento {
    private ehErroDuplicidade(erro: unknown): erro is { code: string } {
        return typeof erro === 'object' && erro !== null && 'code' in erro && erro.code === '23505';
    }

    private obterGatewayAtivo(): string {
        return process.env.GATEWAY_PAGAMENTO_BACKEND || '';
    }

    private obterModoConfirmacao(): ModoConfirmacao {
        return this.obterGatewayAtivo() === 'nubank_failover' ? 'manual' : 'automatico';
    }

    private normalizarStatus(statusCru: string | undefined): EstadoPagamentoDominio {
        if (!statusCru) return 'pendente';
        const status = statusCru.toLowerCase();

        const mapa: Record<string, EstadoPagamentoDominio> = {
            pendente: 'pendente',
            pending: 'pendente',
            waiting: 'pendente',
            waiting_payment: 'pendente',
            authorized: 'pendente',
            in_analysis: 'pendente',
            in_process: 'pendente',
            in_mediation: 'pendente',

            aprovado: 'aprovado',
            approved: 'aprovado',
            paid: 'aprovado',

            falha: 'falha',
            rejected: 'falha',
            declined: 'falha',
            canceled: 'falha',
            cancelled: 'falha',
            refunded: 'falha',
            charged_back: 'falha',
            failed: 'falha',

            expirado: 'expirado',
            expired: 'expirado',

            pendente_manual: 'pendente_manual',
        };

        return mapa[status] || 'pendente';
    }

    private obterPlanoBanco(planoId: string): PlanoBanco {
        const planoBanco = MAPA_PLANO_FRONTEND_PARA_BANCO[planoId as PlanoId];
        if (!planoBanco) {
            throw new Error('Plano inválido. Aceitos: plano_cafe, plano_lanche, plano_apoiador');
        }
        return planoBanco;
    }

    async gerarPix(planoId: string) {
        const plano = TABELA_PRECOS[planoId as PlanoId];
        if (!plano) {
            throw new Error('Plano inválido');
        }

        const gateway = fabricaGatewayPagamento.obterGateway();
        const resposta = await gateway.criarPix(plano.valor, plano.descricao);
        const modoConfirmacao = resposta.modo_confirmacao || this.obterModoConfirmacao();

        return {
            ...resposta,
            status: modoConfirmacao === 'manual'
                ? 'pendente_manual'
                : this.normalizarStatus(resposta.status),
            modo_confirmacao: modoConfirmacao,
        };
    }

    async consultarStatus(pagamentoId: string) {
        if (this.obterModoConfirmacao() === 'manual') {
            return {
                pagamento_id: pagamentoId,
                status: 'pendente_manual' as EstadoPagamentoDominio,
            };
        }

        const gateway = fabricaGatewayPagamento.obterGateway();
        const resposta = await gateway.consultarStatus(pagamentoId);
        return {
            pagamento_id: resposta.pagamento_id,
            status: this.normalizarStatus(resposta.status),
        };
    }

    private async buscarTokenExistente(pagamentoId: string) {
        const resultado = await pool.query(
            `SELECT plano, duracao_dias FROM tokens WHERE pagamento_id = $1`,
            [pagamentoId]
        );

        if (resultado.rows.length === 0) return null;
        return resultado.rows[0] as { plano: PlanoBanco; duracao_dias: number };
    }

    private async gerarTokenPersistido(pagamentoId: string, planoBanco: PlanoBanco) {
        const tokenTextoPuro = gerarCodigoToken();
        const tokenHash = calcularHash(tokenTextoPuro);
        const duracaoDias = obterDuracaoPorPlano(planoBanco);

        await pool.query(
            `INSERT INTO tokens (token_hash, plano, duracao_dias, pagamento_id)
             VALUES ($1, $2, $3, $4)`,
            [tokenHash, planoBanco, duracaoDias, pagamentoId]
        );

        return { token: tokenTextoPuro, plano: planoBanco, duracao_dias: duracaoDias, token_hash: tokenHash };
    }

    private async gerarTokenComIdempotencia(pagamentoId: string, planoBanco: PlanoBanco): Promise<ResultadoGeracaoToken> {
        try {
            const tokenNovo = await this.gerarTokenPersistido(pagamentoId, planoBanco);
            return {
                tipo: 'token_gerado',
                token: tokenNovo.token,
                plano: tokenNovo.plano,
                duracao_dias: tokenNovo.duracao_dias,
            };
        } catch (erro) {
            if (!this.ehErroDuplicidade(erro)) {
                throw erro;
            }

            const tokenExistente = await this.buscarTokenExistente(pagamentoId);
            if (!tokenExistente) {
                throw erro;
            }

            return {
                tipo: 'token_existente',
                plano: tokenExistente.plano,
                duracao_dias: tokenExistente.duracao_dias,
                mensagem: 'Token já foi gerado para este pagamento. Use a tela de ativação para recuperá-lo.',
            };
        }
    }

    async confirmarPagamento(pagamentoId: string, planoId: string): Promise<ResultadoConfirmacao> {
        const planoBanco = this.obterPlanoBanco(planoId);
        const tokenExistente = await this.buscarTokenExistente(pagamentoId);

        if (tokenExistente) {
            return {
                tipo: 'token_existente',
                plano: tokenExistente.plano,
                duracao_dias: tokenExistente.duracao_dias,
                mensagem: 'Token já foi gerado para este pagamento. Use a tela de ativação para recuperá-lo.',
            };
        }

        if (this.obterGatewayAtivo() === 'mockado') {
            const statusMock = await this.consultarStatus(pagamentoId);
            if (statusMock.status !== 'aprovado') {
                return {
                    tipo: 'pagamento_nao_aprovado',
                    status_atual: statusMock.status,
                };
            }

            return this.gerarTokenComIdempotencia(pagamentoId, planoBanco);
        }

        if (this.obterModoConfirmacao() === 'manual') {
            return {
                tipo: 'manual_necessaria',
                mensagem: 'Pagamento em modo manual. A liberação depende de aprovação de suporte.',
            };
        }

        const status = await this.consultarStatus(pagamentoId);
        if (status.status !== 'aprovado') {
            return {
                tipo: 'pagamento_nao_aprovado',
                status_atual: status.status,
            };
        }

        return this.gerarTokenComIdempotencia(pagamentoId, planoBanco);
    }

    async solicitarAprovacaoManual(parametros: {
        pagamento_id: string;
        plano_id: string;
        nome_contato: string;
        mensagem?: string;
        telefone_contato?: string;
    }) {
        const { pagamento_id, plano_id, nome_contato, mensagem, telefone_contato } = parametros;
        this.obterPlanoBanco(plano_id);

        const resultado = await pool.query(
            `INSERT INTO pagamentos_manuais (pagamento_id, plano_id, nome_contato, mensagem, telefone_contato, status)
             VALUES ($1, $2, $3, $4, $5, 'pendente')
             ON CONFLICT (pagamento_id)
             DO UPDATE SET
                plano_id = EXCLUDED.plano_id,
                nome_contato = EXCLUDED.nome_contato,
                mensagem = EXCLUDED.mensagem,
                telefone_contato = EXCLUDED.telefone_contato,
                atualizado_em = CURRENT_TIMESTAMP
             RETURNING pagamento_id, plano_id, status, criado_em, atualizado_em`,
            [pagamento_id, plano_id, nome_contato, mensagem || null, telefone_contato || null]
        );

        return resultado.rows[0];
    }

    async aprovarPagamentoManual(parametros: {
        pagamento_id: string;
        aprovado_por: string;
    }) {
        const { pagamento_id, aprovado_por } = parametros;

        const solicitacao = await pool.query(
            `SELECT pagamento_id, plano_id, status FROM pagamentos_manuais WHERE pagamento_id = $1`,
            [pagamento_id]
        );

        if (solicitacao.rows.length === 0) {
            throw new Error('Solicitação manual não encontrada para este pagamento.');
        }

        const dadosSolicitacao = solicitacao.rows[0] as { pagamento_id: string; plano_id: string; status: string };

        if (dadosSolicitacao.status === 'rejeitado') {
            throw new Error('Solicitação manual rejeitada. Não é possível aprovar este pagamento.');
        }

        const tokenExistente = await this.buscarTokenExistente(pagamento_id);
        if (tokenExistente) {
            await pool.query(
                `UPDATE pagamentos_manuais
                 SET status = 'aprovado', aprovado_em = CURRENT_TIMESTAMP, aprovado_por = $2, atualizado_em = CURRENT_TIMESTAMP
                 WHERE pagamento_id = $1`,
                [pagamento_id, aprovado_por]
            );

            return {
                token_ja_existente: true,
                plano: tokenExistente.plano,
                duracao_dias: tokenExistente.duracao_dias,
                mensagem: 'Token já existente para este pagamento.',
            };
        }

        const planoBanco = this.obterPlanoBanco(dadosSolicitacao.plano_id);
        const resultadoToken = await this.gerarTokenComIdempotencia(pagamento_id, planoBanco);

        if (resultadoToken.tipo === 'token_existente') {
            await pool.query(
                `UPDATE pagamentos_manuais
                 SET status = 'aprovado', aprovado_em = CURRENT_TIMESTAMP, aprovado_por = $2, atualizado_em = CURRENT_TIMESTAMP
                 WHERE pagamento_id = $1`,
                [pagamento_id, aprovado_por]
            );

            return {
                token_ja_existente: true,
                plano: resultadoToken.plano,
                duracao_dias: resultadoToken.duracao_dias,
                mensagem: resultadoToken.mensagem,
            };
        }

        await pool.query(
            `UPDATE pagamentos_manuais
             SET status = 'aprovado', aprovado_em = CURRENT_TIMESTAMP, aprovado_por = $2, token_hash = $3, atualizado_em = CURRENT_TIMESTAMP
             WHERE pagamento_id = $1`,
            [pagamento_id, aprovado_por, calcularHash(resultadoToken.token)]
        );

        return {
            token: resultadoToken.token,
            plano: resultadoToken.plano,
            duracao_dias: resultadoToken.duracao_dias,
            aprovado_em: new Date().toISOString(),
        };
    }
}

export const orquestradorPagamento = new OrquestradorPagamento();
