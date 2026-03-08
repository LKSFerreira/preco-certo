# Feature Plan - Smoke Test Producao

> **Ultima atualizacao:** 2026-03-08
> **Status:** Em planejamento
> **Tipo:** Operacao de validacao pos-cutover
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

O projeto vai introduzir, pela primeira vez, um PostgreSQL remoto oficial no fluxo real de producao.

Depois do cutover, nao basta assumir que tudo esta funcionando porque:

- o deploy concluiu
- a conexao com o banco existe
- as migrations nao falharam

E necessario validar rapidamente, no ambiente real, que os fluxos criticos continuam operacionais.

---

## 2. Definicao

### O que e smoke test de producao

Uma bateria curta de verificacoes de alto valor, executada no ambiente real de producao logo apos uma mudanca critica.

### Objetivo

Responder rapidamente:

- a aplicacao esta viva?
- o backend esta falando com o banco remoto?
- os fluxos essenciais ainda funcionam?

### O que nao e

- nao e suite completa de QA
- nao e teste exaustivo
- nao e teste de carga
- nao e validacao de todas as telas

---

## 3. Decisao Arquitetural

### Decisao

Definir um smoke test oficial de producao como etapa obrigatoria do cutover para o PostgreSQL remoto.

### Principio

O smoke test deve ser:

- curto
- objetivo
- executavel manualmente
- focado em fluxos criticos
- forte o suficiente para sinalizar rollback quando necessario

---

## 4. Problema que Esta Decisao Resolve

Evita a falsa sensacao de sucesso baseada apenas em:

- deploy verde
- script concluido
- sem erro visivel no log

Esses sinais sao insuficientes para provar que a experiencia real do usuario continua funcionando.

---

## 5. Escopo do Smoke Test

O smoke test deve verificar somente o que e mais critico para a operacao do produto.

### Fluxos minimos esperados

- aplicacao abre em producao
- endpoint principal de produto responde
- busca por GTIN conhecido funciona
- escrita controlada em fluxo de produto continua funcionando
- fluxo premium que toca banco continua operacional
- nenhuma chamada critica retorna erro 500

---

## 6. Criterios de Selecao dos Testes

Cada verificacao do smoke test deve obedecer a pelo menos um destes criterios:

- fluxo central de usuario
- dependencia direta do banco remoto
- alto impacto em caso de falha
- alto poder de detectar regressao grave

---

## 7. Estrutura Recomendada

### Bloco 1 - Disponibilidade

- abrir o app em producao
- validar carregamento inicial

### Bloco 2 - Leitura critica

- consultar um GTIN conhecido
- validar resposta coerente

### Bloco 3 - Escrita critica

- validar um fluxo controlado que persiste dado esperado

### Bloco 4 - Fluxo premium/banco

- validar ao menos um caminho sensivel ligado a token/pagamento/consulta persistida

### Bloco 5 - Integridade observavel

- confirmar ausencia de erro tecnico severo
- confirmar que a experiencia final e coerente

---

## 8. Regra de Operacao

O smoke test deve ser executado:

- logo apos o cutover
- antes de considerar a migracao concluida

### Regra de decisao

Se qualquer verificacao critica falhar:

- o cutover nao deve ser considerado aceito
- a equipe deve avaliar rollback ou intervencao imediata

---

## 9. Alternativas Avaliadas

### Alternativa A - Confiar apenas em logs e deploy

**Vantagens**

- rapido

**Desvantagens**

- nao valida experiencia real
- pode mascarar falhas de fluxo

**Decisao:** descartada

### Alternativa B - QA completa apos cada cutover

**Vantagens**

- cobertura maior

**Desvantagens**

- lenta demais para o momento imediato de virada
- pouco proporcional ao objetivo

**Decisao:** descartada como etapa inicial obrigatoria

### Alternativa C - Smoke test curto e oficial

**Vantagens**

- rapido
- focado
- forte para detectar falhas graves

**Desvantagens**

- nao substitui QA mais profunda

**Decisao:** aprovada

---

## 10. Plano de Implementacao Proposto

### Fase 1 - Definir checklist oficial

- listar verificacoes obrigatorias
- listar criterio de sucesso/falha

### Fase 2 - Definir procedimento operacional

- quando executar
- quem executa
- qual evidencia minima registrar

### Fase 3 - Integrar ao cutover

- amarrar smoke test ao processo de migracao real
- definir gatilho de rollback ou bloqueio de aceite

---

## 11. Criterios de Sucesso

- existe checklist oficial de smoke test de producao
- o smoke test cobre os fluxos mais criticos do app
- a equipe sabe quando considerar o cutover aceito ou rejeitado
- o processo continua curto e pratico

---

## 12. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- [estrategia_ambiente.md](./estrategia_ambiente.md)
- [validacao_migrations_carga_remota.md](./validacao_migrations_carga_remota.md)
- [postgres_gerenciado_supabase.md](./postgres_gerenciado_supabase.md)

---

## 13. Destino Pos-Implementacao

Apos a implementacao, este mesmo arquivo deve ser movido para:

- `.metadocs/walkthrough/smoke_test_producao.md`

Depois do movimento:

- o conteudo deve ser ajustado de plano para walkthrough
- a referencia deve ser adicionada ao `historico.md`
- a feature deve ser marcada como concluida na documentacao correspondente
