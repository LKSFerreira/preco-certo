import type { VercelRequest, VercelResponse } from '@vercel/node';
import { orquestradorPagamento } from '../_lib/pagamentos/orquestrador.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Método não permitido' });
    }

    const { pagamento_id: pagamentoId, plano_id: planoId } = req.body || {};

    if (!pagamentoId || typeof pagamentoId !== 'string') {
        return res.status(400).json({ erro: 'Campo "pagamento_id" é obrigatório' });
    }

    if (!planoId || typeof planoId !== 'string') {
        return res.status(400).json({ erro: 'Campo "plano_id" é obrigatório' });
    }

    try {
        const resultado = await orquestradorPagamento.confirmarPagamento(pagamentoId, planoId);

        if (resultado.tipo === 'token_gerado') {
            return res.status(201).json({
                token: resultado.token,
                plano: resultado.plano,
                duracao_dias: resultado.duracao_dias,
            });
        }

        if (resultado.tipo === 'token_existente') {
            return res.status(200).json({
                token_ja_existente: true,
                plano: resultado.plano,
                duracao_dias: resultado.duracao_dias,
                mensagem: resultado.mensagem,
            });
        }

        if (resultado.tipo === 'manual_necessaria') {
            return res.status(409).json({
                manual_necessaria: true,
                mensagem: resultado.mensagem,
            });
        }

        return res.status(400).json({
            erro: 'Pagamento não está aprovado',
            status_atual: resultado.status_atual,
        });
    } catch (erro: unknown) {
        const mensagemErro = erro instanceof Error ? erro.message : 'Erro desconhecido';
        const erroPlanoInvalido = mensagemErro.toLowerCase().includes('plano inválido');

        if (erroPlanoInvalido) {
            return res.status(400).json({ erro: mensagemErro });
        }

        console.error('🚨 [Pagamentos/Confirmar] Erro:', erro);
        return res.status(500).json({ erro: 'Erro interno ao confirmar pagamento' });
    }
}
