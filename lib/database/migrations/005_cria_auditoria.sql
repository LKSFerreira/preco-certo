-- Migration 005: Criação do Sistema de Auditoria via Triggers
-- Data: 2024-02-17
-- Autor: Sem Susto Team

-- 1. Criação da Tabela de Logs
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Onde e O que
    tabela VARCHAR(50) NOT NULL,
    operacao VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    
    -- Conteúdo (JSONB para flexibilidade)
    dados_antigos JSONB, -- NULL em INSERT
    dados_novos JSONB,   -- NULL em DELETE
    
    -- Quem (Contexto injetado via SET LOCAL)
    usuario_id VARCHAR(100) NOT NULL, -- Token do usuário (anonimo) ou ID (auth)
    ip_hash VARCHAR(100) NOT NULL,     -- Hash do IP para rastreio sem violar LGPD
    
    -- Quando
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consulta rápida de histórico
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela_id ON auditoria_logs(tabela);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria_logs(criado_em);

-- 2. Função do Gatilho (Trigger Function)
CREATE OR REPLACE FUNCTION trigger_auditoria()
RETURNS TRIGGER AS $$
DECLARE
    v_usuario_id VARCHAR;
    v_ip_hash VARCHAR;
    v_dados_antigos JSONB;
    v_dados_novos JSONB;
BEGIN
    -- Tenta capturar variáveis de sessão injetadas pela aplicação
    -- Se não estiverem setadas, assume 'sistema' ou NULL
    BEGIN
        v_usuario_id := current_setting('app.current_user_token', true);
        v_ip_hash := current_setting('app.client_ip', true);
    EXCEPTION WHEN OTHERS THEN
        v_usuario_id := 'sistema';
        v_ip_hash := NULL;
    END;

    -- Define os payloads JSON baseados na operação
    IF (TG_OP = 'DELETE') THEN
        v_dados_antigos := row_to_json(OLD)::JSONB;
        v_dados_novos := NULL;
    ELSIF (TG_OP = 'INSERT') THEN
        v_dados_antigos := NULL;
        v_dados_novos := row_to_json(NEW)::JSONB;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_dados_antigos := row_to_json(OLD)::JSONB;
        v_dados_novos := row_to_json(NEW)::JSONB;
    END IF;

    -- Insere o log
    INSERT INTO auditoria_logs (
        tabela, 
        operacao, 
        dados_antigos, 
        dados_novos, 
        usuario_id, 
        ip_hash
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        v_dados_antigos,
        v_dados_novos,
        v_usuario_id,
        v_ip_hash
    );

    -- Retorna o registro para que a operação original prossiga
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Aplicação do Gatilho na Tabela Produtos
DROP TRIGGER IF EXISTS trg_auditoria_produtos ON produtos;

CREATE TRIGGER trg_auditoria_produtos
AFTER INSERT OR UPDATE OR DELETE ON produtos
FOR EACH ROW EXECUTE FUNCTION trigger_auditoria();

-- Comentários
COMMENT ON TABLE auditoria_logs IS 'Registro imutável de todas as alterações de escrita no banco';
COMMENT ON COLUMN auditoria_logs.usuario_id IS 'Capturado de app.current_user_token (injetado pela API)';
