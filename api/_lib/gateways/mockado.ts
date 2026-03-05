import { GatewayPagamento, RespostaGatewayPagamento, RespostaGatewayStatus } from "./tipos";

export class GatewayMockado implements GatewayPagamento {
    private statusSimulado: Record<String, {
        status: StatusPagamento;
        tentativas: number;
        deveFalhar: boolean
    }> = {};
    private contagemTentativas: number = 0; // Controle para que a 1ª vez falhe e a 2ª aprove

    async criarPix(valor: number, descricao: string): Promise<RespostaGatewayPagamento> {
        try {
            console.info(`🔄 [INFO] Gerando pagamento PIX: {valor: ${valor} - descrição: ${descricao}`);

            // SImula um delay de rede
            await new Promise(resolve => setTimeout(resolve, 1000));

            const pagamento_id = `PIX-MOCKADO_${Date.now()}_SEM-SUSTO`;
            this.contagemTentativas++;

            // Inicializa o pagameno como pendente
            this.statusSimulado[pagamento_id] = {
                status: 'pendente',
                tentativas: 0,
                deveFalhar: this.contagemTentativas === 1 // Força a falha na primeira geração
            };

            return {
                pagamento_id,
                status: 'pendente',
                qr_code_base64: '',
                qr_code_copia_e_cola: ''
            }
        } catch (erro) {
            console.error('🔴 [ERRO] Erro ao criar um pagamento PIX:', erro);
            throw new Error('Falha na comunicação com o gateway Mockado');
        }
    }

    async consultarStatus(pagamento_id: string): Promise<RespostaGatewayStatus> {
        const registro = this.statusSimulado[pagamento_id];

        if (!registro) return 'falha';

        if (registro.tentativas <= 2) {
            console.info(`🔄 [INFO] Pagamento ${pagamento_id} ainda pendente (Tentativa ${registro.tentativas})...`);
            return;
        }

        registro.status = registro.deveFalhar ? 'falha' : 'aprovado';
        if (registro.status === 'aprovado') {
            console.log(`✅ [SUCESSO] Pagamento ${pagamento_id} APROVADO via simulador.`);
        } else {
            console.error(`🔴 [ERRO] Pagamento ${pagamento_id} FALHA via simulador.`);
        }

        return {
            pagamento_id: pagamento_id,
            status: registro.deveFalhar ? 'falha' : 'aprovado'
        };

    }
}
