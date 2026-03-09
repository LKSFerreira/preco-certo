import { GatewayPagamento, RespostaGatewayPagamento, RespostaGatewayStatus } from "./tipos";
import { chavesPixEstaticas } from "./mock_dados";

interface ChavePix {
    plano: string;
    qr_code_base64?: string;
    qr_code_copia_e_cola?: string;
    dados_doacao?: {
        qr_code_base64?: string;
        qr_code_copia_e_cola?: string;
    };
}

export class GatewayNubankFailover implements GatewayPagamento {
    async criarPix(valor: number, descricao: string): Promise<RespostaGatewayPagamento> {
        try {
            console.info(`🔄 [INFO] Gerando PIX via failover manual Nubank: {valor: ${valor}, descricao: ${descricao}}`);

            let planoNomeArquivo = 'doacao';
            if (valor === 2.90) planoNomeArquivo = 'plano_cafe';
            if (valor === 4.90) planoNomeArquivo = 'plano_lanche';
            if (valor === 9.90) planoNomeArquivo = 'plano_apoiador';

            const dadosPixEstatico = chavesPixEstaticas.find((chavePix: ChavePix) => chavePix.plano === planoNomeArquivo);

            if (!dadosPixEstatico) {
                throw new Error(`QR Code estático para valor ${valor} não encontrado no JSON de failover.`);
            }

            const idPagamento = `PIX-NUBANK-FAILOVER_${Date.now()}_SEM-SUSTO`;
            const qrCodeBase64 = dadosPixEstatico.dados_doacao?.qr_code_base64 ?? dadosPixEstatico.qr_code_base64;
            const qrCodeCopiaECola = dadosPixEstatico.dados_doacao?.qr_code_copia_e_cola ?? dadosPixEstatico.qr_code_copia_e_cola;

            return {
                pagamento_id: idPagamento,
                status: 'pendente',
                qr_code_base64: qrCodeBase64 || '',
                qr_code_copia_e_cola: qrCodeCopiaECola || '',
                modo_confirmacao: 'manual'
            };
        } catch (erro) {
            console.error('🔴 [ERRO] Erro ao carregar PIX Nubank Failover:', erro);
            throw new Error('Falha na comunicação com o failover manual Nubank');
        }
    }

    async consultarStatus(idPagamento: string): Promise<RespostaGatewayStatus> {
        console.info(`🔄 [INFO] Status Pagamento (Nubank Failover) ${idPagamento} permanece pendente até confirmação manual.`);

        return {
            pagamento_id: idPagamento,
            status: 'pendente'
        };
    }
}
