import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fabricaGatewayPagamento } from '../_lib/gateways/fabrica';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido' });

    const { id } = req.query;

    if (!id || typeof id !== 'string') return res.status(400).json({ erro: 'ID do pagamento não fornecido ou inválido' });

    try {
        const gateway = fabricaGatewayPagamento.obterGateway();
        const resposta = await gateway.consultarStatus(id);

        return res.status(200).json(resposta);
    } catch (erro) {
        console.error('🔴 [ERRO] Erro ao consultar status pelo Gateway:', erro);
        return res.status(500).json({ erro: 'Falha na comunicação com o gateway' });
    }
}
