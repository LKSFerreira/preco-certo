import type { VercelRequest, VercelResponse } from '@vercel/node';
import { orquestradorPagamento } from '../../_lib/pagamentos/orquestrador.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Metodo nao permitido' });
    }

    const {
        pagamento_id: pagamentoId,
        plano_id: planoId,
        nome_contato: nomeContato,
        telefone_contato: telefoneContato,
        mensagem,
    } = req.body || {};

    if (!pagamentoId || typeof pagamentoId !== 'string') {
        return res.status(400).json({ erro: 'Campo "pagamento_id" e obrigatorio' });
    }

    if (!planoId || typeof planoId !== 'string') {
        return res.status(400).json({ erro: 'Campo "plano_id" e obrigatorio' });
    }

    if (!nomeContato || typeof nomeContato !== 'string' || nomeContato.trim().length < 3) {
        return res.status(400).json({ erro: 'Campo "nome_contato" e obrigatorio e deve ter ao menos 3 caracteres' });
    }

    if (telefoneContato && typeof telefoneContato !== 'string') {
        return res.status(400).json({ erro: 'Campo "telefone_contato" deve ser texto' });
    }

    if (mensagem && typeof mensagem !== 'string') {
        return res.status(400).json({ erro: 'Campo "mensagem" deve ser texto' });
    }

    try {
        const solicitacao = await orquestradorPagamento.solicitarAprovacaoManual({
            pagamento_id: pagamentoId,
            plano_id: planoId,
            nome_contato: nomeContato.trim(),
            telefone_contato: telefoneContato?.trim() || undefined,
            mensagem: mensagem?.trim() || undefined,
        });

        return res.status(201).json({
            mensagem: 'Solicitacao de aprovacao manual registrada',
            solicitacao,
        });
    } catch (erro: unknown) {
        const mensagemErro = erro instanceof Error ? erro.message : 'Erro desconhecido';
        const erroPlanoInvalido = mensagemErro.toLowerCase().includes('plano invalido');

        if (erroPlanoInvalido) {
            return res.status(400).json({ erro: mensagemErro });
        }

        console.error('🚨 [Pagamentos/Manual/Solicitar] Erro:', erro);
        return res.status(500).json({ erro: 'Erro interno ao registrar solicitacao manual' });
    }
}
