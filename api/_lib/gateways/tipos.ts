
export interface RespostaGatewayPagamento {
    pagamento_id: string;
    status: string;
    qr_code_base64: string;
    qr_code_copia_e_cola: string;
    modo_confirmacao?: 'automatico' | 'manual';
}

export interface RespostaGatewayStatus {
    pagamento_id: string;
    status: string;
}

export interface GatewayPagamento {
    criarPix(valor: number, descricao: string): Promise<RespostaGatewayPagamento>;
    consultarStatus(pagamento_id: string): Promise<RespostaGatewayStatus>;
}
