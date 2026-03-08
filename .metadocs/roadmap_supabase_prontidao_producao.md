# Roadmap Branch - Prontidao para Supabase em Producao

> **Ultima atualizacao:** 2026-03-08
> **Status:** Em analise tecnica
> **Escopo:** Avaliar se a base atual esta pronta para usar Supabase como banco real de producao

---

## 1. Veredito Executivo

> **Conclusao curta:** A base esta relativamente perto de estar pronta para usar a Supabase como **PostgreSQL gerenciado de producao**, mas **ainda nao esta pronta** para o cutover enquanto alguns bloqueadores operacionais do backend permanecerem em aberto.

O escopo correto desta avaliacao e:

- Supabase como hospedeira do banco PostgreSQL de producao
- backend proprio como unica porta de acesso ao banco
- frontend sem integracao nativa com Supabase nesta fase

Dentro desse recorte, o caminho e tecnicamente bom e coerente com a arquitetura atual.

Os bloqueadores remanescentes passam a ser principalmente de robustez operacional do backend, e nao de integracao nativa com Supabase:

- Blindagem de concorrencia em fluxos criticos de pagamento/token
- Separacao entre auditoria operacional e telemetria de comportamento
- Estrategia de ambiente separando dev/producao com mais clareza
- Governanca da sincronizacao entre catalogo local e catalogo compartilhado oficial
- Validacao de migrations e carga inicial no banco remoto com processo auditavel
- Validacao real de cutover em producao

---

## 2. O Que Ja Esta Pronto

### Arquitetura

- O frontend consome a API propria, nao o banco diretamente.
- O padrao de repositorios ja permite troca de implementacao sem reescrever a UI.
- O fluxo `Offline First` reduz risco de degradacao total por latencia remota.

### Banco e Persistencia

- O schema principal ja esta em migrations SQL versionadas.
- A base local em PostgreSQL ja foi validada com dataset real.
- O backend atual opera sobre Postgres puro, o que facilita portar para o banco do Supabase.

### Operacao

- Os endpoints criticos de produto, token e pagamento ja existem.
- O projeto ja tem documentacao especifica de Supabase e seguranca/custo.
- O roadmap ja reconhece formalmente a trilha de migracao para Supabase.

---

## 3. Principais Bloqueadores Antes do Cutover

### 3.1 Concorrencia no fluxo de confirmacao de pagamento

Hoje o fluxo de confirmacao consulta se ja existe token para um `pagamento_id` e depois faz `INSERT`.

**Risco:** duas confirmacoes simultaneas podem passar pela leitura antes da gravacao e uma delas terminar em erro por conflito no indice unico.

**Impacto:** em producao isso pode virar erro intermitente no exato momento de maior sensibilidade do usuario: pagamento aprovado e token nao entregue de forma limpa.

**Conclusao:** antes do Supabase em producao, a idempotencia precisa ficar atomica e previsivel.

### 3.2 Auditoria excessiva em leitura de produtos

O endpoint de produto registra auditoria manual em `SELECT`.

**Risco:** o scanner e a busca de catalogo sao fluxos de alta frequencia. Auditar toda leitura aumenta:

- escrita no banco
- crescimento de storage
- ruido operacional
- custo indireto no free tier

**Conclusao:** a estrategia de auditoria precisa ser revista antes de colocar trafego real em um banco gerenciado externo.

### 3.3 Estrategia de ambiente ainda esta ambigua

O runtime atual usa `DATABASE_URL` como fonte principal. O roadmap ja aponta a necessidade de separar melhor os ambientes, mas isso ainda nao esta formalizado em runtime/operacao.

**Risco:** deploy mal configurado, apontando para banco errado, seed rodando em ambiente indevido ou confusao entre local e producao.

**Conclusao:** antes do cutover, ambiente e segredos precisam estar explicitamente organizados.

### 3.4 Cutover para banco remoto ainda nao foi validado ponta a ponta

Mesmo com o desenho arquitetural correto, ainda falta a validacao operacional no banco remoto gerenciado:

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
- O backend precisa continuar sendo a unica porta de acesso ao banco
- Integracoes nativas futuras com Supabase devem ser tratadas como decisao separada

### Produto

- Falha de entrega de token em condicao de corrida
- Regressao silenciosa em fluxos de premium e aprovacao manual
- Migracao para producao sem smoke test real dos fluxos mais sensiveis

---

## 5. Recomendacao de Estrategia

### Estrategia recomendada agora

Migrar para **Supabase como PostgreSQL gerenciado**, mantendo:

- acesso ao banco apenas pelo backend serverless
- `DATABASE_URL` como caminho principal nesta etapa
- frontend consumindo apenas a API propria

### Estrategia que eu nao recomendo agora

Misturar nesta mesma fase:

- SDK Supabase no frontend
- uso de `anon key` na aplicacao
- Auth/RLS nativos como base do fluxo principal

**Motivo:** isso aumenta a superficie de erro num momento em que a base ainda precisa fechar itens de robustez operacional.

---

## 6. Gate de Prontidao Antes da Migracao

### Bloqueadores

- [ ] Tornar idempotente e atomico o fluxo de confirmacao de pagamento/token
- [ ] Separar auditoria operacional de telemetria de comportamento em `produtos`
- [ ] Fechar estrategia de variaveis de ambiente para dev e producao
- [ ] Rodar migrations e seed em projeto Supabase de validacao
- [ ] Validar fluxo completo: produto, token, ativacao e pagamento manual

### Recomendados

- [ ] Criar checklist operacional de deploy/cutover
- [ ] Definir estrategia de rollback
- [ ] Medir comportamento de latencia no fluxo de busca por GTIN

---

## 7. Decisao Recomendada

### Se a pergunta for:

**"Ja podemos usar a Supabase como PostgreSQL gerenciado de producao agora?"**

Minha resposta e:

> **Ainda nao.**

### Se a pergunta for:

**"Ja podemos preparar uma migracao controlada para Supabase sem reinventar a arquitetura?"**

Minha resposta e:

> **Sim.**

Com a seguinte condicao:

- primeiro fechar robustez operacional
- depois validar ambiente Supabase
- so entao fazer o cutover real

---

## 8. Referencias Tecnicas

- `api/_lib/pagamentos/orquestrador.ts`
- `api/pagamentos/confirmar.ts`
- `api/pagamentos/manual/aprovar.ts`
- `api/pagamentos/manual/solicitar.ts`
- `api/produtos/[codigo].ts`
- `api/_lib/banco.ts`
- `repositorios/postgres.ts`
- `contextos/ContextoRepositorios.tsx`
- `.metadocs/supabase_learning.md`
- `.metadocs/roadmap.md`

---

## 9. Proximo Passo Recomendado

Antes de qualquer implementacao de Supabase em producao:

1. Debater o desenho final esperado da migracao
2. Definir se a etapa 1 sera apenas `Supabase = Postgres gerenciado`
3. Fechar criterios de sucesso e rollback
4. So depois abrir o plano de execucao

---

## 10. Branches de Feature Derivadas

As refatoracoes estruturais identificadas neste parecer devem ser detalhadas em `/.metadocs/feat/` antes da implementacao.

### Documentos abertos

- [refatoracao_auditoria_telemetria.md](./feat/refatoracao_auditoria_telemetria.md)
- [idempotencia_confirmacao_pagamento.md](./feat/idempotencia_confirmacao_pagamento.md)
- [postgres_gerenciado_supabase.md](./feat/postgres_gerenciado_supabase.md)
- [estrategia_ambiente.md](./feat/estrategia_ambiente.md)
- [governanca_catalogo_compartilhado.md](./feat/governanca_catalogo_compartilhado.md)
- [validacao_migrations_carga_remota.md](./feat/validacao_migrations_carga_remota.md)
- [smoke_test_producao.md](./feat/smoke_test_producao.md)
- [plano_implementacao_postgres_producao.md](./feat/plano_implementacao_postgres_producao.md)

### Convencao

- Durante planejamento: `/.metadocs/feat/<tema>.md`
- Apos implementacao: mover o mesmo arquivo para `/.metadocs/walkthrough/<tema>.md`
