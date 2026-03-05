import { GatewayPagamento, RespostaGatewayPagamento, RespostaGatewayStatus } from "./tipos";


export class GatewayMercadoPago implements GatewayPagamento {
    private base_url = 'https://api.mercadopago.com/v1/payments/';
    // O sandbox do Mercado Pago é implementado via ACCESS_TOKEN
    private access_token = process.env.MP_ACCESS_TOKEN;

    async criarPix(valor: number, descricao: string): Promise<RespostaGatewayPagamento> {
        try {
            const resposta = await fetch(`${this.base_url}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.access_token}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': `PIX_${Date.now()}_SEM-SUSTO`
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

            if (!resposta.ok) {
                console.error('Erro Mercado Pago (Criar PIX) Detalhes:', JSON.stringify(dados, null, 2));
                throw new Error(`Falha no Mercado Pago: ${resposta.status}`);
            }

            return {
                pagamento_id: dados.id,
                status: dados.status,
                qr_code_base64: `data:image/png;base64,${dados.point_of_interaction.transaction_data.qr_code_base64}`,
                qr_code_copia_e_cola: dados.point_of_interaction.transaction_data.qr_code
            }

        } catch (erro) {
            console.error('Erro Mercado Pago:', erro);
            throw new Error('Falha na comunicação com o gateway Mercado Pago');
        }
    }

    async consultarStatus(pagamento_id: string): Promise<RespostaGatewayStatus> {
        try {
            const resposta = await fetch(`${this.base_url}${pagamento_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.access_token}`,
                }
            });

            if (!resposta.ok) {
                console.error('Erro Mercado Pago (Consultar Status)', resposta.status);
                throw new Error(`Falha no Mercado Pago: ${resposta.status}`);
            }

            const dados = await resposta.json();

            return {
                pagamento_id: dados.id,
                status: dados.status, // Retorna status original (pending, approved, etc)
            };
        } catch (erro) {
            console.error('Erro ao consultar status:', erro);
            throw new Error('Falha na comunicação com o gateway Mercado Pago');
        }
    }
}
