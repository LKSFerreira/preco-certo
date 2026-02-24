import { ProvedorMercadoPago } from './mercado-pago';
import { ProvedorMock } from './mock';
import { ProvedorPagamento } from './tipos';

class FabricaPagamento {
    private instancia: ProvedorPagamento | null = null;

    obterProvedor(): ProvedorPagamento {
        if (!this.instancia) {
            const usarMock = import.meta.env.VITE_USAR_MOCK_PAGAMENTO === 'true';

            if (usarMock) {
                console.warn('⚠️ [PAGAMENTO] Usando PROVEDOR MOCK (Simulação)');
                this.instancia = new ProvedorMock();
            } else {
                this.instancia = new ProvedorMercadoPago();
            }
        }
        return this.instancia;
    }
}

export const fabricaPagamento = new FabricaPagamento();
