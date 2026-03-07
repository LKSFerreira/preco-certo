export type StatusPagamento = 'pendente' | 'aprovado' | 'falha' | 'expirado' | 'pendente_manual';
export type ModoConfirmacaoPagamento = 'automatico' | 'manual';

export interface RespostaCriacaoPagamento {
    pagamento_id: string;
    qr_code_base64: string;
    qr_code_copia_e_cola: string;
    status: StatusPagamento;
    modo_confirmacao?: ModoConfirmacaoPagamento;
}

export type PlanoID = 'plano_cafe' | 'plano_lanche' | 'plano_apoiador';

export interface GatewayPagamento {
    gerarPix(plano_id: PlanoID): Promise<RespostaCriacaoPagamento>;
    consultarStatus(pagamento_id: string): Promise<StatusPagamento>;
}

export interface RequisicaoAprovacaoManual {
    pagamento_id: string;
    plano_id: PlanoID;
    nome_contato: string;
    mensagem?: string;
    telefone_contato?: string;
}

export interface RespostaAprovacaoManual {
    pagamento_id: string;
    plano_id: PlanoID;
    status: 'pendente' | 'aprovado' | 'rejeitado';
    criado_em: string;
    atualizado_em: string;
}
