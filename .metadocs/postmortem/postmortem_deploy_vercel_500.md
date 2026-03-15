# Post-Mortem: Erros 500 em Todas as Serverless Functions na Vercel

**Data:** 15/03/2026
**Severidade:** Crítica (APIs completamente inoperantes em produção)
**Status:** Resolvido

## 1. O Problema

Após o deploy do banco PostgreSQL (Supabase) em produção, **todas** as rotas da API retornavam HTTP 500, incluindo `/api/produtos/:codigo` e `/api/ia/analisar`. O erro se manifestava como `ERR_MODULE_NOT_FOUND` no runtime, sem nenhuma mensagem útil no lado do cliente.

## 2. Causas Raiz (duas independentes)

### 2.1 — `pg` em `devDependencies`

O driver PostgreSQL (`pg`) estava em `devDependencies` no `package.json`. A Vercel executa `npm install --omit=dev` no build de produção, ou seja, **ignora pacotes em `devDependencies`**. Resultado: o módulo `pg` simplesmente não existia no deploy.

```diff
  "dependencies": {
+   "pg": "^8.18.0",
  },
  "devDependencies": {
-   "pg": "^8.18.0",
    "@types/pg": "^8.16.0",  // Apenas tipagem — pode ficar aqui
  }
```

### 2.2 — Imports ESM sem extensão `.js`

O projeto usa `"type": "module"` (ESM). O runtime da Vercel usa o ESM nativo do Node.js, que **exige extensão explícita** nos imports relativos. Múltiplos arquivos usavam imports como `from './_comum'` ao invés de `from './_comum.js'`.

**10 arquivos corrigidos:**

| Camada | Arquivo | Imports sem `.js` |
|---|---|---|
| Infra | `infra/ambiente/server.ts` | `./_comum` (×2) |
| Infra | `infra/ambiente/cliente.ts` | `./_comum` (×2) |
| API Lib | `api/_lib/ambiente.ts` | `../../infra/ambiente/server` (×2) |
| API Lib | `api/_lib/pagamentos/orquestrador.ts` | `../gateways/fabrica` |
| Gateways | `api/_lib/gateways/fabrica.ts` | `./tipos`, `./mercado-pago`, `./pagbank`, `./mockado`, `./nubank-failover` (×5) |
| Gateways | `api/_lib/gateways/pagbank.ts` | `./tipos` |
| Gateways | `api/_lib/gateways/mercado-pago.ts` | `./tipos` |
| Gateways | `api/_lib/gateways/nubank-failover.ts` | `./tipos`, `./mock_dados` (×2) |
| Gateways | `api/_lib/gateways/mockado.ts` | `./tipos`, `./mock_dados` (×2) |

## 3. Por Que Não Foi Detectado Antes

Ambos os problemas foram mascarados pelo ambiente de desenvolvimento local:

1. **`npm install` local** instala tudo (dev + prod), então `pg` sempre estava disponível.
2. **`tsx`** (usado no script `dev`) resolve imports sem extensão automaticamente, diferente do ESM nativo do Node.js.

O gap está na ausência de um **smoke test pós-deploy** que validasse se as serverless functions inicializam corretamente.

## 4. Lições e Ações Preventivas

| Lição | Ação |
|---|---|
| Pacotes usados em runtime devem estar em `dependencies` | Revisar `package.json` após toda adição de pacote: se será usado em serverless, vai para `dependencies` |
| `tsx` mascara problemas de ESM | Adotar a convenção de **sempre** incluir `.js` em imports relativos de arquivos `.ts` no projeto inteiro |
| Falta de validação pós-deploy | Considerar um health check mínimo (`/api/health`) que valide conexão com banco e imports críticos |
