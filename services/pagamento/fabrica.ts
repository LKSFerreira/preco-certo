import { GatewayMercadoPago } from './mercado-pago';
import { GatewayPagBank } from './pagbank';
import { GatewayMock } from './mock';
import { GatewayPagamento } from './tipos';


class FabricaPagamento {
    private instancia: GatewayPagamento | null = null;

    obterGateway(): GatewayPagamento {

        if (!this.instancia) {

            const gatewayPagamento = import.meta.env.VITE_GATEWAY_PAGAMENTO;

            switch (gatewayPagamento) {
                case 'mockado':
                    console.warn('⚠️ [PAGAMENTO] Usando GATEWAY MOCK (Simulação)');
                    this.instancia = new GatewayMock();
                    break;

                case 'mercado_pago':
                    this.instancia = new GatewayMercadoPago();
                    break;

                case 'pagbank':
                    this.instancia = new GatewayPagBank();
                    break;
                default:
                    throw new Error('Nenhum gateway de pagamento instanciado');
            }
        }
        return this.instancia;
    }
}

export const fabricaPagamento = new FabricaPagamento();
