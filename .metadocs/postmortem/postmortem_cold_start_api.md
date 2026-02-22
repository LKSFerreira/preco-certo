# Post-mortem: Erros de Time-out / Falha na Primeira Requisição (Cold Start)

## Título do Problema
Primeira requisição às APIs (Groq IA / Cosmos) falha sistematicamente após 10 minutos de inatividade em produção.

## Impacto
- **Usuário Final:** Frustração ao tentar escanear o primeiro produto; o app parece "travado" ou com erro na primeira tentativa.
- **Desenvolvimento:** Dificuldade em depurar, pois após o primeiro erro as requisições seguintes funcionam normalmente.

## Causa Raiz
**Cold Start de Serverless Functions (Vercel):** As funções na pasta `/api` entram em hibernação após um período de inatividade (geralmente 10 minutos no plano Hobby/Pro da Vercel). A primeira requisição acorda a infraestrutura, mas o tempo de boot + a lógica de negócio excede o timeout do frontend (7-10s), causando falha.

## Solução (O "Despertador de APIs")
Implementar um mecanismo de **Silent Warm-up**:
1.  **Gatilho Antecipado:** Disparar um "ping" silencioso no momento em que o usuário clica em "Ler Código", antes mesmo do scanner ser aberto.
2.  **Paralelismo:** Enquanto o usuário posiciona o celular, a Vercel realiza o boot da função.
3.  **Controle de Abuso:** Usar um timestamp no `sessionStorage` para só realizar o ping se houver inatividade superior a 10 minutos.

## Lições Aprendidas
- Em arquiteturas Serverless, a experiência de "Cold Start" deve ser gerenciada pelo frontend em ações que precedem chamadas críticas.
- "Fire and forget" é uma técnica válida para aquecer infraestrutura sem penalizar a UI.
