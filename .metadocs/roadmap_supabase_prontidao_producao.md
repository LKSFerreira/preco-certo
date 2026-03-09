# Roadmap Branch - Prontidão para Supabase em Produção

> **Ultima atualização:** 2026-03-08
> **Status:** Em análise técnica
> **Escopo:** Avaliar se a base atual esta pronta para usar Supabase como banco real de produção

---

## 1. Veredito Executivo

> **Conclusao curta:** A base esta relativamente perto de estar pronta para usar a Supabase como **PostgreSQL gerenciado de produção**, mas **ainda não esta pronta** para o cutover enquanto alguns bloqueadores operacionais do backend permanecerem em aberto.

O escopo correto desta avaliacao e:

- Supabase como hospedeira do banco PostgreSQL de produção
- backend proprio como única porta de acesso ao banco
- frontend sem integração nativa com Supabase nesta fase

Dentro desse recorte, o caminho e tecnicamente bom e coerente com a arquitetura atual.

Os bloqueadores remanescentes passam a ser principalmente de robustez operacional do backend, e não de integração nativa com Supabase:

- Blindagem de concorrência em fluxos criticos de pagamento/token
- Separação entre auditoria operacional e telemetria de comportamento
- Estratégia de ambiente separando dev/produção com mais clareza
- Governança da sincronizacao entre catalogo local e catalogo compartilhado oficial
- Validação de migrations e carga inicial no banco remoto com processo auditavel
- Validação real de cutover em produção

---

## 2. O Que Já Esta Pronto

### Arquitetura

- O frontend consome a API propria, não o banco diretamente.
- O padrão de repositorios já permite troca de implementação sem reescrever a UI.
- O fluxo `Offline First` reduz risco de degradacao total por latencia remota.

### Banco e Persistencia

- O schema principal já esta em migrations SQL versionadas.
- A base local em PostgreSQL já foi validada com dataset real.
- O backend atual opera sobre Postgres puro, o que facilita portar para o banco do Supabase.

### Operação

- Os endpoints criticos de produto, token e pagamento já existem.
- O projeto já tem documentacao especifica de Supabase e seguranca/custo.
- O roadmap já reconhece formalmente a trilha de migração para Supabase.

---

## 3. Principais Bloqueadores Antes do Cutover

### 3.1 Concorrência no fluxo de confirmação de pagamento

Hoje o fluxo de confirmação consulta se já existe token para um `pagamento_id` e depois faz `INSERT`.

**Risco:** duas confirmações simultaneas podem passar pela leitura antes da gravacao e uma delas terminar em erro por conflito no indice único.

**Impacto:** em produção isso pode virar erro intermitente no exato momento de maior sensibilidade do usuário: pagamento aprovado e token não entregue de forma limpa.

**Conclusao:** antes do Supabase em produção, a idempotência precisa ficar atomica e previsivel.

### 3.2 Auditoria excessiva em leitura de produtos

O endpoint de produto registra auditoria manual em `SELECT`.

**Risco:** o scanner e a busca de catalogo são fluxos de alta frequencia. Auditar toda leitura aumenta:

- escrita no banco
- crescimento de storage
- ruido operacional
- custo indireto no free tier

**Conclusao:** a estratégia de auditoria precisa ser revista antes de colocar trafego real em um banco gerenciado externo.

### 3.3 Estratégia de ambiente ainda esta ambigua

O runtime atual usa `DATABASE_URL` como fonte principal. O roadmap já aponta a necessidade de separar melhor os ambientes, mas isso ainda não esta formalizado em runtime/operação.

**Risco:** deploy mal configurado, apontando para banco errado, seed rodando em ambiente indevido ou confusao entre local e produção.

**Conclusao:** antes do cutover, ambiente e segredos precisam estar explicitamente organizados.

### 3.4 Cutover para banco remoto ainda não foi validado ponta a ponta

Mesmo com o desenho arquitetural correto, ainda falta a validação operacional no banco remoto gerenciado:

- migrations
- carga inicial
- conectividade Vercel -> banco
- smoke tests reais de fluxos principais

**Conclusao:** o caminho esta claro, mas ainda falta a prova operacional do cutover.

---

## 4. Riscos Operacionais e de Custo

### Banco

- Crescimento desnecessario de `auditoria_logs`
- Escritas extras em fluxos de consulta
- Dificuldade de observabilidade limpa em ambiente free tier

### Seguranca

- Segredos e conexoes de ambiente ainda precisam de definicao mais rigida
- O backend precisa continuar sendo a única porta de acesso ao banco
- Integracoes nativas futuras com Supabase devem ser tratadas como decisão separada

### Produto

- Falha de entrega de token em condicao de corrida
- Regressao silenciosa em fluxos de premium e aprovação manual
- Migração para produção sem smoke test real dos fluxos mais sensiveis

---

## 5. Recomendação de Estratégia

### Estratégia recomendada agora

Migrar para **Supabase como PostgreSQL gerenciado**, mantendo:

- acesso ao banco apenas pelo backend serverless
- `DATABASE_URL` como caminho principal nesta etapa
- frontend consumindo apenas a API propria

### Estratégia que eu não recomendo agora

Misturar nesta mesma fase:

- SDK Supabase no frontend
- uso de `anon key` na aplicacao
- Auth/RLS nativos como base do fluxo principal

**Motivo:** isso aumenta a superficie de erro num momento em que a base ainda precisa fechar itens de robustez operacional.

---

## 6. Gate de Prontidão Antes da Migração

### Bloqueadores

- [ ] Tornar idempotente e atomico o fluxo de confirmação de pagamento/token
- [ ] Separar auditoria operacional de telemetria de comportamento em `produtos`
- [ ] Fechar estratégia de variaveis de ambiente para dev e produção
- [ ] Rodar migrations e seed em projeto Supabase de validação
- [ ] Validar fluxo completo: produto, token, ativacao e pagamento manual

### Recomendados

- [ ] Criar checklist operacional de deploy/cutover
- [ ] Definir estratégia de rollback
- [ ] Medir comportamento de latencia no fluxo de busca por GTIN

---

## 7. Decisão Recomendada

### Se a pergunta for:

**"Já podemos usar a Supabase como PostgreSQL gerenciado de produção agora?"**

Minha resposta e:

> **Ainda não.**

### Se a pergunta for:

**"Já podemos preparar uma migração controlada para Supabase sem reinventar a arquitetura?"**

Minha resposta e:

> **Sim.**

Com a seguinte condicao:

- primeiro fechar robustez operacional
- depois validar ambiente Supabase
- so entao fazer o cutover real

---

## 8. Referencias Técnicas

- `api/_lib/pagamentos/orquestrador.ts`
- `api/pagamentos/confirmar.ts`
- `api/pagamentos/manual/aprovar.ts`
- `api/pagamentos/manual/solicitar.ts`
- `api/produtos/[código].ts`
- `api/_lib/banco.ts`
- `repositorios/postgres.ts`
- `contextos/ContextoRepositorios.tsx`
- `.metadocs/supabase_learning.md`
- `.metadocs/roadmap.md`

---

## 9. Proximo Passo Recomendado

Antes de qualquer implementação de Supabase em produção:

1. Debater o desenho final esperado da migração
2. Definir se a etapa 1 será apenas `Supabase = Postgres gerenciado`
3. Fechar criterios de sucesso e rollback
4. So depois abrir o plano de execução

---

## 10. Branches de Feature Derivadas

As refatoracoes estruturais identificadas neste parecer devem ser detalhadas em `/.metadocs/feat/` antes da implementação.

### Documentos abertos

- [refatoracao_auditoria_telemetria.md](./walkthrough/refatoracao_auditoria_telemetria.md)
- [idempotencia_confirmacao_pagamento.md](./walkthrough/idempotencia_confirmacao_pagamento.md)
- [postgres_gerenciado_supabase.md](./feat/postgres_gerenciado_supabase.md)
- [estrategia_ambiente.md](./feat/estrategia_ambiente.md)
- [governanca_catalogo_compartilhado.md](./feat/governanca_catalogo_compartilhado.md)
- [validacao_migrations_carga_remota.md](./feat/validacao_migrations_carga_remota.md)
- [smoke_test_producao.md](./feat/smoke_test_producao.md)
- [plano_implementacao_postgres_producao.md](./feat/plano_implementacao_postgres_producao.md)

### Convencao

- Durante planejamento: `/.metadocs/feat/<tema>.md`
- Apos implementação: mover o mesmo arquivo para `/.metadocs/walkthrough/<tema>.md`
