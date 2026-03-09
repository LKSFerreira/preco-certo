# Walkthrough - Reorganização de Scripts e Backend Local

> **Última atualização:** 2026-03-09
> **Status:** Concluído
> **Tipo:** Organização estrutural / redução de débito técnico

---

## 1. Objetivo

Remover ambiguidade entre:

- backend local de desenvolvimento;
- scripts operacionais de banco;
- scripts auxiliares de dados;
- testes manuais;
- legados Python mantidos apenas para referência histórica.

---

## 2. Decisão Aplicada

### Backend local

O servidor Express de desenvolvimento deixou de viver em `lib/scripts/` e passou a ser tratado como backend local real:

- `backend/server.ts`

O nome `server.ts` foi mantido, mas a responsabilidade arquitetural ficou explícita.

### Scripts por domínio

Os scripts ativos passaram a ser organizados por área:

- `lib/scripts/database/`
- `lib/scripts/data/`
- `lib/scripts/tests/`

### Legados Python

Os arquivos Python migrados deixaram de ser ativos e foram movidos para `_deprecated/` dentro do domínio correspondente, com cabeçalho de depreciação.

---

## 3. Estrutura Resultante

```text
backend/
`-- server.ts

lib/scripts/
|-- data/
|   |-- clean_dataset.ts
|   |-- filtrar_base_dado_para_brasil.ts
|   |-- remover_genericos.ts
|   `-- _deprecated/
|-- database/
|   |-- aplicar_migrations.ts
|   |-- carregar_catalogo_inicial.ts
|   |-- gerar_token.ts
|   |-- init_db.ts
|   |-- orquestrar_validacao_remota.ts
|   |-- remove_pagamentos_mockados.ts
|   |-- reset_banco_local.ts
|   |-- validar_banco_remoto.ts
|   `-- _deprecated/
`-- tests/
    |-- test_api.ts
    |-- test_concorrencia_pagamento.ts
    |-- test_endpoints.ts
    |-- test_proxy_cosmos.ts
    |-- test_proxy_ia.ts
    |-- test_security.ts
    `-- verify_cors.ts
```

---

## 4. Ajustes Operacionais

- `package.json` passou a usar `backend/server.ts` no script `dev`.
- Foram adicionados atalhos para banco:
  - `db:init`
  - `db:reset`
  - `token:gerar`
- `premium.sh` e `exec.sh` passaram a executar a trilha TypeScript no container `app`.
- O serviço Python do Docker foi mantido apenas como ambiente legado de rollback.

---

## 5. Resultado

O repositório deixou de tratar backend local como “script solto”, os Python ativos foram substituídos por TypeScript e os legados ficaram preservados sem contaminar o fluxo principal.
