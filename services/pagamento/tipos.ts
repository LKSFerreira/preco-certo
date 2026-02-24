export type StatusPagamento = 'pendente' | 'aprovado' | 'falha' | 'expirado';

export interface RespostaCriacaoPagamento {
    pagamento_id: string;
    codigo_qr: string;
    codigo_copia_e_cola: string;
    status: StatusPagamento;
}

export type PlanoID = 'plano_cafe' | 'plano_lanche' | 'plano_apoiador';

export interface ProvedorPagamento {
    gerarPix(plano_id: PlanoID): Promise<RespostaCriacaoPagamento>;
    consultarStatus(pagamento_id: string): Promise<StatusPagamento>;
}
