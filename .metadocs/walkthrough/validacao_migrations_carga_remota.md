# Walkthrough - Validação de Migrations e Carga Remota

> **Última atualização:** 2026-03-09
> **Status:** Concluído
> **Tipo:** Operação de banco remoto / ferramental CLI
> **Origem:** Derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Objetivo Entregue

Foi implementada a trilha operacional de banco em **Node/JS CLI** para separar e orquestrar:

- `migrations`
- `carga_inicial`
- `validacao`

O resultado foi um fluxo auditável, reutilizável e alinhado à stack principal do projeto, sem expandir Python e sem expor endpoints HTTP para operar banco.

---

## 2. Decisão Aplicada

As decisões efetivamente materializadas foram:

- manter a operação de banco fora da superfície HTTP da aplicação
- usar TypeScript executado com `tsx` para a nova trilha
- extrair ambiente para uma camada compartilhada neutra em `infra/ambiente/`
- concentrar ativos de banco em `lib/database/`
- isolar pontos de entrada executáveis em `lib/scripts/database/`

Também foi mantida a regra de que o orquestrador não executa reset destrutivo implícito.

---

## 3. Estrutura Final Implementada

```text
infra/
└── ambiente/
    ├── _comum.ts
    ├── cliente.ts
    └── server.ts

lib/
├── database/
│   ├── banco.ts
│   ├── data/
│   │   └── produtos_higienizados.json
│   └── migrations/
└── scripts/
    └── database/
        ├── _comum.ts
        ├── aplicar_migrations.ts
        ├── carregar_catalogo_inicial.ts
        ├── validar_banco_remoto.ts
        └── orquestrar_validacao_remota.ts
```

---

## 4. Implementação Realizada

### 4.1 Infra compartilhada

Foi extraído um núcleo de ambiente com contrato comum e adaptadores por runtime:

- `infra/ambiente/_comum.ts`
- `infra/ambiente/server.ts`
- `infra/ambiente/cliente.ts`

`services/ambiente.ts` e `api/_lib/ambiente.ts` passaram a funcionar como pontos de compatibilidade/reexportação, preservando os consumidores existentes enquanto a semântica foi corrigida.

`lib/database/banco.ts` passou a consumir a camada nova, removendo o principal acoplamento com `api/_lib/`.

### 4.2 Camada comum da CLI

`lib/scripts/database/_comum.ts` foi mantido pequeno e técnico, com foco em:

- criação do pool de banco
- encerramento seguro da conexão

Ele não recebeu regra de negócio nem lógica de orquestração.

### 4.3 Script de migrations

`lib/scripts/database/aplicar_migrations.ts` foi implementado para:

- localizar as migrations em `lib/database/migrations/`
- garantir `schema_migrations`
- aplicar apenas migrations pendentes
- registrar as aplicadas
- tolerar cenário de objeto já existente sem perder rastreabilidade

O script ficou idempotente e com execução segura por transação.

### 4.4 Script de carga inicial

`lib/scripts/database/carregar_catalogo_inicial.ts` foi implementado para:

- ler `lib/database/data/produtos_higienizados.json`
- normalizar o dataset mínimo necessário
- inserir em lotes
- usar `ON CONFLICT (codigo_barras) DO NOTHING`

Com isso, a carga inicial passou a ser explícita, idempotente e separada do schema.

### 4.5 Script de validação

`lib/scripts/database/validar_banco_remoto.ts` foi implementado para:

- conferir tabelas obrigatórias
- comparar migrations esperadas com migrations registradas
- validar volume mínimo do catálogo
- testar leitura real por GTIN conhecido
- executar uma escrita controlada com `ROLLBACK`

Essa etapa passou a provar que o banco está operacional, e não apenas “de pé”.

### 4.6 Orquestrador fino

`lib/scripts/database/orquestrar_validacao_remota.ts` foi implementado para:

- imprimir o ambiente alvo
- executar `migrations -> carga_inicial -> validacao`
- abortar na primeira falha
- emitir resumo final legível

Durante a implementação, os scripts individuais foram ajustados para só dispararem `main()` quando executados como entrypoint real. Isso evitou execução duplicada quando importados pelo orquestrador.

### 4.7 Saída operacional

Os logs dos quatro scripts foram padronizados com:

- indentação consistente
- emojis por etapa
- resumo final objetivo

Isso melhorou a legibilidade operacional sem esconder as etapas.

---

## 5. Validações Executadas

As validações realmente rodadas nesta entrega foram:

### Build da aplicação

```bash
docker compose -f .docker/compose.yaml exec app npm run build
```

Resultado:

- build concluído com sucesso após a extração de ambiente

### Migrations

```bash
docker compose -f .docker/compose.yaml exec app npx tsx lib/scripts/database/aplicar_migrations.ts
```

Resultado:

- `Aplicadas: 0`
- `Puladas: 12`

### Carga inicial

```bash
docker compose -f .docker/compose.yaml exec app npx tsx lib/scripts/database/carregar_catalogo_inicial.ts
```

Resultado:

- `Lidos: 30196`
- `Inseridos: 0`
- `Lotes: 31`

### Validação operacional

```bash
docker compose -f .docker/compose.yaml exec app npx tsx lib/scripts/database/validar_banco_remoto.ts
```

Resultado:

- tabelas obrigatórias encontradas
- `12/12` migrations registradas
- `30211` produtos no banco
- leitura por GTIN validada
- escrita controlada com rollback validada

### Orquestração completa

```bash
docker compose -f .docker/compose.yaml exec app npx tsx lib/scripts/database/orquestrar_validacao_remota.ts
```

Resultado:

- execução linear das 3 etapas
- resumo final auditável
- sucesso completo em ambiente `local`

---

## 6. Resultado para o Roadmap

Esta entrega fecha localmente a frente de **ferramental operacional remoto** do plano mestre.

O próximo passo da iniciativa deixa de ser criar a CLI e passa a ser:

1. preparar o projeto Supabase de validação
2. executar a trilha agora existente contra o banco remoto
3. validar conectividade real backend -> banco remoto
4. seguir para smoke test e cutover apenas após essa prova

---

## 7. Referências

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [plano_implementacao_postgres_producao.md](../feat/plano_implementacao_postgres_producao.md)
- [guia_execucao_validacao_remota_node.md](./guia_execucao_validacao_remota_node.md)
- `lib/scripts/init_db.py`
