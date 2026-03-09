# Feature Plan - Plano Implementação Postgres Produção

> **Ultima atualização:** 2026-03-08
> **Status:** Consolidado para execução futura
> **Tipo:** Plano mestre de implementação
> **Escopo:** Introduzir PostgreSQL remoto oficial em produção usando Supabase como Postgres gerenciado

---

## 1. Objetivo Executivo

Consolidar em um único plano a ordem de implementação das decisões arquiteturais e operacionais aprovadas para introduzir o banco PostgreSQL remoto oficial em produção.

### Resultado esperado

- produção passa a usar PostgreSQL gerenciado na Supabase
- backend proprio continua como única porta de acesso ao banco
- frontend continua sem integração nativa com Supabase nesta fase
- catalogo compartilhado oficial passa a existir com governança adequada

---

## 2. Escopo Aprovado

### Dentro do escopo

- robustez operacional do backend
- idempotência em confirmação de pagamento
- separação entre auditoria e telemetria
- estratégia de ambiente
- governança do catalogo compartilhado
- validação de migrations e carga inicial no banco remoto
- cutover controlado
- smoke test real de produção

### Fora do escopo nesta fase

- SDK Supabase no frontend
- Auth Supabase
- RLS como base principal do fluxo atual
- sync automático obrigatório do catalogo local para remoto
- engine de recomendação
- curadoria completa por IA como etapa obrigatória do primeiro cutover

---

## 3. Premissas Oficiais

- Supabase será usada como **Postgres gerenciado**, não como plataforma nativa da aplicacao nesta fase
- ambientes oficiais: `local` e `produção`
- não havera homologacao remota permanente por enquanto
- havera **validação remota pré-cutover** como procedimento controlado
- `produtos` será o catalogo oficial compartilhado
- `produtos_adicionados_pelo_usuario` será staging/inbox

---

## 4. Dependencias Consolidadas

Este plano depende das decisões já registradas em:

- [refatoracao_auditoria_telemetria.md](../walkthrough/refatoracao_auditoria_telemetria.md)
- [idempotencia_confirmacao_pagamento.md](../walkthrough/idempotencia_confirmacao_pagamento.md)
- [postgres_gerenciado_supabase.md](./postgres_gerenciado_supabase.md)
- [estrategia_ambiente.md](../walkthrough/estrategia_ambiente.md)
- [governanca_catalogo_compartilhado.md](./governanca_catalogo_compartilhado.md)
- [validacao_migrations_carga_remota.md](./validacao_migrations_carga_remota.md)
- [smoke_test_producao.md](./smoke_test_producao.md)

---

## 5. Ordem de Implementação Recomendada

### Fase 1 - Blindagem do backend atual

Objetivo:

- eliminar riscos de produção independentes do banco remoto

Entregas:

- idempotência/concorrência em confirmação de pagamento
- separação entre auditoria operacional e telemetria de comportamento

Motivo da prioridade:

- esses pontos são bloqueadores do cutover mesmo sem Supabase

### Fase 2 - Base operacional e de dados

Objetivo:

- definir com seguranca como o sistema opera entre local e produção

Entregas:

- estratégia de ambiente
- governança do catalogo compartilhado

Motivo da prioridade:

- sem isso, o banco remoto entra sem regra clara de escrita, sincronizacao e operação

### Fase 3 - Ferramental operacional remoto

Objetivo:

- preparar o caminho de banco remoto sem ambiguidade

Entregas:

- separação entre migrations, carga inicial e validação
- orquestrador operacional fino
- preparacao da conexao com Postgres gerenciado na Supabase

Motivo da prioridade:

- evita operação manual fragil e evita script magico opaco

### Fase 4 - Validação remota pré-cutover

Objetivo:

- provar o banco remoto antes de virar a aplicacao

Entregas:

- schema remoto validado
- carga inicial validada
- conectividade backend -> banco remoto validada
- fluxos principais validados contra banco remoto

### Fase 5 - Cutover

Objetivo:

- trocar a produção do modelo atual para o PostgreSQL remoto oficial

Entregas:

- configuração final de ambiente
- deploy com `DATABASE_URL` apontando para produção remota
- verificação final de operação

### Fase 6 - Aceite pós-cutover

Objetivo:

- confirmar que a migração foi bem-sucedida no ambiente real

Entregas:

- smoke test real de produção
- decisão formal de aceite ou rollback

---

## 6. Sequencia Técnica Consolidada

### Bloco A - Backend seguro

1. Implementar idempotência em pagamento
2. Refatorar captura de eventos: auditoria vs telemetria

### Bloco B - Regras de operação

3. Formalizar ambiente `local` e `produção`
4. Proteger scripts sensiveis por ambiente
5. Formalizar governança de escrita no catalogo compartilhado

### Bloco C - Banco remoto

6. Preparar projeto Supabase como Postgres gerenciado
7. Separar etapas operacionais:
   - migrations
   - carga inicial
   - validação
8. Implementar orquestrador fino

### Bloco D - Prova antes da virada

9. Rodar migrations no banco remoto
10. Rodar carga inicial do catalogo
11. Validar schema, volume e comportamento

### Bloco E - Virada

12. Fazer cutover controlado
13. Executar smoke test real de produção
14. Decidir aceite ou rollback

---

## 7. Criterios de Aceite por Fase

### Fase 1

- nenhum fluxo legitimo de confirmação do mesmo pagamento retorna erro técnico por corrida
- `SELECT` de produto deixa de ser tratado como auditoria operacional

### Fase 2

- ambientes oficiais ficam claros
- dados locais do usuário não escrevem diretamente no catalogo oficial

### Fase 3

- operação remota fica dividida entre schema, carga inicial e validação
- orquestrador e transparente e previsivel

### Fase 4

- banco remoto replica o schema esperado
- catalogo inicial e carregado corretamente
- backend opera corretamente com o banco remoto

### Fase 5

- produção aponta para o banco remoto oficial
- não ha regressao grave imediatamente observavel

### Fase 6

- smoke test de produção passa
- migração e formalmente aceita

---

## 8. Riscos que Este Plano Busca Conter

- erro de concorrência em pagamento
- degradacao do scanner por escrita indevida
- contaminacao do catalogo oficial por dados locais ruins
- confusao entre ambiente local e produção
- migration/carga inicial executadas de forma opaca
- cutover sem validação suficiente

---

## 9. Decisões Explícitas Sobre Escopo

### Sync automático do catalogo local

Não e obrigatório nesta fase.

Se for implementado depois:

- deve operar em segundo plano
- não deve bloquear startup
- não deve promover direto para `produtos`

### Curadoria com IA

Pode existir futuramente, mas não deve bloquear a introducao inicial do Postgres remoto.

### RLS

Pode ser discutido em fase posterior, mas não e requisito central para esta entrega, pois o frontend não acessara o banco diretamente.

---

## 10. Evidencias Minimas para Considerar a Migração Pronta

- documentacao de features implementadas convertida em walkthrough correspondente
- banco remoto com schema valido
- carga inicial confirmada
- aplicacao em produção operando com banco remoto
- smoke test de produção aprovado

---

## 11. Proximo Passo Apos Este Plano

Quando a implementação for iniciada, este plano deve ser usado como ordem oficial de execução.

Cada branch de feature devera:

- ser implementada
- validada
- movida para `/.metadocs/walkthrough/`
- referenciada no `histórico.md`

---

## 12. Destino Pós-Implementação

Apos a execução completa da iniciativa, este mesmo arquivo pode ser movido para:

- `.metadocs/walkthrough/plano_implementacao_postgres_producao.md`

Se o plano for mantido apenas como artefato de governança, ele também pode permanecer em `feat/` como registro mestre de planejamento.
