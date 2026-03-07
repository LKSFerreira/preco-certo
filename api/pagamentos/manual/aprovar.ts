import type { VercelRequest, VercelResponse } from '@vercel/node';
import { orquestradorPagamento } from '../../_lib/pagamentos/orquestrador.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Metodo nao permitido' });
    }

    const segredoRecebido = req.headers['x-api-secret'];
    const segredoEsperado = process.env.API_SECRET;

    if (!segredoEsperado || segredoRecebido !== segredoEsperado) {
        return res.status(403).json({ erro: 'Acesso negado' });
    }

    const { pagamento_id: pagamentoId, aprovado_por: aprovadoPor } = req.body || {};

    if (!pagamentoId || typeof pagamentoId !== 'string') {
        return res.status(400).json({ erro: 'Campo "pagamento_id" e obrigatorio' });
    }

    if (aprovadoPor && typeof aprovadoPor !== 'string') {
        return res.status(400).json({ erro: 'Campo "aprovado_por" deve ser texto' });
    }

    try {
        const resposta = await orquestradorPagamento.aprovarPagamentoManual({
            pagamento_id: pagamentoId,
            aprovado_por: aprovadoPor?.trim() || 'suporte',
        });

        return res.status(200).json(resposta);
    } catch (erro: unknown) {
        const mensagemErro = erro instanceof Error ? erro.message : 'Erro desconhecido';
        const solicitacaoNaoEncontrada = mensagemErro.toLowerCase().includes('nao encontrada');
        const solicitacaoRejeitada = mensagemErro.toLowerCase().includes('rejeitada');

        if (solicitacaoNaoEncontrada) {
            return res.status(404).json({ erro: mensagemErro });
        }

        if (solicitacaoRejeitada) {
            return res.status(409).json({ erro: mensagemErro });
        }

        console.error('🚨 [Pagamentos/Manual/Aprovar] Erro:', erro);
        return res.status(500).json({ erro: 'Erro interno ao aprovar pagamento manual' });
    }
}
