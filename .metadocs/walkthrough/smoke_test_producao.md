# Walkthrough - Smoke Test Produção

> **Última atualização:** 2026-03-14
> **Status:** Pronto para uso
> **Tipo:** Operação de validação pós-cutover
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

O projeto vai introduzir, pela primeira vez, um PostgreSQL remoto oficial no fluxo real de produção.

Este smoke test não é uma frente isolada para agora. Ele existe como etapa obrigatória do momento em que o PostgreSQL remoto na Supabase for efetivamente implementado e entrar no processo de cutover.

Depois do cutover, não basta assumir que tudo está funcionando porque:

- o deploy concluiu;
- a conexão com o banco existe;
- as migrations não falharam.

É necessário validar rapidamente, no ambiente real, que os fluxos críticos continuam operacionais.

---

## 2. Definição

### O que é smoke test de produção

Uma bateria curta de verificações de alto valor, executada no ambiente real de produção logo após uma mudança crítica.

### Objetivo

Responder rapidamente:

- a aplicação está viva;
- o backend está falando com o banco remoto;
- os fluxos essenciais ainda funcionam.

### O que não é

- não é suíte completa de QA;
- não é teste exaustivo;
- não é teste de carga;
- não é validação de todas as telas.

---

## 3. Decisão Arquitetural

### Decisão

Definir um smoke test oficial de produção como etapa obrigatória do cutover para o PostgreSQL remoto na Supabase.

### Princípio

O smoke test deve ser:

- curto;
- objetivo;
- executável manualmente;
- focado em fluxos críticos;
- forte o suficiente para sinalizar rollback quando necessário.

---

## 4. Problema que Esta Decisão Resolve

Evita a falsa sensação de sucesso baseada apenas em:

- deploy verde;
- script concluído;
- ausência de erro visível no log.

Esses sinais são insuficientes para provar que a experiência real do usuário continua funcionando.

---

## 5. Escopo do Smoke Test

O smoke test deve verificar somente o que é mais crítico para a operação do produto, depois que a aplicação em produção estiver apontando para o banco remoto oficial.

### Fluxos mínimos esperados

- a aplicação abre em produção;
- o endpoint principal de produto responde;
- a busca por GTIN conhecido funciona;
- a escrita controlada em fluxo de produto continua funcionando;
- o fluxo premium que toca banco continua operacional;
- nenhuma chamada crítica retorna erro 500.

---

## 6. Critérios de Seleção dos Testes

Cada verificação do smoke test deve obedecer a pelo menos um destes critérios:

- fluxo central de usuário;
- dependência direta do banco remoto;
- alto impacto em caso de falha;
- alto poder de detectar regressão grave.

---

## 7. Estrutura Recomendada

### Bloco 1 - Disponibilidade

- abrir o app em produção;
- validar carregamento inicial.

### Bloco 2 - Leitura crítica

- consultar um GTIN conhecido;
- validar resposta coerente.

### Bloco 3 - Escrita crítica

- validar um fluxo controlado que persiste dado esperado.

### Bloco 4 - Fluxo premium/banco

- validar ao menos um caminho sensível ligado a token, pagamento ou consulta persistida.

### Bloco 5 - Integridade observável

- confirmar ausência de erro técnico severo;
- confirmar que a experiência final é coerente.

---

## 8. Regra de Operação

O smoke test deve ser executado:

- logo após o cutover para o PostgreSQL remoto na Supabase;
- antes de considerar a migração concluída.

### Regra de decisão

Se qualquer verificação crítica falhar:

- o cutover não deve ser considerado aceito;
- a equipe deve avaliar rollback ou intervenção imediata.

---

## 9. Alternativas Avaliadas

### Alternativa A - Confiar apenas em logs e deploy

**Vantagens**

- rápido.

**Desvantagens**

- não valida experiência real;
- pode mascarar falhas de fluxo.

**Decisão:** descartada.

### Alternativa B - QA completa após cada cutover

**Vantagens**

- cobertura maior.

**Desvantagens**

- lenta demais para o momento imediato de virada;
- pouco proporcional ao objetivo.

**Decisão:** descartada como etapa inicial obrigatória.

### Alternativa C - Smoke test curto e oficial

**Vantagens**

- rápido;
- focado;
- forte para detectar falhas graves.

**Desvantagens**

- não substitui QA mais profunda.

**Decisão:** aprovada.

---

## 10. Plano de Implementação Proposto

Esta frente deve ser executada apenas quando a implantação do PostgreSQL remoto em Supabase entrar na fase de cutover.

### Fase 1 - Definir checklist oficial

- listar verificações obrigatórias;
- listar critério de sucesso e falha.

### Fase 2 - Definir procedimento operacional

- quando executar;
- quem executa;
- qual evidência mínima registrar.

### Fase 3 - Integrar ao cutover

- amarrar o smoke test ao processo de migração real;
- definir gatilho de rollback ou bloqueio de aceite.

---

## 11. Critérios de Sucesso

- existe checklist oficial de smoke test de produção;
- o smoke test cobre os fluxos mais críticos do app;
- a equipe sabe quando considerar o cutover aceito ou rejeitado;
- o processo continua curto e prático.

---

## 12. Referências

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- [estrategia_ambiente.md](../walkthrough/estrategia_ambiente.md)
- [validacao_migrations_carga_remota.md](../walkthrough/validacao_migrations_carga_remota.md)
- [postgres_gerenciado_supabase.md](./postgres_gerenciado_supabase.md)

---

## 13. Destino Pós-Implementação

Após a implementação, este mesmo arquivo deve ser movido para:

- `.metadocs/walkthrough/smoke_test_producao.md`

Depois do movimento:

- o conteúdo deve ser ajustado de plano para walkthrough;
- a referência deve ser adicionada ao `historico.md`;
- a feature deve ser marcada como concluída na documentação correspondente.
