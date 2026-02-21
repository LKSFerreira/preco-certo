-- Migration 007: Seeds de Produtos Genéricos
-- Data: 2024-02-21
-- Descrição: Criação de 5 itens curingas para cenários de fallback.

-- Injeta contexto de sessão para satisfazer o Trigger de Auditoria (NOT NULL em usuario_id/ip_hash)
SET LOCAL app.current_user_token = '00000000-0000-0000-0000-000000000000';
SET LOCAL app.client_ip = '127.0.0.1';

INSERT INTO produtos (codigo_barras, descricao, marca, tamanho)
VALUES 
    ('000000000000001', 'Produto Sem Rótulo', 'Sem Marca', 'Unidade'),
    ('000000000000002', 'Produto Sem Rótulo', 'Sem Marca', 'Unidade'),
    ('000000000000003', 'Produto Sem Rótulo', 'Sem Marca', 'Unidade'),
    ('000000000000004', 'Produto Sem Rótulo', 'Sem Marca', 'Unidade'),
    ('000000000000005', 'Produto Sem Rótulo', 'Sem Marca', 'Unidade'),
    ('000000000000006', 'Produto da Feira / A Granel', 'Feira', 'Kg'),
    ('000000000000007', 'Produto da Feira / A Granel', 'Feira', 'Kg'),
    ('000000000000008', 'Produto da Feira / A Granel', 'Feira', 'Kg'),
    ('000000000000009', 'Produto da Feira / A Granel', 'Feira', 'Kg'),
    ('000000000000010', 'Produto da Feira / A Granel', 'Feira', 'Kg'),
    ('000000000000011', 'Produto Genérico (Outros)', 'Diversos', 'Unidade'),
    ('000000000000012', 'Produto Genérico (Outros)', 'Diversos', 'Unidade'),
    ('000000000000013', 'Produto Genérico (Outros)', 'Diversos', 'Unidade'),
    ('000000000000014', 'Produto Genérico (Outros)', 'Diversos', 'Unidade'),
    ('000000000000015', 'Produto Genérico (Outros)', 'Diversos', 'Unidade')
ON CONFLICT (codigo_barras) DO NOTHING;
