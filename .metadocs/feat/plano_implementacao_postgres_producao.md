# Feature Plan - Plano Implementacao Postgres Producao

> **Ultima atualizacao:** 2026-03-08
> **Status:** Consolidado para execucao futura
> **Tipo:** Plano mestre de implementacao
> **Escopo:** Introduzir PostgreSQL remoto oficial em producao usando Supabase como Postgres gerenciado

---

## 1. Objetivo Executivo

Consolidar em um unico plano a ordem de implementacao das decisoes arquiteturais e operacionais aprovadas para introduzir o banco PostgreSQL remoto oficial em producao.

### Resultado esperado

- producao passa a usar PostgreSQL gerenciado na Supabase
- backend proprio continua como unica porta de acesso ao banco
- frontend continua sem integracao nativa com Supabase nesta fase
- catalogo compartilhado oficial passa a existir com governanca adequada

---

## 2. Escopo Aprovado

### Dentro do escopo

- robustez operacional do backend
- idempotencia em confirmacao de pagamento
- separacao entre auditoria e telemetria
- estrategia de ambiente
- governanca do catalogo compartilhado
- validacao de migrations e carga inicial no banco remoto
- cutover controlado
- smoke test real de producao

### Fora do escopo nesta fase

- SDK Supabase no frontend
- Auth Supabase
- RLS como base principal do fluxo atual
- sync automatico obrigatorio do catalogo local para remoto
- engine de recomendacao
- curadoria completa por IA como etapa obrigatoria do primeiro cutover

---

## 3. Premissas Oficiais

- Supabase sera usada como **Postgres gerenciado**, nao como plataforma nativa da aplicacao nesta fase
- ambientes oficiais: `local` e `producao`
- nao havera homologacao remota permanente por enquanto
- havera **validacao remota pre-cutover** como procedimento controlado
- `produtos` sera o catalogo oficial compartilhado
- `produtos_adicionados_pelo_usuario` sera staging/inbox

---

## 4. Dependencias Consolidadas

Este plano depende das decisoes ja registradas em:

- [refatoracao_auditoria_telemetria.md](./refatoracao_auditoria_telemetria.md)
- [idempotencia_confirmacao_pagamento.md](./idempotencia_confirmacao_pagamento.md)
- [postgres_gerenciado_supabase.md](./postgres_gerenciado_supabase.md)
- [estrategia_ambiente.md](./estrategia_ambiente.md)
- [governanca_catalogo_compartilhado.md](./governanca_catalogo_compartilhado.md)
- [validacao_migrations_carga_remota.md](./validacao_migrations_carga_remota.md)
- [smoke_test_producao.md](./smoke_test_producao.md)

---

## 5. Ordem de Implementacao Recomendada

### Fase 1 - Blindagem do backend atual

Objetivo:

- eliminar riscos de producao independentes do banco remoto

Entregas:

- idempotencia/concorrencia em confirmacao de pagamento
- separacao entre auditoria operacional e telemetria de comportamento

Motivo da prioridade:

- esses pontos sao bloqueadores do cutover mesmo sem Supabase

### Fase 2 - Base operacional e de dados

Objetivo:

- definir com seguranca como o sistema opera entre local e producao

Entregas:

- estrategia de ambiente
- governanca do catalogo compartilhado

Motivo da prioridade:

- sem isso, o banco remoto entra sem regra clara de escrita, sincronizacao e operacao

### Fase 3 - Ferramental operacional remoto

Objetivo:

- preparar o caminho de banco remoto sem ambiguidade

Entregas:

- separacao entre migrations, carga inicial e validacao
- orquestrador operacional fino
- preparacao da conexao com Postgres gerenciado na Supabase

Motivo da prioridade:

- evita operacao manual fragil e evita script magico opaco

### Fase 4 - Validacao remota pre-cutover

Objetivo:

- provar o banco remoto antes de virar a aplicacao

Entregas:

- schema remoto validado
- carga inicial validada
- conectividade backend -> banco remoto validada
- fluxos principais validados contra banco remoto

### Fase 5 - Cutover

Objetivo:

- trocar a producao do modelo atual para o PostgreSQL remoto oficial

Entregas:

- configuracao final de ambiente
- deploy com `DATABASE_URL` apontando para producao remota
- verificacao final de operacao

### Fase 6 - Aceite pos-cutover

Objetivo:

- confirmar que a migracao foi bem-sucedida no ambiente real

Entregas:

- smoke test real de producao
- decisao formal de aceite ou rollback

---

## 6. Sequencia Tecnica Consolidada

### Bloco A - Backend seguro

1. Implementar idempotencia em pagamento
2. Refatorar captura de eventos: auditoria vs telemetria

### Bloco B - Regras de operacao

3. Formalizar ambiente `local` e `producao`
4. Proteger scripts sensiveis por ambiente
5. Formalizar governanca de escrita no catalogo compartilhado

### Bloco C - Banco remoto

6. Preparar projeto Supabase como Postgres gerenciado
7. Separar etapas operacionais:
   - migrations
   - carga inicial
   - validacao
8. Implementar orquestrador fino

### Bloco D - Prova antes da virada

9. Rodar migrations no banco remoto
10. Rodar carga inicial do catalogo
11. Validar schema, volume e comportamento

### Bloco E - Virada

12. Fazer cutover controlado
13. Executar smoke test real de producao
14. Decidir aceite ou rollback

---

## 7. Criterios de Aceite por Fase

### Fase 1

- nenhum fluxo legitimo de confirmacao do mesmo pagamento retorna erro tecnico por corrida
- `SELECT` de produto deixa de ser tratado como auditoria operacional

### Fase 2

- ambientes oficiais ficam claros
- dados locais do usuario nao escrevem diretamente no catalogo oficial

### Fase 3

- operacao remota fica dividida entre schema, carga inicial e validacao
- orquestrador e transparente e previsivel

### Fase 4

- banco remoto replica o schema esperado
- catalogo inicial e carregado corretamente
- backend opera corretamente com o banco remoto

### Fase 5

- producao aponta para o banco remoto oficial
- nao ha regressao grave imediatamente observavel

### Fase 6

- smoke test de producao passa
- migracao e formalmente aceita

---

## 8. Riscos que Este Plano Busca Conter

- erro de concorrencia em pagamento
- degradacao do scanner por escrita indevida
- contaminacao do catalogo oficial por dados locais ruins
- confusao entre ambiente local e producao
- migration/carga inicial executadas de forma opaca
- cutover sem validacao suficiente

---

## 9. Decisoes Explicitas Sobre Escopo

### Sync automatico do catalogo local

Nao e obrigatorio nesta fase.

Se for implementado depois:

- deve operar em segundo plano
- nao deve bloquear startup
- nao deve promover direto para `produtos`

### Curadoria com IA

Pode existir futuramente, mas nao deve bloquear a introducao inicial do Postgres remoto.

### RLS

Pode ser discutido em fase posterior, mas nao e requisito central para esta entrega, pois o frontend nao acessara o banco diretamente.

---

## 10. Evidencias Minimas para Considerar a Migracao Pronta

- documentacao de features implementadas convertida em walkthrough correspondente
- banco remoto com schema valido
- carga inicial confirmada
- aplicacao em producao operando com banco remoto
- smoke test de producao aprovado

---

## 11. Proximo Passo Apos Este Plano

Quando a implementacao for iniciada, este plano deve ser usado como ordem oficial de execucao.

Cada branch de feature devera:

- ser implementada
- validada
- movida para `/.metadocs/walkthrough/`
- referenciada no `historico.md`

---

## 12. Destino Pos-Implementacao

Apos a execucao completa da iniciativa, este mesmo arquivo pode ser movido para:

- `.metadocs/walkthrough/plano_implementacao_postgres_producao.md`

Se o plano for mantido apenas como artefato de governanca, ele tambem pode permanecer em `feat/` como registro mestre de planejamento.
