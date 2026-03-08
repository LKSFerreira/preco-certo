# Feature Plan - Validacao Migrations Carga Remota

> **Ultima atualizacao:** 2026-03-08
> **Status:** Em planejamento
> **Tipo:** Operacao de banco remoto
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

O projeto vai introduzir, pela primeira vez, um PostgreSQL remoto oficial em producao.

Antes do cutover, nao basta confiar que o banco local ja valida tudo. E necessario provar que o banco remoto:

- sobe o schema corretamente
- recebe a carga inicial corretamente
- responde corretamente ao backend e aos fluxos principais

---

## 2. Decisao Arquitetural

### Decisao

Separar formalmente as responsabilidades operacionais em etapas distintas:

- `migrations`
- `carga_inicial`
- `validacao`

Por cima dessas etapas, permitir um **orquestrador operacional fino** para coordenar a execucao, sem esconder o comportamento de cada etapa.

### O que isso significa

O projeto **nao** adotara um script magico opaco que decide tudo implicitamente.

O projeto **sim** pode adotar um orquestrador leve que:

- execute etapas na ordem correta
- mostre explicitamente o ambiente alvo
- falhe cedo em caso de erro
- gere resumo final

---

## 3. Problema que Esta Decisao Resolve

Evita dois extremos ruins:

### Extremo 1 - Operacao manual demais

- alta chance de erro humano
- ordem inconsistente entre passos
- esquecimentos em validacao

### Extremo 2 - Script faz-tudo sem transparencia

- baixa auditabilidade
- maior risco de operacao errada em producao
- comportamento implicito perigoso

### Equilibrio aprovado

Etapas separadas com um orquestrador fino e auditavel.

---

## 4. Separacao de Responsabilidades

### `migrations`

Responsavel por estrutura:

- tabelas
- indices
- constraints
- funcoes
- triggers

### `carga_inicial`

Responsavel por dados base.

No caso deste projeto, a carga inicial inclui o catalogo grande oriundo de `produtos_higienizados.json`.

### `validacao`

Responsavel por provar que o resultado e usavel:

- schema correto
- volume esperado
- leitura/escrita funcionando
- fluxos principais operando

---

## 5. Regra Importante Sobre Seed

O catalogo grande **nao** deve ser tratado como seed trivial.

Ele deve ser tratado operacionalmente como:

- carga inicial de catalogo

Essa distincao existe para evitar:

- automatismos perigosos
- execucao indevida em producao
- confusao entre estrutura e volume de dados

---

## 6. Modelo Operacional Aprovado

### Etapas independentes

Cada etapa deve existir de forma separada e explicita:

- aplicar schema
- carregar catalogo
- validar resultado

### Orquestrador fino

Pode existir uma camada acima para executar:

- schema -> carga -> validacao

Mas esse orquestrador deve ser:

- transparente
- declarativo
- sem heuristicas ocultas
- sem inferir ambiente de forma perigosa

---

## 7. O Que o Orquestrador Pode Fazer

- imprimir o ambiente alvo
- imprimir a operacao em execucao
- chamar as etapas na ordem certa
- abortar se alguma etapa falhar
- emitir resumo final de sucesso/falha

## 8. O Que o Orquestrador Nao Deve Fazer

- tomar decisoes destrutivas implicitamente
- rodar carga em producao sem etapa clara
- esconder se esta rodando migration, carga ou validacao
- misturar responsabilidade de negocio com responsabilidade operacional

---

## 9. Provas Necessarias no Banco Remoto

### Prova 1 - Schema

Validar:

- migrations aplicadas
- `schema_migrations` coerente
- estrutura final esperada

### Prova 2 - Carga inicial

Validar:

- volume inserido
- duplicidade tratada corretamente
- integridade dos campos

### Prova 3 - Uso real

Validar:

- busca por GTIN
- escrita controlada
- fluxo de token/pagamento relacionado ao banco

---

## 10. Alternativas Avaliadas

### Alternativa A - Reaproveitar `init_db.py` como fluxo unico remoto

**Vantagens**

- rapido de aproveitar
- menos codigo novo

**Desvantagens**

- mistura responsabilidades
- aumenta risco operacional em ambiente remoto

**Decisao:** descartada como modelo final de operacao

### Alternativa B - Separar etapas sem orquestrador

**Vantagens**

- clareza maxima

**Desvantagens**

- aumenta trabalho manual
- mais chance de erro humano

**Decisao:** descartada como modelo preferencial

### Alternativa C - Etapas separadas com orquestrador fino

**Vantagens**

- equilibrio entre clareza e automacao
- reduz erro humano
- mantem auditabilidade

**Desvantagens**

- exige desenho operacional disciplinado

**Decisao:** aprovada

---

## 11. Plano de Implementacao Proposto

### Fase 1 - Definir fronteiras das etapas

- separar conceitualmente migrations, carga inicial e validacao
- revisar o papel atual de `scripts/init_db.py`

### Fase 2 - Definir o contrato do orquestrador

- entrada explicita de ambiente
- ordem das operacoes
- politica de falha
- formato do resumo final

### Fase 3 - Definir checks de validacao

- contagem esperada
- verificacoes de schema
- verificacoes de conectividade e comportamento

---

## 12. Criterios de Sucesso

- migrations, carga e validacao ficam conceitualmente separadas
- o catalogo grande passa a ser tratado como carga inicial
- existe um orquestrador leve para coordenar operacao
- o processo remoto fica auditavel e previsivel
- nenhuma etapa perigosa fica implicita

---

## 13. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- [estrategia_ambiente.md](./estrategia_ambiente.md)
- [postgres_gerenciado_supabase.md](./postgres_gerenciado_supabase.md)
- `scripts/init_db.py`

---

## 14. Destino Pos-Implementacao

Apos a implementacao, este mesmo arquivo deve ser movido para:

- `.metadocs/walkthrough/validacao_migrations_carga_remota.md`

Depois do movimento:

- o conteudo deve ser ajustado de plano para walkthrough
- a referencia deve ser adicionada ao `historico.md`
- a feature deve ser marcada como concluida na documentacao correspondente
