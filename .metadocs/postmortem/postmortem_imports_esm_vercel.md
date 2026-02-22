# Post-Mortem: Erro 500 em Produção (IA Proxy)

## Sinopse
Logo após a implementação de variáveis de ambiente seguras e a refatoração do backend para o padrão Repository no servidor, a funcionalidade de IA em produção parou de funcionar, retornando Erro 500 (Internal Server Error).

## Impacto
Bloqueio total da extração de dados via OCR (fotos) e padronização de nomes de produtos em produção.

## Investigação
Os logs da Vercel revelaram a causa raiz:
`Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/_lib/auth' imported from /var/task/api/ia/analisar.js`

### Causa Raiz
O projeto utiliza o padrão **ESM** (`"type": "module"` no `package.json`). O runtime de Node.js nativo da Vercel exige que os imports ESM sejam literais em relação ao arquivo que existirá no **runtime**. 
- Ao usar TypeScript na Vercel, os arquivos `.ts` são transpilados para `.js`. 
- Portanto, os imports relativos **DEVEM** usar a extensão `.js`, mesmo que o arquivo físico no workspace seja `.ts`. 
- O erro anterior foi tentar usar a extensão `.ts` ou omitir a extensão, o que o Node.js ESM não resolve automaticamente.

## Solução Aplicada
1.  **Backend (API):** Atualizados todos os imports relativos internos da pasta `api/` para utilizar a extensão `.js`.
    -   `api/ia/analisar.ts` -> `import ... from '../_lib/auth.js'`
    -   `api/_lib/auth.ts` -> `import ... from './banco.js'`
    -   (Aplicado em todos os outros 5 endpoints da API)
2.  **Infraestrutura:** Atualizado `vercel.json` para permitir o header `X-Premium-Token` no CORS, prevenindo bloqueios futuros quando a área premium for ativada.

## Próximos Passos
1.  **Gatekeeper:** Solicitar deploy/push para produção.
2.  **Verificação:** Validar o retorno da API Groq em `https://www.semsusto.app/api/ia/analisar`.
