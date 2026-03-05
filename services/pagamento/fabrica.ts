import { ProvedorMercadoPago } from './mercado-pago';
import { ProvedorPagBank } from './pagbank';
import { ProvedorMock } from './mock';
import { ProvedorPagamento } from './tipos';


class FabricaPagamento {
    private instancia: ProvedorPagamento | null = null;

    obterProvedor(): ProvedorPagamento {

        if (!this.instancia) {

            const gatewayPagamento = import.meta.env.VITE_GATEWAY_PAGAMENTO;

            switch (gatewayPagamento) {
                case 'mockado':
                    console.warn('⚠️ [PAGAMENTO] Usando PROVEDOR MOCK (Simulação)');
                    this.instancia = new ProvedorMock();
                    break;

                case 'mercado_pago':
                    this.instancia = new ProvedorMercadoPago();
                    break;

                case 'pagbank':
                    this.instancia = new ProvedorPagBank();
                    break;
                default:
                    throw new Error('Nenhum provedor de pagamento instânciado');
            }
        }
        return this.instancia;
    }
}

export const fabricaPagamento = new FabricaPagamento();
