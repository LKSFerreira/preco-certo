CREATE TABLE IF NOT EXISTS produtos_adicionados_pelo_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_barras VARCHAR(50) NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    tamanho VARCHAR(50) NOT NULL,
    preco_informado NUMERIC(10, 2),
    imagem TEXT,
    origem VARCHAR(50) NOT NULL DEFAULT 'catalogo_local_usuario',
    status_curadoria VARCHAR(30) NOT NULL DEFAULT 'pendente',
    usuario_id VARCHAR(100) NOT NULL DEFAULT 'anonimo',
    ip_hash VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_produtos_usuario_status_curadoria
        CHECK (status_curadoria IN ('pendente', 'curado', 'rejeitado', 'promovido')),
    CONSTRAINT uq_produtos_usuario_codigo_ip
        UNIQUE (codigo_barras, usuario_id, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_produtos_usuario_status_curadoria
    ON produtos_adicionados_pelo_usuario(status_curadoria);

CREATE INDEX IF NOT EXISTS idx_produtos_usuario_codigo_barras
    ON produtos_adicionados_pelo_usuario(codigo_barras);

CREATE INDEX IF NOT EXISTS idx_produtos_usuario_criado_em
    ON produtos_adicionados_pelo_usuario(criado_em DESC);

DROP TRIGGER IF EXISTS trg_auditoria_produtos_usuario ON produtos_adicionados_pelo_usuario;

CREATE TRIGGER trg_auditoria_produtos_usuario
AFTER INSERT OR UPDATE OR DELETE ON produtos_adicionados_pelo_usuario
FOR EACH ROW EXECUTE FUNCTION trigger_auditoria();

COMMENT ON TABLE produtos_adicionados_pelo_usuario IS
    'Staging de produtos sincronizados do catalogo local do usuario antes de qualquer curadoria/promocao.';
