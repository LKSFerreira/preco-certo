import { RespostaCriacaoPagamento, PlanoID, StatusPagamento, ProvedorPagamento } from './tipos';

/**
 * Provedor de Mock para desenvolvimento e testes de UI.
 * Simula o comportamento do Mercado Pago sem chamadas de rede.
 */
export class ProvedorMock implements ProvedorPagamento {
    // Simulador de "banco de dados" em memória para o mock
    private statusSimulado: Record<string, { status: StatusPagamento; tentativas: number; deveFalhar: boolean }> = {};
    private contagemGeracoes = 0; // Controle para que a 1ª vez falhe e a 2ª aprove

    async gerarPix(plano_id: PlanoID): Promise<RespostaCriacaoPagamento> {
        console.log(`[MOCK] Gerando PIX para plano: ${plano_id}`);

        // Simula um delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000));

        const pagamento_id = `mock_${Math.random().toString(36).substr(2, 9)}`;
        this.contagemGeracoes++; // Incrementa a cada nova geração de PIX

        // Inicializa o pagamento como pendente
        this.statusSimulado[pagamento_id] = { 
            status: 'pendente', 
            tentativas: 0,
            deveFalhar: this.contagemGeracoes === 1 // A primeira geração vai forçar falha
        };

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
            registro.status = registro.deveFalhar ? 'falha' : 'aprovado';
            console.log(`[MOCK] Pagamento ${pagamento_id} ${registro.status.toUpperCase()} via simulador.`);
        } else {
            console.log(`[MOCK] Pagamento ${pagamento_id} ainda pendente (Tentativa ${registro.tentativas})...`);
        }

        return registro.status;
    }
}
