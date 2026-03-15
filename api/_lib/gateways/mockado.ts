import { GatewayPagamento, RespostaGatewayPagamento, RespostaGatewayStatus } from "./tipos.js";
import { chavesPixEstaticas } from "./mock_dados.js";

interface ChavePix {
    plano: string;
    qr_code_base64?: string;
    qr_code_copia_e_cola?: string;
    dados_doacao?: {
        qr_code_base64?: string;
        qr_code_copia_e_cola?: string;
    };
}

type RegistroStatus = {
    status: 'pendente' | 'aprovado' | 'falha';
    deveFalhar: boolean;
};

export class GatewayMockado implements GatewayPagamento {
    private statusSimulado: Record<string, RegistroStatus> = {};
    private proximaTentativaDeveFalhar = true;

    async criarPix(valor: number, descricao: string): Promise<RespostaGatewayPagamento> {
        try {
            console.info(`🔄 [INFO] Gerando pagamento PIX Mockado: {valor: ${valor}, descricao: ${descricao}}`);

            let planoNomeArquivo = 'doacao';
            if (valor === 2.90) planoNomeArquivo = 'plano_cafe';
            if (valor === 4.90) planoNomeArquivo = 'plano_lanche';
            if (valor === 9.90) planoNomeArquivo = 'plano_apoiador';

            const dadosPixEstatico = chavesPixEstaticas.find((chavePix: ChavePix) => chavePix.plano === planoNomeArquivo);

            if (!dadosPixEstatico) {
                throw new Error(`QR Code estático para valor ${valor} não encontrado no JSON mockado.`);
            }

            await new Promise(resolve => setTimeout(resolve, 800));

            const sufixo = this.proximaTentativaDeveFalhar ? 'FAIL' : 'OK';
            const idPagamento = `PIX-MOCKADO_${Date.now()}_${sufixo}_SEM-SUSTO`;

            this.statusSimulado[idPagamento] = {
                status: 'pendente',
                // Regra de negocio: falha -> aprova -> falha -> aprova.
                deveFalhar: this.proximaTentativaDeveFalhar
            };
            this.proximaTentativaDeveFalhar = !this.proximaTentativaDeveFalhar;

            console.info(`✅ [MOCK] Pagamento gerado: ${idPagamento} (Próxima tentativa deve falhar? ${this.proximaTentativaDeveFalhar})`);

            const qrCodeBase64 = dadosPixEstatico.dados_doacao?.qr_code_base64 ?? dadosPixEstatico.qr_code_base64;
            const qrCodeCopiaECola = dadosPixEstatico.dados_doacao?.qr_code_copia_e_cola ?? dadosPixEstatico.qr_code_copia_e_cola;

            return {
                pagamento_id: idPagamento,
                status: 'pendente',
                qr_code_base64: qrCodeBase64 || '',
                qr_code_copia_e_cola: qrCodeCopiaECola || '',
                modo_confirmacao: 'automatico'
            };
        } catch (erro) {
            console.error('🔴 [ERRO] Erro ao carregar PIX Mockado:', erro);
            throw new Error('Falha na comunicação com o gateway Mockado');
        }
    }

    async consultarStatus(idPagamento: string): Promise<RespostaGatewayStatus> {
        const registro = this.statusSimulado[idPagamento];

        // Se o registro não existir em memória (comum em serverless/Vercel entre requisições),
        // deduzimos o status baseado no sufixo inserido no ID durante a criação.
        if (!registro) {
            console.warn(`⚠️ [MOCK] Registro ${idPagamento} não encontrado em memória. Deduzindo status pelo ID.`);
            
            if (idPagamento.includes('_OK_')) {
                return { pagamento_id: idPagamento, status: 'aprovado' };
            }
            
            if (idPagamento.includes('_FAIL_')) {
                return { pagamento_id: idPagamento, status: 'falha' };
            }

            return { pagamento_id: idPagamento, status: 'falha' };
        }

        if (registro.status === 'pendente') {
            registro.status = registro.deveFalhar ? 'falha' : 'aprovado';
        }

        return {
            pagamento_id: idPagamento,
            status: registro.status
        };
    }
}
