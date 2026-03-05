import { GatewayPagamento, RespostaGatewayPagamento } from "./tipos";


export class GatewayMercadoPago implements GatewayPagamento {
    private base_url = 'https://api.mercadopago.com/v1';

    async criarPix(valor: number, descricao: string): Promise<RespostaGatewayPagamento> {
        try {
            const resposta = await fetch(`${this.base_url}/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': `pix-${Date.now()}-sem-susto`
                },
                body: JSON.stringify({
                    description: descricao,
                    installments: 1,
                    payer: {
                        email: 'test_user_123@testuser.com',
                    },
                    payment_method_id: 'pix',
                    transaction_amount: valor
                })
            });

            const dados = await resposta.json();

            return {
                pagamento_id: dados.id,
                status: dados.status,
                qr_code_base64: `data:image/png;base64,${dados.point_of_interaction.transaction_data.qr_code_base64}`,
                qr_code_copia_e_cola: dados.point_of_interaction.transaction_data.qr_code
            }

        } catch (erro) {
            console.error('Erro Mercado Pago:', erro);
            return { erro: 'Falha na comunicação com o gateway' };
        }
    }
}
