import { GatewayPagamento, RespostaGatewayPagamento, RespostaGatewayStatus } from "./tipos";
import { chavesPixEstaticas } from "./mock_dados";

interface ChavePix {
    plano: string;
    qr_code_base64?: string;
    qr_code_copia_e_cola?: string;
    dados_doacao?: {
        link_nubank?: string;
        qr_code_base64?: string;
        qr_code_copia_e_cola?: string;
        chave_aleatoria_pix?: string;
        mensagem?: string;
    };
}

export class GatewayMockado implements GatewayPagamento {
    async criarPix(valor: number, descricao: string): Promise<RespostaGatewayPagamento> {
        try {
            console.info(`🔄 [INFO] Gerando pagamento PIX (Mock Failover): {valor: ${valor} - descrição: ${descricao}`);

            // Failover: De/Para com base nos valores em monetizacao.md
            let planoNomeArquivo = 'doacao';
            if (valor === 2.90) planoNomeArquivo = 'plano_cafe';
            if (valor === 4.90) planoNomeArquivo = 'plano_lanche';
            if (valor === 9.90) planoNomeArquivo = 'plano_apoiador';

            const dadosPixEstatico = chavesPixEstaticas.find((chavePix: ChavePix) => chavePix.plano === planoNomeArquivo);

            if (!dadosPixEstatico) {
                throw new Error(`QR Code estático para o plano de valor ${valor} não encontrado no JSON de Failover.`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            const idPagamento = `PIX-MOCKADO_${Date.now()}_SEM-SUSTO`;

            // O formato do nó "doacao" tem um sub-objeto "dados_doacao", os outros têm direto na raiz
            const qrCodeBase64 = dadosPixEstatico.dados_doacao ? dadosPixEstatico.dados_doacao.qr_code_base64 : dadosPixEstatico.qr_code_base64;
            const qrCodeCopiaECola = dadosPixEstatico.dados_doacao ? dadosPixEstatico.dados_doacao.qr_code_copia_e_cola : dadosPixEstatico.qr_code_copia_e_cola;

            return {
                pagamento_id: idPagamento,
                status: 'pendente',
                qr_code_base64: qrCodeBase64 || '',
                qr_code_copia_e_cola: qrCodeCopiaECola || ''
            }
        } catch (erro) {
            console.error('🔴 [ERRO] Erro ao carregar PIX Mockado (Failover):', erro);
            throw new Error('Falha na comunicação com o gateway Mockado');
        }
    }

    async consultarStatus(idPagamento: string): Promise<RespostaGatewayStatus> {
        // Failover Estático: Aguarda o suporte manualmente emitir o token após o comprovante.
        // Diferente das simulações de sandbox, esse status nunca transicionará sozinho.
        console.info(`🔄 [INFO] Status Pagamento (Mock Failover) ${idPagamento} permanece PENDENTE.`);

        return {
            pagamento_id: idPagamento,
            status: 'pendente'
        };
    }
}
