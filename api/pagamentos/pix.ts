import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fabricaGatewayPagamento } from '../_lib/gateways/fabrica';

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
        const gateway = fabricaGatewayPagamento.obterGateway();

        // O Gateway se vira pra saber se a API dele quer centavos (PagBank) ou real (Mercado Pago)
        const resposta = await gateway.criarPix(plano.valor, plano.descricao);

        // Retorna apenas os dados padronizados pela nossa interface RespostaGatewayPagamento
        return res.status(200).json(resposta);
    } catch (erro) {
        console.error('🔴 [ERRO] Erro na geração do PIX pelo Gateway:', erro);
        return res.status(500).json({ erro: 'Falha na comunicação com o gateway' });
    }
}
