export type StatusPagamento = 'pendente' | 'aprovado' | 'falha' | 'expirado';

export interface RespostaCriacaoPagamento {
    pagamento_id: string;
    qr_code_base64: string;
    qr_code_copia_e_cola: string;
    status: StatusPagamento;
}

export type PlanoID = 'plano_cafe' | 'plano_lanche' | 'plano_apoiador';

export interface GatewayPagamento {
    gerarPix(plano_id: PlanoID): Promise<RespostaCriacaoPagamento>;
    consultarStatus(pagamento_id: string): Promise<StatusPagamento>;
}
