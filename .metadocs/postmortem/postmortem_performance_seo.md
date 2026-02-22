Aqui está o seu Post-mortem atualizado. Incluí toda a jornada final da auditoria do Lighthouse, detalhando a resolução do gargalo do JavaScript (Code Splitting e Lazy Loading) e a conquista da nota 100 em Acessibilidade com os ajustes de contraste.

```markdown
# Post-mortem: Falha de Social Preview (WhatsApp), SEO Semântico e Otimização de Infraestrutura

## Título do Problema
Link do App Sem Susto no WhatsApp sem imagem/descrição, indexação errônea por IAs, conteúdo classificado como "Thin Content", gargalo de Performance no carregamento inicial (Bundle Monolítico) e penalizações de Acessibilidade (Contraste).

## Impacto
- **Usuário Final:** Experiência de compartilhamento pobre no WhatsApp. Telas em branco prolongadas no primeiro acesso em redes 3G/4G (First Contentful Paint alto). Dificuldade de leitura para usuários com deficiência visual ou sob luz do sol.
- **Negócio:** Perda de autoridade de marca. IAs fornecem informações incorretas. Possível perda de conversão devido à demora no carregamento da câmera e interface.
- **SEO e Técnico:** Desperdício de *Crawl Budget*, página vista pelos robôs como um "beco sem saída" (0% links), penalização por falta de canonicidade e notas de Core Web Vitals prejudicadas pelo peso do JavaScript.

## Linha do Tempo
- **Descoberta Inicial:** Link `https://www.semsusto.app` colado no WhatsApp exibia apenas a URL bruta e IAs associavam a serviços automotivos.
- **Auditoria Inicial de SEO:** Pontuação de 67% com erros críticos: "Missing H1", "Word count 0" e "Falta de apple-touch-icon".
- **Auditoria Avançada de SEO (22/02):** Identificação de "Thin Content" (apenas 134 palavras), inconsistência de palavras-chave entre H1 e conteúdo, ausência de links (0%) e falta de tag canônica.
- **Auditoria Lighthouse (22/02):** Obtenção de nota 100 em SEO e Práticas Recomendadas, porém com Acessibilidade em 90 (falhas de contraste) e Performance travada na casa dos 77~88 (FCP/LCP altos de 2.7s a 3.8s devido ao peso do JS). Falso-positivo gerado por extensões do Chrome.
- **Resolução Final (22/02):** Implementação de Code Splitting no Vite, Lazy Loading no React, correção de cores no Tailwind e padronização de testes em Aba Anônima, atingindo o gabarito 100/100 nas métricas do Google.

## Causa Raiz
1. **Ausência de Protocolo Open Graph:** Falta de tags `og:*` impedindo o preview.
2. **SPA Invisível e Conteúdo Ralo:** Crawlers de SEO não executam JS pesado imediatamente. O HTML inicial tinha apenas 134 palavras.
3. **Página "Beco sem Saída":** Zero tags `<a>` no HTML inicial, destruindo a pontuação de malha de links.
4. **Falta de Hierarquia (A11y/SEO):** Ausência inicial de `<h1>` e inconsistência semântica de palavras-chave.
5. **Bundle Monolítico (Gargalo de Performance):** O Vite estava empacotando todo o código da aplicação (React, UI, Câmera, e a pesada lib `@google/genai`) em um único arquivo JS de quase 1MB. O usuário era forçado a baixar recursos que não usaria na primeira tela.
6. **Contraste de Cores (Acessibilidade WCAG):** Uso de `text-gray-400` no fundo branco e `bg-verde-600` com texto branco não atingiam a proporção mínima de contraste exigida (4.5:1).
7. **Interferência de Extensões:** Bloqueadores de anúncio e gerenciadores de senha estavam injetando scripts durante a auditoria do Lighthouse, derrubando a nota artificialmente.

## Solução Implementada

### 1. Metatags, Identidade Social e Infraestrutura (`/public`)
- Injeção de tags OG, Twitter Cards e `apple-touch-icon`.
- Inserção da tag `<link rel="canonical" href="https://www.semsusto.app/" />`.
- Configuração de `robots.txt` e `sitemap.xml`.

### 2. Estrutura Semântica e Fallback "SEO de Guerrilha"
- **Expansão de Conteúdo:** Bloco de fallback na `<div id="root">` expandido para ~340 palavras, focando em termos-chave ("calculadora de supermercado").
- **Hierarquia e Malha de Links:** Implementação de tags HTML5, menu de navegação interno com âncoras e links externos/intent de compartilhamento social ocultos visualmente na UI final, mas lidos instantaneamente pelos robôs.

### 3. Performance Máxima (Code Splitting & Lazy Loading)
- **Fatiamento no Vite:** Implementação da propriedade `build.rollupOptions.manualChunks` no `vite.config.ts` para separar o `'vendor-react'` (core) e `'vendor-ai'` (`@google/genai`), impedindo que o bundle inicial ficasse pesado.
- **Componentes sob Demanda:** Refatoração do `App.tsx` para utilizar `React.lazy` e `<Suspense>`. Componentes pesados como o `ScannerCodigo` e modais secundários passaram a ser baixados pelo navegador apenas quando o usuário interage com eles.

### 4. Acessibilidade Gabaritada (A11y 100/100)
- Escurecimento do texto de empty state do carrinho (de `text-gray-400` para `text-gray-500`).
- Escurecimento do botão principal de ação (de `bg-verde-600` para `bg-verde-700`), atingindo as diretrizes internacionais de contraste (WCAG 4.5:1).

## Lições Aprendidas
- **O peso de uma SPA:** Frameworks modernos cobram um preço no First Contentful Paint. Code Splitting e Lazy Loading não são "perfumaria", são requisitos técnicos obrigatórios para entregar a primeira tela em menos de 1 segundo em conexões 3G/4G.
- **Contraste não é só estética:** O Google penaliza severamente cores que dificultam a leitura. Tons pastéis ou contrastes fracos destroem a nota de Acessibilidade e excluem usuários.
- **O Fallback no `index.html` salva a pátria:** Conteúdo textual denso (300+ palavras) e formatado semanticamente na div root é a técnica definitiva para rankear SPAs sem precisar de Server-Side Rendering (SSR) complexo.
- **Sempre audite no vácuo:** Testes de performance do Lighthouse devem ser executados **exclusivamente em Abas Anônimas (Incognito)** para evitar que as extensões do navegador do desenvolvedor falseiem os resultados.

## Status: Resolvido ✅

```