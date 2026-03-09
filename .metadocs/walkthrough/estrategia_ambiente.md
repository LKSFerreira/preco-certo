# Walkthrough - Estrategia Ambiente

> **Ultima atualizacao:** 2026-03-08
> **Status:** Concluido
> **Tipo:** Operacao e infraestrutura
> **Origem:** Implementacao derivada de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

Esta entrega prepara a camada de ambiente para o futuro cutover do PostgreSQL remoto, sem ativar o banco de producao nesta branch.

O projeto continua com dois ambientes oficiais:

- `local`
- `producao`

E segue sem ambiente remoto permanente de homologacao.

O objetivo da implementacao foi tornar o comportamento por ambiente explicito, evitar defaults perigosos e bloquear operacoes destrutivas fora de `local`.

---

## 2. O que foi implementado

### 2.1 Ambiente operacional explicito

Foi introduzido o contrato:

- `APP_ENV=local|producao` no backend/scripts
- `VITE_APP_ENV=local|producao` no frontend

Esse contrato foi refletido em:

- `api/_lib/ambiente.ts`
- `services/ambiente.ts`
- `.docker/compose.yaml`
- `.env.example`

### 2.2 Frontend com default seguro

O `ContextoRepositorios` deixou de assumir que `VITE_USAR_BANCO_POSTGRES` deve ficar ligado em qualquer ambiente quando a flag estiver ausente.

Novo comportamento:

- `local`: PostgreSQL habilitado por padrao
- `producao`: PostgreSQL desabilitado por padrao ate o cutover

Ou seja, o app nao ativa o fluxo remoto por inferencia em producao enquanto o banco oficial ainda nao existe.

### 2.3 Pool do banco inicializado sob demanda

`api/_lib/banco.ts` foi refatorado para criar o pool PostgreSQL apenas quando algum handler realmente tenta usar o banco.

Isso evita derrubar o servidor local inteiro so porque `DATABASE_URL` nao esta ativa em um ambiente que ainda nao deveria usar PostgreSQL.

Quando o banco for realmente acionado sem configuracao valida, a falha agora aponta explicitamente para `APP_ENV` e para a necessidade de manter o fluxo PostgreSQL desligado ate o cutover.

### 2.4 Travas no `init_db.py`

`scripts/init_db.py` deixou de depender de uma constante interna ambigua e passou a operar com flags de ambiente explicitas:

- `APP_ENV`
- `INIT_DB_IMPORTAR_DADOS`
- `INIT_DB_RESETAR_BANCO`

Regras implementadas:

- reset permitido apenas em `APP_ENV=local`
- importacao de dados padrao:
  - `local`: `true`
  - `producao`: `false`
- criacao automatica de banco permitida apenas em `local`

Isso blinda o projeto contra seed/reset acidental fora do ambiente de desenvolvimento.

### 2.5 Alinhamento do contrato de configuracao

`.env.example` foi reescrito para refletir a arquitetura atual:

- Supabase nao aparece mais como SDK/Auth/anon key do frontend
- `DATABASE_URL` segue como ponto unico de conexao do backend
- a producao atual permanece sem PostgreSQL remoto ativo
- o cutover futuro continua planejado, mas nao e antecipado nesta fase

---

## 3. Arquivos impactados

- `api/_lib/ambiente.ts`
- `api/_lib/banco.ts`
- `services/ambiente.ts`
- `contextos/ContextoRepositorios.tsx`
- `scripts/init_db.py`
- `.docker/compose.yaml`
- `.env.example`
- `vite-env.d.ts`

---

## 4. O que esta decisao evita

- frontend tentando usar PostgreSQL remoto em producao por default
- script de banco rodando carga automatica em ambiente errado
- reset destrutivo fora de `local`
- dependencia de variavel antiga e ambigua (`PG_ENV=development`)
- documentacao sugerindo um modelo de Supabase que o projeto ainda nao usa

---

## 5. Validacao executada

### Build do app

Comando:

```bash
docker compose -f .docker/compose.yaml exec app npm run build
```

Resultado:

- build concluido com sucesso

### Validacao do `init_db.py` no ambiente local

Comando:

```bash
docker compose -f .docker/compose.yaml exec backend env APP_ENV=local INIT_DB_IMPORTAR_DADOS=false INIT_DB_RESETAR_BANCO=false python scripts/init_db.py
```

Resultado:

- `APP_ENV=local` reconhecido corretamente
- conexao com PostgreSQL local bem-sucedida
- migrations aplicadas/puladas corretamente
- importacao de dados respeitando a flag explicita (`false`)

---

## 6. Limites desta entrega

Esta implementacao **nao**:

- ativa PostgreSQL remoto em producao
- faz cutover para Supabase
- cria homologacao remota permanente
- separa ainda as etapas de migration, carga inicial e validacao remota

Ela apenas prepara a base operacional segura para essas fases.

---

## 7. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- [postgres_gerenciado_supabase.md](../feat/postgres_gerenciado_supabase.md)
- [plano_implementacao_postgres_producao.md](../feat/plano_implementacao_postgres_producao.md)
