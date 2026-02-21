# Relatório de Auditoria PageSpeed Mobile - semsusto.app

## Resumo Executivo

**Data da Auditoria:** 19 de fevereiro de 2026, 17:19 BRT  
**Dispositivo:** Moto G Power (emulado)  
**Throttling:** Limitação de 4G lenta  
**Ferramenta:** Lighthouse 13.0.1  

**Scores Finais MOBILE:**
- 🔴 **Performance: 78/100** (Precisa Melhoria)
- 🟡 **Acessibilidade: 76/100** (Precisa Melhoria)
- 🟢 **Práticas Recomendadas: 100/100** (Excelente)
- 🟡 **SEO: 90/100** (Bom, com oportunidades)

***

## 1. Visão Geral dos Gargalos

Seu PWA apresenta três gargalos críticos que comprometem a experiência mobile. O **CSS de renderização bloqueante (35,1 KiB transferidos em 470ms)** é o principal vilão, bloqueando a renderização inicial e impactando diretamente o FCP/LCP. Em segundo lugar, **duas fontes WOFF2 não otimizadas** (FontAwesome Solid e Brands) adicionam 200ms de latência de exibição, causando Flash of Unstyled Text (FOUT). Por fim, **163 KiB de JavaScript não utilizado** circula pela rede sem ser aproveitado, consumindo banda e aumentando o Total Blocking Time do parser. Juntos, esses três problemas representam ~1.81 segundos de overhead que podem ser reduzidos em 70%+.

***

## 2. Plano de Ação: Ganhos Rápidos (Quick Wins)

| Prioridade | Métrica Afetada | Problema Identificado | Solução Técnica Acionável | Impacto na Nota |
|-----------|-----------------|----------------------|--------------------------|-----------------|
| **P0** | FCP/LCP | CSS renderização bloqueante (35,1 KiB, 470ms) | 1. Extrair CSS crítico inline no `<head>` usando `critical` (npm package)<br>2. Deferir CSS não-crítico com `media="print"` + `onload="this.media='all'"`<br>3. Comprimir com cssnano (remove 20-30% de código)<br>4. Servir com `brotli` (gzip ≤ brotli em 15-20%) | +8-12 pontos Performance |
| **P0** | TTFB/LCP | Bloqueio de fontes (FontAwesome WOFF2: 160ms) | 1. Substituir FontAwesome por SVG sprites ou ícones inline (remove 2 requests)<br>2. Usar `font-display: swap` ou `font-display: fallback` no CSS<br>3. Adicionar `preload` no `<head>`: `<link rel="preload" as="font" href="/assets/fs-solid.woff2" crossorigin>`<br>4. Converter para WOFF (suporte 93% dos browsers, menor que WOFF2 em muitos casos) | +6-8 pontos Performance |
| **P1** | Speed Index/FCP | JavaScript não utilizado (163 KiB) | 1. Executar `webpack-bundle-analyzer` para mapear código morto<br>2. Implementar code-splitting por rota com React.lazy() + Suspense<br>3. Tree-shake imports não usados (verificar `sideEffects: false` em package.json)<br>4. Usar dynamic imports: `const Component = dynamic(() => import('./Heavy'))` | +5-7 pontos Performance |
| **P1** | CLS | Redimensionamento de fonte (layout shift) | 1. Adicionar `@font-face { font-display: fallback; }` para evitar FOIT<br>2. Usar `font-size-adjust` com fallback sans-serif nativa<br>3. Pré-alocar espaço com `height` e `width` em elementos com fonte customizada | +2-3 pontos Acessibilidade |
| **P2** | SEO | Ausência de meta descrição | 1. Adicionar tag no `<head>`: `<meta name="description" content="[descrição 150-160 chars]">`<br>2. Usar palavras-chave primárias (semsusto, app, similar aos h1/h2) | +5-10 pontos SEO |

***

## 3. Plano de Ação: Otimizações Profundas (Arquitetura PWA)

| Prioridade | Métrica Afetada | Problema Identificado | Solução Técnica Acionável | Esforço |
|-----------|-----------------|----------------------|--------------------------|---------|
| **P0** | TBT/INP | Tarefa longa na thread principal (1 encontrada) | 1. Identificar com Chrome DevTools > Performance > Timespan<br>2. Quebrar com `scheduler.yield()` ou `setTimeout(..., 0)` para 50ms chunks<br>3. Usar `requestIdleCallback()` para non-critical work (rehidratação)<br>4. Implementar Web Workers para cálculos pesados | **Alto** (2-3 dias) |
| **P1** | LCP/Speed Index | Arquitetura CSR sem SSR/SSG | 1. Migrar para SSG (Static Generation) com build-time rendering se conteúdo é estático<br>2. Se dinâmico: implementar ISR (Incremental Static Regeneration) ou On-Demand SSR<br>3. Enviar HTML completo com conteúdo acima-da-dobra em primeira resposta<br>4. Implementar `prerender-spa-plugin` para pré-renderizar rotas críticas | **Alto** (3-5 dias) |
| **P1** | Core Web Vitals | Falta de Service Worker cache otimizado | 1. Implementar estratégia `Cache-First` para assets estáticos (CSS, JS, fontes)<br>2. `Network-First` com fallback para assets dinâmicos (API responses)<br>3. Usar versioning: `/assets/style-[hash].css` com Cache-Control: `max-age=31536000`<br>4. Limpar caches antigos com cleanup em `activate` event | **Médio** (1-2 dias) |
| **P2** | Performance Score | Bundle JavaScript grande (304.9 KiB total) | 1. Implementar dynamic imports por rota: `const LazyRoute = lazy(() => import('./routes/Heavy'))`<br>2. Usar Webpack `SplitChunksPlugin` para vendors/commons chunks<br>3. Minificar com `esbuild` (10x+ rápido que Terser)<br>4. Remover polyfills desnecessários (verificar `@babel/preset-env` targets) | **Alto** (2-3 dias) |
| **P2** | LCP | Imagens sem otimização e atributos dimensionais | 1. Converter para WebP com fallback: `<picture><source srcset="img.webp"><img src="img.jpg" width="400" height="300"></picture>`<br>2. Usar `srcset` com 2x/3x para DPI de 2+: `srcset="small.webp 480w, medium.webp 768w"`<br>3. Lazy-load com `loading="lazy"` nativas + Intersection Observer para LCP images<br>4. Adicionar `aspect-ratio` CSS (CSS4) para evitar CLS | **Médio** (1-2 dias) |
| **P2** | INP | Animações não compostas (1 encontrada) | 1. Usar CSS transforms/opacity em vez de left/top/width/height<br>2. Aplicar `will-change: transform` ou `will-change: opacity` no CSS<br>3. Forçar layer com `transform: translateZ(0)` ou `transform: translate3d(0,0,0)`<br>4. Validar com DevTools > Rendering > Paint flashing | **Baixo** (4-8 horas) |
| **P3** | Segurança PWA | Source maps expostos em JS grande | 1. Remover arquivos `.map` do bundle em produção<br>2. Servir source maps apenas via CORS privado ou via separado<br>3. Adicionar `.map` ao `.gitignore`<br>4. Minificar nomes de variáveis com mangling | **Baixo** (2-4 horas) |
| **P3** | Acessibilidade | Contraste insuficiente em textos | 1. Auditar com WAVE ou Lighthouse full report<br>2. Elevar razão de contraste para WCAG AA (4.5:1 texto, 3:1 componentes)<br>3. Testar com `prefers-color-scheme` para suportar modo escuro nativo | **Médio** (1 dia) |
| **P3** | Acessibilidade | `user-scalable="no"` + `maximum-scale` < 5 | 1. Remover `user-scalable="no"` do viewport meta tag<br>2. Mudar para `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">`<br>3. Testar zoom em Android com 200%/300% | **Muito Baixo** (15 min) |

***

## 4. Checklist de SEO Técnico Mobile

| Item de SEO | Status/Problema | Como Corrigir |
|-----------|-----------------|--------------|
| **Meta Descrição** | ❌ **Ausente** | Adicionar: `<meta name="description" content="Descrição 150-160 caracteres com keywords primárias">` no `<head>` |
| **Meta Title** | ✅ Presente | Manter: 50-60 caracteres, incluir keyword principal |
| **Headings (H1-H6)** | ⚠️ Verificar estrutura | 1 H1 único por página, hierarquia lógica H2→H3, sem saltos |
| **Mobile-Friendly** | ✅ Sim | Viewport meta tag correto (remover `user-scalable="no"`) |
| **Core Web Vitals** | ⚠️ Performance 78 | Implementar otimizações da seção 2 (CSS bloqueante, fontes, JS) |
| **Schema Markup (JSON-LD)** | ❓ Verificar | Adicionar estruturado de dados: `Application`, `BreadcrumbList`, `FAQPage` conforme conteúdo |
| **og: Meta Tags** | ❓ Verificar | Adicionar: `og:title`, `og:description`, `og:image`, `og:type` para social sharing |
| **Canonical Tag** | ❓ Verificar | Adicionar: `<link rel="canonical" href="https://www.semsusto.app/rota">` em cada página |
| **Robots Meta** | ✅ Padrão | Verificar: `<meta name="robots" content="index, follow">` (padrão OK) |
| **Sitemap.xml** | ❓ Verificar | Criar: `/sitemap.xml` com listar todas rotas; submeter em Google Search Console |
| **Robots.txt** | ❓ Verificar | Criar: `/robots.txt` com `Allow: /` e `Sitemap: https://www.semsusto.app/sitemap.xml` |
| **Alt Text (Imagens)** | ⚠️ Verificar | Adicionar `alt="descrição descritiva"` em **TODAS** `<img>` tags |
| **Legibilidade Mobile** | ⚠️ Contraste baixo | Elevar contraste de texto para WCAG AA (4.5:1 mínimo) |
| **Page Speed (Mobile)** | 🔴 78/100 | Implementar quick wins: CSS crítico inline, defer JS, otimizar fontes |
| **Structured Data** | ❓ Verificar | Validar com https://validator.schema.org/ |

***

## 5. Roadmap Priorizado (Próximos 30 Dias)

### **Semana 1 (Quick Wins - Tempo: ~16 horas)**
- [ ] Inline CSS crítico com `critical` npm package
- [ ] Adicionar `preload` para fontes WOFF2
- [ ] Implementar `font-display: swap`
- [ ] Adicionar `<meta name="description">` para SEO
- [ ] Remover `user-scalable="no"`
- [ ] **Impacto esperado:** Performance: 78 → 84-86 | SEO: 90 → 95+

### **Semana 2 (Arquitetura - Tempo: ~24 horas)**
- [ ] Implementar code-splitting com React.lazy() por rota
- [ ] Adicionar `@preload` directives para LCP image (maior imagem acima-da-dobra)
- [ ] Otimizar imagens para WebP com srcset
- [ ] Corrigir animação não composta
- [ ] **Impacto esperado:** Performance: 86 → 88-90

### **Semana 3 (SSR/ISR + PWA - Tempo: ~32 horas)**
- [ ] Avaliar se aplicação pode usar SSG (Static Generation)
- [ ] Se dinâmica: implementar On-Demand ISR
- [ ] Otimizar Service Worker cache (Cache-First + Network-First)
- [ ] Adicionar Schema Markup (JSON-LD)
- [ ] **Impacto esperado:** Performance: 90 → 92-95 | SEO: 95 → 98

### **Semana 4 (Refinamento + Acessibilidade - Tempo: ~20 horas)**
- [ ] Auditoria completa de contraste WCAG AA
- [ ] Remover/otimizar JS não utilizado (163 KiB)
- [ ] Implementar teste de Source Maps
- [ ] Validar todos Core Web Vitals
- [ ] **Impacto esperado:** Performance: 95 → 97-98 | Acessibilidade: 76 → 85-90 | SEO: 98 → 99-100

***

## 6. Métricas de Referência (Baseline)

| Métrica | Valor Atual | Target | Delta |
|---------|------------|--------|-------|
| **First Contentful Paint (FCP)** | 3,8s | < 1,8s | -2,0s |
| **Largest Contentful Paint (LCP)** | 3,8s | < 2,5s | -1,3s |
| **Total Blocking Time (TBT)** | 0ms | < 200ms | Monitorar |
| **Cumulative Layout Shift (CLS)** | 0 | < 0,1 | ✅ Excelente |
| **Speed Index** | 4,9s | < 3,5s | -1,4s |
| **Performance Score** | 78 | 95+ | +17 |
| **Accessibility Score** | 76 | 95+ | +19 |
| **SEO