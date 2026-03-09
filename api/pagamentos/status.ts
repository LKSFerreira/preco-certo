import type { VercelRequest, VercelResponse } from '@vercel/node';
import { orquestradorPagamento } from '../_lib/pagamentos/orquestrador.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ erro: 'Método não permitido' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ erro: 'ID do pagamento não fornecido ou inválido' });
    }

    try {
        const resposta = await orquestradorPagamento.consultarStatus(id);
        return res.status(200).json(resposta);
    } catch (erro) {
        console.error('🔴 [Pagamentos/Status] Erro:', erro);
        return res.status(500).json({ erro: 'Falha na comunicação com o gateway' });
    }
}
