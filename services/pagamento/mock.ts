import { RespostaCriacaoPagamento, PlanoID, StatusPagamento, ProvedorPagamento } from './tipos';

/**
 * Provedor de Mock para desenvolvimento e testes de UI.
 * Simula o comportamento do Mercado Pago sem chamadas de rede.
 */
export class ProvedorMock implements ProvedorPagamento {
    // Simulador de "banco de dados" em memória para o mock
    private statusSimulado: Record<string, { status: StatusPagamento; tentativas: number }> = {};

    async gerarPix(plano_id: PlanoID): Promise<RespostaCriacaoPagamento> {
        console.log(`[MOCK] Gerando PIX para plano: ${plano_id}`);

        // Simula um delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000));

        const pagamento_id = `mock_${Math.random().toString(36).substr(2, 9)}`;

        // Inicializa o pagamento como pendente
        this.statusSimulado[pagamento_id] = { status: 'pendente', tentativas: 0 };

        return {
            pagamento_id,
            codigo_qr: 'MOCK_QR_CODE_DATA',
            codigo_copia_e_cola: '00020101021226770014br.gov.bcb.pix0155MOCK-PIX-DATA-FOR-TESTING-PURPOSES',
            status: 'pendente'
        };
    }

    async consultarStatus(pagamento_id: string): Promise<StatusPagamento> {
        const registro = this.statusSimulado[pagamento_id];

        if (!registro) return 'falha';

        // Simula a aprovação automática após a 3ª tentativa de polling
        // (Isso permite que o desenvolvedor veja a modal de aguardando por alguns segundos)
        registro.tentativas++;

        if (registro.tentativas >= 3) {
            registro.status = 'aprovado';
            console.log(`[MOCK] Pagamento ${pagamento_id} APROVADO via simulador.`);
        } else {
            console.log(`[MOCK] Pagamento ${pagamento_id} ainda pendente (Tentativa ${registro.tentativas})...`);
        }

        return registro.status;
    }
}
