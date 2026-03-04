# Finalização da Monetização — Fase 0.8.5

## Visão Geral

- **Problema:** Após pagamento aprovado, o app fechava a modal e voltava ao Dashboard sem gerar token nem exibir confirmação ao usuário.
- **Objetivo:** Completar o fluxo end-to-end: pagamento → geração de token server-side → modal de aprovação com opções de ativação, compartilhamento e screenshot.
- **Escopo:** Itens `0.8.5.14` e `0.8.5.21` do roadmap.

## Alterações Realizadas

### Backend

- **[NEW] `api/pagamentos/confirmar.ts`:** Endpoint `POST /api/pagamentos/confirmar` com verificação server-side do status no Mercado Pago, idempotência via coluna `pagamento_id` na tabela `tokens` (índice único parcial), geração de token via `_lib/tokens.ts` e suporte a modo mock para desenvolvimento.
- **[NEW] `infra/migrations/008_adiciona_pagamento_id_tokens.sql`:** Migration que adiciona coluna `pagamento_id` à tabela `tokens` com constraint `UNIQUE` parcial (ignora NULLs para tokens `trial`/manuais).

### Frontend

- **[MODIFY] `components/ModalPagamento.tsx`:** Prop `aoSucesso` alterada de `() => void` para `(pagamento_id: string) => void`, permitindo que o orquestrador (`App.tsx`) identifique qual pagamento foi aprovado.
- **[MODIFY] `App.tsx`:** Lazy import de `ModalPagamentoAprovado`, 4 novos estados (`mostrarModalAprovado`, `tokenGerado`, `diasAtivadosGerado`, `nomePlanoGerado`), callback `aoSucesso` refatorado para chamar `POST /api/pagamentos/confirmar` → receber token → abrir `ModalPagamentoAprovado` com props completas.
- **[FIX] `components/ModalPagamentoAprovado.tsx`:** Removidos números de linha corrompidos (`580:` a `621:`) embutidos no conteúdo real do arquivo que quebravam o build.

### Docs & Config

- **[FIX] `.metadocs/monetizacao.md`:** Preços corrigidos para valores reais do `pix.ts` — Café R$ 2,90, Lanche R$ 4,90, Apoiador R$ 9,90.
- **[NEW] `.metadocs/integracao_pagamento_learning.md`:** Guia conceitual de integração com gateways de pagamento (10 seções, transferível para qualquer linguagem/framework).
- **[ADD] `package.json`:** Dependência `html-to-image@^1.11.13` adicionada (necessária para screenshot do cartão premium).

## Fluxo Implementado

```
ModalPlano → Seleciona plano → ModalPagamento (QR PIX + polling)
    → Pagamento aprovado (animação 5s) → POST /api/pagamentos/confirmar
        → Backend verifica no Mercado Pago → Gera token → Retorna ao frontend
            → ModalPagamentoAprovado (cartão premium com token)
                → Ativar Acesso Agora / WhatsApp / Salvar Foto
```

## Validação

- ✅ Build de produção sem erros (✓ 111 modules, 28.11s)
- ⏳ Teste funcional com Mock pendente (`bash dev.sh --build`)
- ⏳ Teste em produção pendente (deploy + PIX real)
