import type { VercelRequest, VercelResponse } from '@vercel/node';
import { orquestradorPagamento } from '../_lib/pagamentos/orquestrador.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Metodo nao permitido' });
    }

    const { plano_id: planoId } = req.body || {};

    if (!planoId || typeof planoId !== 'string') {
        return res.status(400).json({ erro: 'Campo "plano_id" e obrigatorio' });
    }

    try {
        const resposta = await orquestradorPagamento.gerarPix(planoId);
        return res.status(200).json(resposta);
    } catch (erro: unknown) {
        const mensagemErro = erro instanceof Error ? erro.message : 'Erro desconhecido';
        const erroPlanoInvalido = mensagemErro.toLowerCase().includes('plano invalido');

        if (erroPlanoInvalido) {
            return res.status(400).json({ erro: mensagemErro });
        }

        console.error('🔴 [Pagamentos/Pix] Erro:', erro);
        return res.status(500).json({ erro: 'Falha na comunicacao com o gateway' });
    }
}
