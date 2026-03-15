# Walkthrough - Postgres Gerenciado Supabase

> **Ultima atualizacao:** 2026-03-14
> **Status:** Implementado e validado
> **Tipo:** Infraestrutura e cutover de producao
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

A decisao arquitetural do projeto para esta fase nao era usar Supabase como plataforma nativa da aplicacao.

A decisao foi usar a Supabase **como hospedeira do PostgreSQL de producao**, preservando o desenho atual:

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

### Fase 1 - Preparacao do ambiente remoto (Responsabilidade do Usuario)

- [ ] Criar projeto no painel do Supabase.
- [ ] Validar regiao (preferencialmente São Paulo `sa-east-1`) e credenciais.
- [ ] Obter a `Connection string (URI)` IPv4 / Pooler.
- [ ] Registrar essa string localmente como `DATABASE_URL_PROD` no arquivo `.env.local` (apenas para a etapa de carga).

### Fase 2 - Paridade de schema (Responsabilidade do Agente)

- [ ] Aplicar migrations no banco remoto via `lib/scripts/database/001_aplicar_migrations.ts`.
- [ ] Validar estrutura resultante, incluindo objetos auxiliares e triggers de auditoria.

### Fase 3 - Carga inicial (Responsabilidade do Agente)

- [ ] Importar dataset base via `lib/scripts/database/002_carregar_catalogo_inicial.ts`.
- [ ] Validar integridade e volume (30.196 registros) via `lib/scripts/database/003_validar_deploy_do_banco_em_producao.ts`.
- [ ] Revisar comportamento de consultas principais no banco remoto.

### Fase 4 - Integracao com aplicacao (Conjunta)

- [ ] Apontar ambiente serverless para o banco remoto (Configurar `DATABASE_URL` na Vercel).
- [ ] Garantir que a variavel `APP_ENV=producao` esta configurada na Vercel.
- [ ] Testar leitura/escrita pelos endpoints existentes apos o deploy.

### Fase 5 - Cutover controlado (Conjunta)

- [ ] Executar o checklist de smoke tests de producao (conforme `smoke_test_producao.md`).
- [ ] Definir aceite da migracao ou acionar rollback.

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
- `lib/scripts/database/001_aplicar_migrations.ts`
- `lib/scripts/database/002_carregar_catalogo_inicial.ts`
- `lib/scripts/database/003_validar_deploy_do_banco_em_producao.ts`

---

## 12. Destino Pos-Implementacao

Apos a implementacao, este mesmo arquivo deve ser movido para:

- `.metadocs/walkthrough/postgres_gerenciado_supabase.md`

Depois do movimento:

- o conteudo deve ser ajustado de plano para walkthrough
- a referencia deve ser adicionada ao `historico.md`
- a feature deve ser marcada como concluida na documentacao correspondente
