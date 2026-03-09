# Feature Plan - Plano Implementação Postgres Produção

> **Última atualização:** 2026-03-09
> **Status:** Consolidado para execução futura
> **Tipo:** Plano mestre de implementação
> **Escopo:** Introduzir PostgreSQL remoto oficial em produção usando Supabase como Postgres gerenciado

---

## 1. Objetivo Executivo

Consolidar em um único plano a ordem de implementação das decisões arquiteturais e operacionais aprovadas para introduzir o banco PostgreSQL remoto oficial em produção.

### Resultado esperado

- produção passa a usar PostgreSQL gerenciado na Supabase
- backend próprio continua como única porta de acesso ao banco
- frontend continua sem integração nativa com Supabase nesta fase
- catálogo compartilhado oficial passa a existir com governança adequada

---

## 2. Escopo Aprovado

### Dentro do escopo

- robustez operacional do backend
- idempotência em confirmação de pagamento
- separação entre auditoria e telemetria
- estratégia de ambiente
- governança do catálogo compartilhado
- validação de migrations e carga inicial no banco remoto
- cutover controlado
- smoke test real de produção

### Fora do escopo nesta fase

- SDK Supabase no frontend
- Auth Supabase
- RLS como base principal do fluxo atual
- sync automático obrigatório do catálogo local para remoto
- engine de recomendação
- curadoria completa por IA como etapa obrigatória do primeiro cutover

---

## 3. Premissas Oficiais

- Supabase será usada como **Postgres gerenciado**, não como plataforma nativa da aplicação nesta fase
- ambientes oficiais: `local` e `produção`
- não haverá homologação remota permanente por enquanto
- haverá **validação remota pré-cutover** como procedimento controlado
- `produtos` será o catálogo oficial compartilhado
- `produtos_adicionados_pelo_usuario` será staging/inbox
- a trilha operacional remota será implementada em **Node/JS CLI**
- `scripts/init_db.py` não será expandido como modelo principal desta fase
- operações de migrations/carga/validação remota não serão expostas por HTTP
- módulos genéricos de ambiente e banco devem residir em camada compartilhada neutra, não em `api/_lib/`

---

## 4. Dependências Consolidadas

Este plano depende das decisões já registradas em:

- [refatoracao_auditoria_telemetria.md](../walkthrough/refatoracao_auditoria_telemetria.md)
- [idempotencia_confirmacao_pagamento.md](../walkthrough/idempotencia_confirmacao_pagamento.md)
- [postgres_gerenciado_supabase.md](./postgres_gerenciado_supabase.md)
- [estrategia_ambiente.md](../walkthrough/estrategia_ambiente.md)
- [governanca_catalogo_compartilhado.md](../walkthrough/governanca_catalogo_compartilhado.md)
- [validacao_migrations_carga_remota.md](../walkthrough/validacao_migrations_carga_remota.md)
- [guia_execucao_validacao_remota_node.md](../walkthrough/guia_execucao_validacao_remota_node.md)
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

- definir com segurança como o sistema opera entre local e produção

Entregas:

- estratégia de ambiente
- governança do catálogo compartilhado

Motivo da prioridade:

- sem isso, o banco remoto entra sem regra clara de escrita, sincronização e operação

### Fase 3 - Ferramental operacional remoto

Objetivo:

- preparar o caminho de banco remoto sem ambiguidade

Entregas:

- separação entre migrations, carga inicial e validação
- scripts operacionais em Node/JS CLI
- orquestrador operacional fino
- preparação da conexão com Postgres gerenciado na Supabase

Motivo da prioridade:

- evita operação manual frágil e evita script mágico opaco

### Fase 4 - Validação remota pré-cutover

Objetivo:

- provar o banco remoto antes de virar a aplicação

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

## 6. Sequência Técnica Consolidada

### Bloco A - Backend seguro

1. Implementar idempotência em pagamento
2. Refatorar captura de eventos: auditoria vs telemetria

### Bloco B - Regras de operação

3. Formalizar ambiente `local` e `produção`
4. Proteger scripts sensíveis por ambiente
5. Formalizar governança de escrita no catálogo compartilhado

### Bloco C - Banco remoto

6. Preparar projeto Supabase como Postgres gerenciado
7. Extrair infraestrutura compartilhada de ambiente/conexão para camada neutra
8. Separar etapas operacionais:
   - migrations
   - carga inicial
   - validação
9. Implementar scripts Node/JS CLI da trilha remota
10. Implementar orquestrador fino

### Bloco D - Prova antes da virada

11. Rodar migrations no banco remoto
12. Rodar carga inicial do catálogo
13. Validar schema, volume e comportamento

### Bloco E - Virada

14. Fazer cutover controlado
15. Executar smoke test real de produção
16. Decidir aceite ou rollback

---

## 7. Critérios de Aceite por Fase

### Fase 1

- nenhum fluxo legítimo de confirmação do mesmo pagamento retorna erro técnico por corrida
- `SELECT` de produto deixa de ser tratado como auditoria operacional

### Fase 2

- ambientes oficiais ficam claros
- dados locais do usuário não escrevem diretamente no catálogo oficial

### Fase 3

- operação remota fica dividida entre schema, carga inicial e validação
- scripts CLI ficam alinhados à stack principal do projeto
- orquestrador é transparente e previsível

### Fase 4

- banco remoto replica o schema esperado
- catálogo inicial é carregado corretamente
- backend opera corretamente com o banco remoto

### Fase 5

- produção aponta para o banco remoto oficial
- não há regressão grave imediatamente observável

### Fase 6

- smoke test de produção passa
- migração é formalmente aceita

---

## 8. Riscos que Este Plano Busca Conter

- erro de concorrência em pagamento
- degradação do scanner por escrita indevida
- contaminação do catálogo oficial por dados locais ruins
- confusão entre ambiente local e produção
- migration/carga inicial executadas de forma opaca
- cutover sem validação suficiente

---

## 9. Decisões Explícitas Sobre Escopo

### Sync automático do catálogo local

Não é obrigatório nesta fase.

Se for implementado depois:

- deve operar em segundo plano
- não deve bloquear startup
- não deve promover direto para `produtos`

### Curadoria com IA

Pode existir futuramente, mas não deve bloquear a introdução inicial do Postgres remoto.

### RLS

Pode ser discutido em fase posterior, mas não é requisito central para esta entrega, pois o frontend não acessará o banco diretamente.

### Stack operacional da validação remota

A trilha nova desta fase deve permanecer em Node/JS CLI.

Portanto:

- não expandir Python como stack principal desta frente
- não criar endpoints HTTP para executar operações de banco remoto
- manter operação de infraestrutura fora da superfície pública da aplicação
- não acoplar a CLI à semântica de `api/_lib/` quando o módulo for compartilhado

---

## 10. Evidências Mínimas para Considerar a Migração Pronta

- documentação de features implementadas convertida em walkthrough correspondente
- banco remoto com schema válido
- carga inicial confirmada
- aplicação em produção operando com banco remoto
- smoke test de produção aprovado

---

## 11. Próximo Passo Após Este Plano

Quando a implementação for iniciada, este plano deve ser usado como ordem oficial de execução.

Cada branch de feature deverá:

- ser implementada
- validada
- movida para `/.metadocs/walkthrough/`
- referenciada no `historico.md`

---

## 12. Destino Pós-Implementação

Após a execução completa da iniciativa, este mesmo arquivo pode ser movido para:

- `.metadocs/walkthrough/plano_implementacao_postgres_producao.md`

Se o plano for mantido apenas como artefato de governança, ele também pode permanecer em `feat/` como registro mestre de planejamento.
