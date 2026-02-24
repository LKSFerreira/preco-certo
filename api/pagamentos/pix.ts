import type { VercelRequest, VercelResponse } from '@vercel/node';

// Fonte da verdade para preços (Backend Only)
const TABELA_PRECOS = {
    plano_cafe: { valor: 2.90, descricao: 'Plano Café - 15 dias' },
    plano_lanche: { valor: 4.90, descricao: 'Plano Lanche - 30 dias' },
    plano_apoiador: { valor: 9.90, descricao: 'Plano Apoiador - 60 dias' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

    const { plano_id } = req.body;
    const plano = TABELA_PRECOS[plano_id as keyof typeof TABELA_PRECOS];

    if (!plano) return res.status(400).json({ erro: 'Plano inválido' });

    try {
        // Integração real com Mercado Pago via fetch (Server-side)
        // Nota: Usando fetch nativo da Vercel para evitar dependências extras no MVP
        const resposta = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `pix-${Date.now()}-${plano_id}`
            },
            body: JSON.stringify({
                transaction_amount: plano.valor,
                description: plano.descricao,
                payment_method_id: 'pix',
                payer: {
                    email: 'anonimo@semsusto.app', // Mantendo o anonimato conforme monetizacao.md
                }
            })
        });

        const dados = await resposta.json();

        // Retorna apenas o necessário para o frontend
        return res.status(200).json({
            id: dados.id,
            status: dados.status,
            qr_code: dados.point_of_interaction.transaction_data.qr_code,
            qr_code_base64: `data:image/png;base64,${dados.point_of_interaction.transaction_data.qr_code_base64}`
        });
    } catch (erro) {
        console.error('Erro Mercado Pago:', erro);
        return res.status(500).json({ erro: 'Falha na comunicação com o gateway' });
    }
}
