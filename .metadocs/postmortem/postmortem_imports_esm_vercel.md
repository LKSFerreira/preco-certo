# Post-Mortem: Erro 500 em Produção (IA Proxy)

## Sinopse
Logo após a implementação de variáveis de ambiente seguras e a refatoração do backend para o padrão Repository no servidor, a funcionalidade de IA em produção parou de funcionar, retornando Erro 500 (Internal Server Error).

## Impacto
Bloqueio total da extração de dados via OCR (fotos) e padronização de nomes de produtos em produção.

## Investigação
Os logs da Vercel revelaram a causa raiz:
`Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/_lib/auth' imported from /var/task/api/ia/analisar.js`

### Causa Raiz
O projeto utiliza o padrão **ESM** (`"type": "module"` no `package.json`). O runtime de Node.js nativo da Vercel é estrito e exige que todos os imports relativos incluam a extensão do arquivo (ex: `.ts` ou `.js`). Localmente, ferramentas como `tsx` ou o ambiente Windows mascaravam essa necessidade.

## Solução Aplicada
1.  **Backend (API):** Adicionada a extensão `.ts` em todos os imports relativos dentro do diretório `api/`.
    -   `api/ia/analisar.ts` -> `import ... from '../_lib/auth.ts'`
    -   `api/_lib/auth.ts` -> `import ... from './banco.ts'`
2.  **Infraestrutura:** Atualizado `vercel.json` para permitir o header `X-Premium-Token` no CORS, prevenindo bloqueios futuros quando a área premium for ativada.

## Próximos Passos
1.  **Gatekeeper:** Solicitar deploy/push para produção.
2.  **Verificação:** Validar o retorno da API Groq em `https://www.semsusto.app/api/ia/analisar`.
