-- Migration 009: Fila manual de aprovacao de pagamentos
-- Data: 2026-03-05
-- Autor: Sem Susto Team
--
-- Suporta o fluxo de failover manual (ex: Nubank estatico), registrando
-- solicitacoes de comprovante para aprovacao humana no backoffice.

CREATE TABLE IF NOT EXISTS pagamentos_manuais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pagamento_id TEXT NOT NULL UNIQUE,
    plano_id VARCHAR(30) NOT NULL,
    nome_contato VARCHAR(120) NOT NULL,
    telefone_contato VARCHAR(30),
    mensagem TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    token_hash VARCHAR(64),
    aprovado_por VARCHAR(80),
    aprovado_em TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_pagamentos_manuais_status CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    CONSTRAINT chk_pagamentos_manuais_plano CHECK (plano_id IN ('plano_cafe', 'plano_lanche', 'plano_apoiador'))
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_manuais_status_criado_em
ON pagamentos_manuais(status, criado_em DESC);

COMMENT ON TABLE pagamentos_manuais IS 'Fila de aprovacao manual de pagamentos para gateways sem webhook/consulta automatica.';
COMMENT ON COLUMN pagamentos_manuais.pagamento_id IS 'Identificador gerado no momento da criacao do PIX no backend.';
COMMENT ON COLUMN pagamentos_manuais.status IS 'Estado atual da solicitacao manual: pendente, aprovado ou rejeitado.';
