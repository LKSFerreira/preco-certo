# Roadmap Branch - Prontidão para Supabase em Produção

> **Última atualização:** 2026-03-09
> **Status:** Em análise técnica
> **Escopo:** Avaliar se a base atual está pronta para usar Supabase como banco real de produção

---

## 1. Veredito Executivo

> **Conclusão curta:** A base está relativamente perto de estar pronta para usar a Supabase como **PostgreSQL gerenciado de produção**, mas **ainda não está pronta** para o cutover enquanto a validação remota real não for concluída.

O escopo correto desta avaliação é:

- Supabase como hospedeira do banco PostgreSQL de produção
- backend próprio como única porta de acesso ao banco
- frontend sem integração nativa com Supabase nesta fase

Dentro desse recorte, o caminho continua tecnicamente bom e coerente com a arquitetura atual.

Os bloqueadores estruturais de concorrência, auditoria/telemetria, estratégia de ambiente, governança do catálogo e ferramental operacional local já possuem implementação registrada em walkthroughs.

Os bloqueadores remanescentes passam a ser principalmente:

- validação de migrations e carga inicial no banco remoto
- conectividade real Vercel -> banco gerenciado
- smoke test e cutover em produção

---

## 2. O Que Já Está Pronto

### Arquitetura

- o frontend consome a API própria, não o banco diretamente
- o padrão de repositórios já permite troca de implementação sem reescrever a UI
- o fluxo `Offline First` reduz risco de degradação total por latência remota

### Banco e Persistência

- o schema principal já está em migrations SQL versionadas
- a base local em PostgreSQL já foi validada com dataset real
- o backend atual opera sobre Postgres puro, o que facilita portar para o banco do Supabase

### Operação

- os endpoints críticos de produto, token e pagamento já existem
- o projeto já tem documentação específica de Supabase e segurança/custo
- a base fechou os bloqueadores de:
  - idempotência de pagamento
  - separação entre auditoria e telemetria
  - estratégia de ambiente
  - governança do catálogo compartilhado
  - trilha operacional local de `migrations`, `carga_inicial`, `validacao` e `orquestrador`

---

## 3. Principais Bloqueadores Antes do Cutover

### 3.1 Ferramental operacional remoto foi fechado localmente

O projeto materializou a trilha operacional remota no formato aprovado:

- `migrations`
- `carga_inicial`
- `validacao`
- `orquestrador`

A implementação adotada foi:

- **Node/JS CLI**
- sem expandir Python
- sem criar endpoints HTTP para operar banco
- com `ambiente` e `banco` extraídos para camadas compartilhadas semanticamente corretas

Conclusão:

- o bloqueador deixou de ser “criar a CLI”
- o bloqueador agora é “executar a CLI contra o banco remoto real”

### 3.2 Cutover para banco remoto ainda não foi validado ponta a ponta

Mesmo com o desenho arquitetural correto, ainda falta a validação operacional no banco remoto gerenciado:

- migrations
- carga inicial
- conectividade Vercel -> banco
- smoke tests reais de fluxos principais

Conclusão:

- o caminho está claro
- ainda falta a prova operacional remota do cutover

---

## 4. Riscos Operacionais e de Custo

### Banco

- crescimento desnecessário de escrita operacional se a trilha remota for mal usada
- dificuldade de observabilidade limpa em ambiente free tier
- execução opaca de schema/carga se a operação deixar de ser explícita

### Segurança

- segredos e conexões de ambiente ainda precisam de definição rígida no momento do cutover
- o backend precisa continuar sendo a única porta de acesso ao banco
- integrações nativas futuras com Supabase devem ser tratadas como decisão separada

### Produto

- regressão silenciosa em fluxos de premium e aprovação manual
- migração para produção sem smoke test real dos fluxos mais sensíveis
- erro humano no momento do cutover se o procedimento remoto não for executado com disciplina

---

## 5. Recomendação de Estratégia

### Estratégia recomendada agora

Migrar para **Supabase como PostgreSQL gerenciado**, mantendo:

- acesso ao banco apenas pelo backend serverless
- `DATABASE_URL` como caminho principal nesta etapa
- frontend consumindo apenas a API própria

### Estratégia que eu não recomendo agora

Misturar nesta mesma fase:

- SDK Supabase no frontend
- uso de `anon key` na aplicação
- Auth/RLS nativos como base do fluxo principal
- endpoints HTTP para operar migrations, carga inicial ou validação remota

Motivo:

- isso aumenta a superfície de erro num momento em que a base ainda precisa fechar a prova remota

---

## 6. Gate de Prontidão Antes da Migração

### Bloqueadores

- [x] Tornar idempotente e atômico o fluxo de confirmação de pagamento/token
- [x] Separar auditoria operacional de telemetria de comportamento em `produtos`
- [x] Fechar estratégia de variáveis de ambiente para dev e produção
- [x] Formalizar governança do catálogo compartilhado
- [x] Implementar trilha operacional remota em Node/JS CLI (`migrations`, `carga_inicial`, `validacao`, `orquestrador`)
- [x] Extrair `ambiente` e `banco` para camada compartilhada reutilizável fora de `api/_lib/`
- [ ] Rodar migrations e carga em projeto Supabase de validação
- [ ] Validar fluxo completo: produto, token, ativação e pagamento manual

### Recomendados

- [ ] Criar checklist operacional de deploy/cutover
- [ ] Definir estratégia de rollback
- [ ] Medir comportamento de latência no fluxo de busca por GTIN

---

## 7. Decisão Recomendada

### Se a pergunta for:

**"Já podemos usar a Supabase como PostgreSQL gerenciado de produção agora?"**

Minha resposta é:

> **Ainda não.**

### Se a pergunta for:

**"Já podemos preparar uma migração controlada para Supabase sem reinventar a arquitetura?"**

Minha resposta é:

> **Sim.**

Com a seguinte condição:

- primeiro executar a prova remota
- depois validar ambiente Supabase
- só então fazer o cutover real

---

## 8. Referências Técnicas

- `api/_lib/pagamentos/orquestrador.ts`
- `api/pagamentos/confirmar.ts`
- `api/pagamentos/manual/aprovar.ts`
- `api/pagamentos/manual/solicitar.ts`
- `api/produtos/[código].ts`
- `lib/database/banco.ts`
- `infra/ambiente/server.ts`
- `repositorios/postgres.ts`
- `contextos/ContextoRepositorios.tsx`
- `.metadocs/supabase_learning.md`
- `.metadocs/roadmap.md`

---

## 9. Próximo Passo Recomendado

Antes de qualquer implementação de Supabase em produção:

1. preparar o projeto Supabase de validação
2. executar a trilha remota implementada contra o banco gerenciado
3. validar conectividade backend -> banco remoto
4. validar fluxos principais no ambiente com banco remoto
5. só depois preparar cutover e smoke test real

---

## 10. Branches de Feature Derivadas

### Documentos relacionados

- [refatoracao_auditoria_telemetria.md](./walkthrough/refatoracao_auditoria_telemetria.md)
- [idempotencia_confirmacao_pagamento.md](./walkthrough/idempotencia_confirmacao_pagamento.md)
- [postgres_gerenciado_supabase.md](./feat/postgres_gerenciado_supabase.md)
- [estrategia_ambiente.md](./walkthrough/estrategia_ambiente.md)
- [governanca_catalogo_compartilhado.md](./walkthrough/governanca_catalogo_compartilhado.md)
- [validacao_migrations_carga_remota.md](./walkthrough/validacao_migrations_carga_remota.md)
- [guia_execucao_validacao_remota_node.md](./walkthrough/guia_execucao_validacao_remota_node.md)
- [smoke_test_producao.md](./feat/smoke_test_producao.md)
- [plano_implementacao_postgres_producao.md](./feat/plano_implementacao_postgres_producao.md)

### Convenção

- durante planejamento: `/.metadocs/feat/<tema>.md`
- após implementação: mover o mesmo arquivo para `/.metadocs/walkthrough/<tema>.md`
