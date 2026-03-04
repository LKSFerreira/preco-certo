# Finalização da Monetização — Fase 0.8.5

Itens `0.8.5.14` e `0.8.5.21` do roadmap: integrar a [ModalPagamentoAprovado](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPagamentoAprovado.tsx#5-12) no fluxo real e gerar o token automaticamente após pagamento aprovado.

## Diagnóstico do Estado Atual

O fluxo de pagamento hoje está **quase completo**, mas com um elo faltante:

```
ModalPlano → Usuário paga → ModalPagamento (polling) → Aprovado! → ???
                                                                    ↑
                                                          aoSucesso apenas fecha a modal
                                                          e volta ao Dashboard (linha 757-762 App.tsx)
```

A [ModalPagamentoAprovado](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPagamentoAprovado.tsx#5-12) (241 linhas) já existe com UI premium completa:
- Cartão capturável em PNG (screenshot)
- Botão "Ativar Acesso Agora"
- Enviar via WhatsApp
- Salvar imagem na galeria

Porém **não está conectada a nada** — nenhum outro arquivo a importa.

## User Review Required

> [!IMPORTANT]
> **Novo endpoint backend:** Será criado `POST /api/pagamentos/confirmar` que recebe `pagamento_id` + `plano_id`, verifica se o pagamento está realmente aprovado no Mercado Pago, e só então gera o token. Isso é mais seguro do que gerar o token diretamente no frontend.

> [!WARNING]
> **Dependência `html-to-image`:** A [ModalPagamentoAprovado](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPagamentoAprovado.tsx#5-12) já importa `html-to-image` (para screenshot do cartão), mas a lib **não está instalada** no [package.json](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/package.json). Precisaremos instalar via `docker compose exec app npm install html-to-image`.

> [!IMPORTANT]
> **Preços divergentes:** [monetizacao.md](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/.metadocs/monetizacao.md) lista R$ 4,90 / R$ 6,90 / R$ 12,90, mas [pix.ts](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/api/pagamentos/pix.ts) usa R$ 2,90 / R$ 4,90 / R$ 9,90. Qual é a fonte correta? Isso não bloqueia a implementação da 0.8.5, mas vale alinhar.

---

## Proposed Changes

### Backend — Novo Endpoint de Confirmação

#### [NEW] [confirmar.ts](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/api/pagamentos/confirmar.ts)

Endpoint `POST /api/pagamentos/confirmar` que:
1. Recebe `pagamento_id` e `plano_id` do frontend
2. Consulta o Mercado Pago para confirmar que o pagamento está realmente `approved` (segurança server-side)
3. Chama a lógica interna de [_lib/tokens.ts](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/api/_lib/tokens.ts) para gerar o token
4. Retorna `{ token, plano, duracao_dias }` para o frontend

Segurança:
- **Não** é protegido por `X-API-Secret` (é chamado pelo frontend direto)
- A proteção é a **verificação real do status no gateway** (se o pagamento não está aprovado, não gera token)
- Idempotência: se já existe token para esse `pagamento_id`, retorna o existente

Para idempotência, será adicionada a coluna `pagamento_id` na tabela `tokens` para rastrear qual pagamento gerou qual token.

---

### Backend — Migration de Idempotência

#### [NEW] [004_pagamento_id_tokens.sql](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/infra/migrations/004_pagamento_id_tokens.sql)

```sql
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS pagamento_id TEXT UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_pagamento_id ON tokens(pagamento_id);
```

---

### Frontend — Integração no App.tsx

#### [MODIFY] [App.tsx](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/App.tsx)

Mudanças:
1. **Novos estados:** `mostrarModalAprovado`, `tokenGerado`, `diasAtivados`, `nomePlanoGerado`
2. **Lazy import** de [ModalPagamentoAprovado](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPagamentoAprovado.tsx#5-12)
3. **Refatorar `aoSucesso`** do [ModalPagamento](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPagamento.tsx#217-474): em vez de fechar e voltar ao Dashboard, chama `POST /api/pagamentos/confirmar` → recebe token → abre [ModalPagamentoAprovado](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPagamentoAprovado.tsx#5-12)
4. **Renderizar [ModalPagamentoAprovado](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPagamentoAprovado.tsx#5-12)** passando: `token`, `diasAtivados`, [plano](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/api/_lib/tokens.ts#80-89), `aoAtivarCallback`, `aoFechar`

Fluxo novo:
```
ModalPagamento → aprovado → chama /api/pagamentos/confirmar → recebe token
    → fecha ModalPagamento → abre ModalPagamentoAprovado
        → Usuário ativa / salva WhatsApp / baixa screenshot
            → fecha tudo → Dashboard com premium ativo
```

---

### Frontend — Ajuste da ModalPagamento

#### [MODIFY] [ModalPagamento.tsx](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPagamento.tsx)

Alterar o callback `aoSucesso` para receber `pagamento_id` como argumento, permitindo que o [App.tsx](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/App.tsx) use esse ID para chamar o endpoint de confirmação:
```diff
- aoSucesso: () => void;
+ aoSucesso: (pagamento_id: string) => void;
```

---

### Frontend — Dependência html-to-image

Instalar a dependência no container:
```bash
docker compose -f .docker/compose.yaml exec app npm install html-to-image
```

---

## Verification Plan

### Teste com Mock (Fluxo Completo)

Com `VITE_USAR_MOCK_PAGAMENTO=true` no `.env`:

1. Subir ambiente: `bash dev.sh`
2. Clicar no ❤️ (Seja Premium) → Abre [ModalPlano](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPlano.tsx#10-335)
3. Selecionar qualquer plano → Abre [ModalPagamento](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPagamento.tsx#217-474)
4. Mock simula falha na 1ª tentativa → Clicar "Tentar Novamente"
5. Mock aprova na 2ª tentativa → Animação de sucesso
6. Após 5s → [ModalPagamentoAprovado](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/ModalPagamentoAprovado.tsx#5-12) aparece com token gerado
7. Verificar: Token está no formato `SEM-SUSTO-XXXXXXX`
8. Testar "Copiar Token" → clipboard contém o token
9. Testar "WhatsApp" → abre link correto
10. Testar "Salvar Foto" → baixa PNG do cartão
11. Testar "Ativar Acesso Agora" → fecha tudo, premium ativo

### Build de Produção

```bash
docker compose -f .docker/compose.yaml run --rm app npm run build
```

Build deve completar sem erros.

### Validação Manual pelo Usuário

Fluxo real em produção requer validação com pagamento PIX real e acesso ao painel do Mercado Pago. Solicito ao usuário que faça essa validação final após o deploy.
