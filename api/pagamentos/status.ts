import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido' });

    const { id } = req.query;

    if (!id) return res.status(400).json({ erro: 'ID do pagamento não fornecido' });

    try {
        const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            }
        });

        if (!resposta.ok) {
            return res.status(resposta.status).json({ erro: 'Erro ao consultar status no Mercado Pago' });
        }

        const dados = await resposta.json();

        return res.status(200).json({
            id: dados.id,
            status: dados.status, // Retorna status original (pending, approved, etc)
        });
    } catch (erro) {
        console.error('Erro ao consultar status:', erro);
        return res.status(500).json({ erro: 'Falha na comunicação com o gateway' });
    }
}
