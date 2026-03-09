import { GatewayPagamento, RespostaGatewayPagamento, RespostaGatewayStatus } from "./tipos";

export class GatewayPagBank implements GatewayPagamento {
    // Sandbox URL do PagBank
    private base_url_sandbox = 'https://sandbox.api.pagseguro.com/orders/';
    private base_url = 'https://api.pagseguro.com/orders/';
    private access_token = process.env.PG_ACCESS_TOKEN;
    private sandboxAtivo = true;

    async criarPix(valor: number, descricao: string): Promise<RespostaGatewayPagamento> {
        try {
            // Documentação PagBank: https://developer.pagbank.com.br/reference/obter-pedido
            const resposta = await fetch(`${this.sandboxAtivo ? this.base_url_sandbox : this.base_url}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reference_id: `PIX_PAGBANK_${Date.now()}_SEM-SUSTO`,
                    items: [
                        {
                            name: descricao,
                            quantity: 1,
                            unit_amount: Math.round(valor * 100) // PagBank exige valor em centavos (inteiro)
                        }
                    ],
                    customer: {
                        tax_id: "00000000000" // CPF genérico para sandbox (ou vazio dependendo da doc)
                    },
                    qr_codes: [
                        {
                            amount: {
                                value: Math.round(valor * 100)
                            }
                        }
                    ]
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                console.error('Erro PagBank (Criar PIX) Detalhes:', JSON.stringify(dados, null, 2));
                throw new Error(`Falha no PagBank: ${resposta.status}`);
            }

            // O PagBank retorna o QR Code dentro de um array associado à resposta do pedido
            const qr_code_data = dados.qr_codes[0];

            return {
                pagamento_id: dados.id,
                status: 'WAITING', // Status inicial padrão do PagBank para PIX gerado
                // PagBank sandbox não retorna base64 do QR code na API de orders padrão.
                // Apenas as strings text e png (link)
                qr_code_base64: qr_code_data.links.find((l: any) => l.media === 'image/png')?.href || '',
                qr_code_copia_e_cola: qr_code_data.text
            }

        } catch (erro) {
            console.error('Erro PagBank (Criar):', erro);
            throw new Error('Falha na comunicação com o gateway PagBank');
        }
    }

    async consultarStatus(pagamento_id: string): Promise<RespostaGatewayStatus> {
        try {
            const resposta = await fetch(`${this.sandboxAtivo ? this.base_url_sandbox : this.base_url}${pagamento_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                console.error('Erro PagBank (Consultar Status):', JSON.stringify(dados, null, 2));
                throw new Error(`Falha no PagBank: ${resposta.status}`);
            }

            // PagBank retorna o status do charge, sendo o charge do PIX o primeiro do array
            const charge_status = dados.charges?.[0]?.status || dados.status;

            return {
                pagamento_id: dados.id,
                status: charge_status // Ex: WAITING, PAID, DECLINED, CANCELED
            }
        } catch (erro) {
            console.error('Erro PagBank (Consultar):', erro);
            throw new Error('Falha na comunicação com o gateway PagBank');
        }
    }
}
