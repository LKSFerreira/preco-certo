-- Migration 008: Adiciona pagamento_id à tabela tokens
-- Data: 2026-03-04
-- Autor: Sem Susto Team
--
-- Permite rastrear qual pagamento gerou qual token (idempotência).
-- Se o frontend chamar /api/pagamentos/confirmar duas vezes com o
-- mesmo pagamento_id, o sistema retorna o token já existente em vez
-- de gerar um novo.

ALTER TABLE tokens ADD COLUMN IF NOT EXISTS pagamento_id TEXT;

-- Índice único para garantir idempotência: um pagamento = um token
CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_pagamento_id ON tokens(pagamento_id)
  WHERE pagamento_id IS NOT NULL;

COMMENT ON COLUMN tokens.pagamento_id IS 'ID do pagamento no gateway (Mercado Pago) que originou este token. Garante idempotência.';
