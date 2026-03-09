-- Migration 010: Telemetria agregada de comportamento de produtos
-- Data: 2026-03-08
-- Autor: Sem Susto Team

CREATE TABLE IF NOT EXISTS telemetria_produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
    evento VARCHAR(50) NOT NULL,
    origem VARCHAR(50) NOT NULL,
    codigo_barras VARCHAR(50) NOT NULL,
    usuario_id VARCHAR(100) NOT NULL,
    ip_hash VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    primeiro_evento_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_evento_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    CONSTRAINT uq_telemetria_produtos_agregada
        UNIQUE (data_referencia, evento, origem, codigo_barras, usuario_id, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_telemetria_produtos_data
    ON telemetria_produtos(data_referencia);

CREATE INDEX IF NOT EXISTS idx_telemetria_produtos_evento
    ON telemetria_produtos(evento);

CREATE INDEX IF NOT EXISTS idx_telemetria_produtos_codigo
    ON telemetria_produtos(codigo_barras);

CREATE INDEX IF NOT EXISTS idx_telemetria_produtos_ultima_ocorrencia
    ON telemetria_produtos(ultimo_evento_em DESC);

COMMENT ON TABLE telemetria_produtos IS 'Telemetria agregada diária de comportamento de produtos, separada da auditoria operacional';
COMMENT ON COLUMN telemetria_produtos.evento IS 'Evento de comportamento, ex: produto_encontrado, produto_nao_encontrado';
COMMENT ON COLUMN telemetria_produtos.origem IS 'Origem funcional do evento, ex: api_produtos_get';
COMMENT ON COLUMN telemetria_produtos.quantidade IS 'Quantidade agregada de ocorrências para a chave diária do evento';
