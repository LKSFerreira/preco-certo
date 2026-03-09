# Walkthrough - Governanca Catalogo Compartilhado

> **Ultima atualizacao:** 2026-03-09
> **Status:** Concluido
> **Tipo:** Arquitetura de dados e sincronizacao
> **Origem:** Implementacao derivada de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

Esta entrega resolveu o ponto mais sensivel da futura introducao do PostgreSQL remoto:

- o catalogo oficial nao pode receber escrita direta do dado local do usuario

Antes da implementacao, o fluxo `OfflineFirst` salvava localmente e depois fazia `POST /api/produtos/:codigo`, que escrevia diretamente em `produtos`.

Isso significava que qualquer produto local podia contaminar o catalogo oficial imediatamente.

---

## 2. Decisao aplicada

Foi implementada a separacao formal entre:

- `produtos`
- `produtos_adicionados_pelo_usuario`

Papeis consolidados:

- `produtos`: catalogo oficial de leitura
- `produtos_adicionados_pelo_usuario`: staging/inbox para contribuicoes do catalogo local

O resultado pratico e:

- `GET /api/produtos/:codigo` continua lendo `produtos`
- `POST /api/produtos/:codigo` deixa de escrever em `produtos` e passa a escrever em staging

---

## 3. O que foi implementado

### 3.1 Nova tabela de staging

Migration criada:

- `infra/migrations/011_cria_tabela_produtos_adicionados_pelo_usuario.sql`

Estrutura principal:

- `codigo_barras`
- `descricao`
- `marca`
- `tamanho`
- `preco_informado`
- `imagem`
- `origem`
- `status_curadoria`
- `usuario_id`
- `ip_hash`
- timestamps

Decisoes relevantes:

- `status_curadoria` inicia como `pendente`
- `origem` inicia como `catalogo_local_usuario`
- existe `UNIQUE (codigo_barras, usuario_id, ip_hash)` para reaproveitar a mesma contribuicao do mesmo contexto em vez de gerar lixo duplicado infinito
- a tabela recebeu trigger de auditoria para manter rastreabilidade operacional de escrita

### 3.2 Leitura oficial preservada

Arquivo:

- `api/produtos/[codigo].ts`

O `GET` foi mantido lendo de `produtos`.

Isso preserva a regra central:

- o usuario consulta sempre o catalogo oficial
- staging nao vaza como fonte de leitura publica

### 3.3 Escrita remota desviada para staging

No mesmo endpoint, o `POST` passou a:

- validar payload
- respeitar rate limit
- abrir transacao com contexto
- gravar em `produtos_adicionados_pelo_usuario`
- retornar `202 Accepted`

Resposta nova:

- `status: enviado_para_curadoria`
- `destino: produtos_adicionados_pelo_usuario`

Esse detalhe e importante:

- o backend nao finge mais que a escrita foi consolidada no catalogo oficial
- ele assume corretamente que o dado foi apenas aceito para curadoria

### 3.4 Contrato do cliente alinhado

Arquivos:

- `repositorios/offline-first.ts`
- `repositorios/postgres.ts`

O comportamento agora esta descrito corretamente:

- leitura remota = catalogo oficial
- escrita remota = staging remoto

Ou seja, o nome `OfflineFirst` continua valido, mas a responsabilidade do remoto ficou semantica e arquiteturalmente correta.

---

## 4. O que esta entrega evita

- dado local escrevendo direto em `produtos`
- contaminacao imediata do catalogo oficial
- falsa impressao de que sincronizar = publicar
- acoplamento entre contribuicao do usuario e consolidacao oficial

---

## 5. O que ainda nao foi implementado

Esta entrega nao implementa ainda:

- promocao automatica de staging para `produtos`
- curadoria por IA
- sync automatico em segundo plano
- regras finais de enriquecimento de campos `null`

Esses pontos continuam como evolucao futura, mas a base de governanca ja esta pronta.

Isso e importante porque a arquitetura deixa de depender dessas features futuras para ser correta hoje.

---

## 6. Arquivos impactados

- `infra/migrations/011_cria_tabela_produtos_adicionados_pelo_usuario.sql`
- `api/produtos/[codigo].ts`
- `repositorios/offline-first.ts`
- `repositorios/postgres.ts`

---

## 7. Validacao executada

### Migration

Comando:

```bash
docker compose -f .docker/compose.yaml exec backend env APP_ENV=local INIT_DB_IMPORTAR_DADOS=false INIT_DB_RESETAR_BANCO=false python scripts/init_db.py
```

Resultado:

- migration `011` aplicada com sucesso

### Build

Comando:

```bash
docker compose -f .docker/compose.yaml exec app npm run build
```

Resultado:

- build concluido com sucesso

### Prova do fluxo de staging

Comando de POST:

```bash
docker compose -f .docker/compose.yaml exec app node -e "fetch('http://localhost:3000/api/produtos/9990000000123',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({descricao:'Produto Staging Teste',marca:'Marca Teste',tamanho:'500 mL',preco_estimado:12.34,imagem:''})}).then(async(res)=>{console.log(JSON.stringify({status:res.status,body:await res.json()}));})"
```

Resultado:

- `202 Accepted`
- `status: enviado_para_curadoria`
- `destino: produtos_adicionados_pelo_usuario`

Consulta no banco:

```sql
SELECT codigo_barras, status_curadoria, origem, usuario_id
FROM produtos_adicionados_pelo_usuario
WHERE codigo_barras = '9990000000123';

SELECT codigo_barras
FROM produtos
WHERE codigo_barras = '9990000000123';
```

Resultado:

- 1 linha em `produtos_adicionados_pelo_usuario`
- 0 linhas em `produtos`

Isso valida exatamente a governanca aprovada.

---

## 8. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- [postgres_gerenciado_supabase.md](../feat/postgres_gerenciado_supabase.md)
- [plano_implementacao_postgres_producao.md](../feat/plano_implementacao_postgres_producao.md)
