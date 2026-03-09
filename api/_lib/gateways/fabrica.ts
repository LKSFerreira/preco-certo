import { GatewayPagamento } from "./tipos";
import { GatewayMercadoPago } from "./mercado-pago";
import { GatewayPagBank } from "./pagbank";
import { GatewayMockado } from "./mockado";
import { GatewayNubankFailover } from "./nubank-failover";

class FabricaGatewayPagamento {
    private instancia: GatewayPagamento | null = null;
    private gatewayPagamentoBackend = process.env.GATEWAY_PAGAMENTO_BACKEND;

    obterGateway(): GatewayPagamento {
        if (!this.instancia) {
            switch (this.gatewayPagamentoBackend) {
                case 'mockado':
                    console.warn('⚠️ [AVISO] Usando GATEWAY MOCK (simulação automatizada)');
                    this.instancia = new GatewayMockado();
                    break;
                case 'nubank_failover':
                    console.warn('⚠️ [AVISO] Usando GATEWAY NUBANK FAILOVER (confirmação manual)');
                    this.instancia = new GatewayNubankFailover();
                    break;
                case 'mercado_pago':
                    this.instancia = new GatewayMercadoPago();
                    break;
                case 'pagbank':
                    this.instancia = new GatewayPagBank();
                    break;
                default:
                    throw new Error("Nenhum gateway de pagamento foi instanciado no backend");
            }
        }

        return this.instancia;
    }
}

export const fabricaGatewayPagamento = new FabricaGatewayPagamento();
