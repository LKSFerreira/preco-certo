# Feature Plan - Estrategia Ambiente

> **Ultima atualizacao:** 2026-03-08
> **Status:** Em planejamento
> **Tipo:** Operacao e infraestrutura
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

O projeto esta se preparando para usar a Supabase como PostgreSQL gerenciado de producao, mantendo o backend proprio como unica porta de acesso ao banco.

Nesse cenario, a estrategia de ambiente passa a ser a base operacional do cutover.

O objetivo aqui nao e criar muitos ambientes. O objetivo e reduzir risco humano e manter o uso do free tier da Supabase sob controle.

---

## 2. Decisao Arquitetural

### Decisao

Os ambientes oficiais do projeto nesta fase serao:

- `local`
- `producao`

Nao sera criado, por enquanto, um ambiente remoto permanente de homologacao.

### Complemento operacional

No lugar de um ambiente formal de homologacao, o projeto adotara uma **validacao remota pre-cutover** como procedimento controlado.

Essa validacao remota nao e um terceiro ambiente oficial permanente. Ela e um ritual operacional anterior a virada.

---

## 3. Motivo da Decisao

Criar uma homologacao remota permanente agora traz custo operacional e risco de consumo desnecessario do free tier da Supabase.

Para o porte atual do projeto, isso tende a ser mais peso do que beneficio.

Ao manter apenas:

- `local`
- `producao`

e usar validacao remota controlada antes do cutover, o projeto preserva:

- simplicidade
- menor custo
- menor manutencao
- menor chance de confusao entre ambientes

---

## 4. Alternativas Avaliadas

### Alternativa A - Criar homologacao remota permanente

**Vantagens**

- isolamento operacional mais classico
- validacao remota recorrente mais simples

**Desvantagens**

- maior consumo do free tier
- duplicacao de storage e manutencao
- complexidade operacional desnecessaria neste momento

**Decisao:** descartada

### Alternativa B - Trabalhar apenas com local e producao, com validacao remota controlada

**Vantagens**

- simples
- economica
- proporcional ao projeto
- reduz risco de proliferacao de ambientes

**Desvantagens**

- exige checklist disciplinado antes do cutover
- exige mais cuidado com travas operacionais

**Decisao:** aprovada

---

## 5. Modelo de Ambientes

### Local

Ambiente principal de desenvolvimento.

**Caracteristicas**

- PostgreSQL via Docker
- ambiente rapido e descartavel
- migrations liberadas
- seed liberado
- reset permitido

### Producao

Ambiente real da aplicacao.

**Caracteristicas**

- PostgreSQL gerenciado na Supabase
- Vercel conectando via `DATABASE_URL`
- sem seed automatico
- sem reset
- mudancas controladas por checklist

### Validacao remota pre-cutover

Procedimento operacional temporario para provar:

- conectividade
- migrations
- carga inicial
- comportamento dos endpoints principais

**Observacao importante**

Essa validacao nao cria um ambiente oficial separado e permanente.

---

## 6. Problemas que Esta Estrategia Precisa Evitar

- backend local apontando sem querer para banco remoto
- producao apontando para banco errado
- seed rodando em producao por acidente
- reset destrutivo fora de `local`
- confusao entre regras de ambiente

---

## 7. Principios Operacionais

- ambiente deve ser explicito
- operacao destrutiva deve ser dificil de executar por engano
- local continua sendo a base do desenvolvimento
- producao deve ser tratada como ambiente restrito
- validacao remota deve ocorrer antes da virada, nao como ambiente permanente

---

## 8. Politica Proposta por Ambiente

### `local`

Permitido:

- migrar schema
- rodar seed
- resetar banco
- testar localmente

### `producao`

Permitido:

- conectar aplicacao via backend
- aplicar migrations controladas
- validar comportamento com smoke test

Proibido por padrao:

- resetar banco
- seed automatico
- operacoes destrutivas sem procedimento explicito

---

## 9. Plano de Implementacao Proposto

### Fase 1 - Definicao de ambiente

- explicitar ambientes oficiais na documentacao
- revisar nomenclatura de variaveis
- revisar como scripts reconhecem ambiente

### Fase 2 - Travas operacionais

- impedir reset fora de `local`
- impedir seed automatico em `producao`
- tornar o ambiente de execucao explicito nos scripts sensiveis

### Fase 3 - Procedimento de validacao remota

- definir checklist pre-cutover
- validar migrations no banco remoto
- validar conectividade Vercel -> banco remoto
- validar consultas e escritas essenciais

---

## 10. Criterios de Sucesso

- os ambientes oficiais ficam claros e sem ambiguidade
- scripts sensiveis respeitam o ambiente
- producao nao aceita operacoes destrutivas por acidente
- a validacao remota pre-cutover fica documentada como procedimento
- a estrategia continua leve o suficiente para o free tier

---

## 11. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- [postgres_gerenciado_supabase.md](./postgres_gerenciado_supabase.md)
- `scripts/init_db.py`
- `api/_lib/banco.ts`
- `.docker/compose.yaml`

---

## 12. Destino Pos-Implementacao

Apos a implementacao, este mesmo arquivo deve ser movido para:

- `.metadocs/walkthrough/estrategia_ambiente.md`

Depois do movimento:

- o conteudo deve ser ajustado de plano para walkthrough
- a referencia deve ser adicionada ao `historico.md`
- a feature deve ser marcada como concluida na documentacao correspondente
