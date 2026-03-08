# Feature Plan - Postgres Gerenciado Supabase

> **Ultima atualizacao:** 2026-03-08
> **Status:** Em planejamento
> **Tipo:** Infraestrutura e cutover de producao
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

A decisao arquitetural do projeto para esta fase nao e usar Supabase como plataforma nativa da aplicacao.

A decisao e usar a Supabase **como hospedeira do PostgreSQL de producao**, preservando o desenho atual:

- banco local em Docker para desenvolvimento
- PostgreSQL remoto em producao
- API propria como unica porta de entrada ao banco
- frontend sem acesso direto ao banco

---

## 2. Decisao Arquitetural

### Decisao

Usar a Supabase como **Postgres gerenciado de producao**, buscando paridade entre o banco local e o banco remoto.

### O que isso significa na pratica

- manter `pg` no backend
- manter `DATABASE_URL` como principal ponto de conexao
- manter o frontend consumindo apenas a API propria
- reaproveitar migrations SQL existentes
- tratar Supabase como infraestrutura de banco, nao como SDK/base nativa de app nesta etapa

### O que isso explicitamente nao significa agora

- nao usar SDK Supabase no frontend
- nao usar `anon key` no cliente
- nao depender de PostgREST
- nao depender de RLS como requisito central desta fase
- nao introduzir Auth Supabase nesta migracao

---

## 3. Problema que Esta Decisao Resolve

Evita misturar duas migracoes em uma so:

- migracao para banco remoto de producao
- migracao para plataforma nativa Supabase

Ao separar essas trilhas, o projeto ganha:

- simplicidade de operacao
- menor superficie de erro
- maior paridade entre dev e producao
- menor acoplamento prematuro com fornecedor

---

## 4. Alternativas Avaliadas

### Alternativa A - Supabase como plataforma nativa ja nesta fase

**Exemplos**

- SDK no frontend
- `anon key`
- RLS como base do fluxo
- integracao direta com recursos da plataforma

**Desvantagens**

- aumenta escopo e risco da migracao
- mistura persistencia com seguranca/aplicacao
- exige endurecimento de RLS desde o primeiro passo

**Decisao:** descartada para esta fase

### Alternativa B - Supabase apenas como PostgreSQL gerenciado

**Vantagens**

- menor acoplamento
- menor risco
- aproveita 100% da arquitetura atual
- paridade forte com ambiente local

**Desvantagens**

- deixa recursos nativos da plataforma para depois
- exige disciplina maior na API propria

**Decisao:** aprovada

---

## 5. Objetivo da Implementacao

Realizar o cutover do banco de producao para um PostgreSQL gerenciado na Supabase, mantendo o desenho atual da aplicacao e sem expandir o escopo para integracao nativa da plataforma.

---

## 6. Escopo Proposto

### Dentro do escopo

- criar/validar projeto Supabase na regiao adequada
- configurar `DATABASE_URL` de producao
- rodar migrations no banco remoto
- importar dataset inicial
- validar conectividade da Vercel com o banco remoto
- validar fluxos de leitura e escrita via API propria

### Fora do escopo

- SDK Supabase no frontend
- Auth Supabase
- RLS obrigatorio como eixo desta fase
- Storage/Edge Functions
- redesign de repositorios no cliente para Supabase nativo

---

## 7. Riscos Reais Desta Fase

### Operacionais

- string de conexao incorreta
- environment apontando para banco errado
- seed em ambiente indevido
- falha de conectividade entre Vercel e banco remoto

### Produto

- degradacao de latencia na busca por GTIN
- regressao em fluxos de pagamento/token
- inconsistencias entre dados locais e remotos

### Infraestrutura

- uso excessivo de storage/logs no free tier
- falta de rollback claro em caso de problema no cutover

---

## 8. Dependencias Previas

Antes do cutover, alguns itens do backend precisam estar fortalecidos:

- idempotencia/concorrencia na confirmacao de pagamento
- separacao entre auditoria e telemetria
- estrategia clara de ambientes

Esses itens nao sao "problemas do Supabase"; sao pre-requisitos para operar com seguranca em um banco remoto de producao.

---

## 9. Plano de Implementacao Proposto

### Fase 1 - Preparacao do ambiente remoto

- criar projeto Supabase
- validar regiao e credenciais
- registrar `DATABASE_URL` de producao

### Fase 2 - Paridade de schema

- aplicar migrations existentes
- validar estrutura resultante
- revisar objetos auxiliares e indices

### Fase 3 - Carga inicial

- importar dataset base
- validar integridade e volume
- revisar comportamento de consultas principais

### Fase 4 - Integracao com aplicacao

- apontar ambiente serverless para o banco remoto
- testar leitura/escrita pelos endpoints existentes
- validar fallback e comportamento `Offline First`

### Fase 5 - Cutover controlado

- definir checklist de deploy
- definir rollback
- validar smoke tests de producao

---

## 10. Criterios de Sucesso

- o banco de producao replica o schema local esperado
- a Vercel conecta ao banco remoto sem alterar a arquitetura do app
- o frontend continua falando apenas com a API propria
- os fluxos principais funcionam com o banco remoto
- a migracao nao introduz dependencias nativas desnecessarias do Supabase

---

## 11. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- `api/_lib/banco.ts`
- `repositorios/postgres.ts`
- `contextos/ContextoRepositorios.tsx`
- `scripts/init_db.py`

---

## 12. Destino Pos-Implementacao

Apos a implementacao, este mesmo arquivo deve ser movido para:

- `.metadocs/walkthrough/postgres_gerenciado_supabase.md`

Depois do movimento:

- o conteudo deve ser ajustado de plano para walkthrough
- a referencia deve ser adicionada ao `historico.md`
- a feature deve ser marcada como concluida na documentacao correspondente
