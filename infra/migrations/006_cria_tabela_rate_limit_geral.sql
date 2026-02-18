-- Migration 006: Tabela Genérica de Rate Limiting
-- Data: 2024-02-17
-- Autor: Sem Susto Team

-- Tabela para controlar abusos em endpoints públicos (POST/PUT)
CREATE TABLE IF NOT EXISTS rate_limit_aposta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash VARCHAR(100) NOT NULL,
    endpoint VARCHAR(100) NOT NULL, -- Ex: '/api/produtos'
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para contagem rápida
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint 
ON rate_limit_aposta (ip_hash, endpoint, criado_em);

COMMENT ON TABLE rate_limit_aposta IS 'Logs de requisições para controle de flood/spam';
