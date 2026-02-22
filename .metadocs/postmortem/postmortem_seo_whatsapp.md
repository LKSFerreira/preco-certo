# Post-mortem: Falha de Social Preview (WhatsApp), SEO Semântico e Otimização de Infraestrutura

## Título do Problema
Link do App Sem Susto no WhatsApp sem imagem/descrição, indexação errônea por IAs (confusão com serviços automotivos) e redundância de scripts no carregamento.

## Impacto
- **Usuário Final:** Experiência de compartilhamento pobre; o link parece não confiável. Bugs potenciais de runtime devido à execução duplicada do React.
- **Negócio:** Perda de autoridade de marca. IAs fornecem informações incorretas (manutenção veicular) em vez de "Calculadora de Supermercado".
- **SEO Técnico:** Desperdício de *Crawl Budget* e falta de controle sobre o que os robôs devem ou não indexar.

## Linha do Tempo
- **Descoberta:** Link `https://www.semsusto.app` colado no WhatsApp exibia apenas a URL bruta.
- **Análise Semântica:** Buscadores (Gemini/Copilot) associando "Sem Susto" a mecânica automotiva por falta de `meta description` explícita.
- **Auditoria de Código:** Identificada chamada dupla de `index.tsx` no `body` e conflito de versões no `importmap` (React 18 vs 19).
- **Resolução:** Implementação de Metatags, Robots.txt, Sitemap e limpeza de scripts de entrada.

## Causa Raiz
1. **Ausência de Protocolo Open Graph:** Falta de tags `og:*` impedindo o preview em redes sociais.
2. **Ambiguidade Semântica:** Nome da marca sem descrição técnica de apoio, levando IAs a alucinações baseadas em marcas famosas de outros nichos.
3. **Falta de Arquivos de Rastreio:** Ausência de `robots.txt` e `sitemap.xml` para guiar robôs de busca e de treinamento de IA.
4. **Redundância de Entrada (Vite):** Chamada duplicada do script principal no HTML, causando sobrecarga no carregamento e possíveis conflitos de estado no React.

## Solução Implementada

### 1. Metatags e Identidade Social
- Injeção de tags OG e Twitter Cards com URLs absolutas.
- Uso de **PNG** para `og:image` (garantindo compatibilidade universal) e **WebP** para performance interna.
- Adição da tag `abstract` para reforçar o contexto para IAs.

### 2. Infraestrutura de Indexação (Pasta `/public`)
- **robots.txt:** Configurado com princípio de "Mínimo Privilégio", bloqueando rotas de sistema (`/Ativar/`, `/api/`) e permitindo explicitamente bots de IA (`GPTBot`).
- **sitemap.xml:** GPS manual para garantir que o Google encontre a URL principal da SPA.

### 3. Consolidação de Runtime
- Remoção da chamada redundante `<script type="module" src="./index.tsx">`.
- Unificação do `importmap` para a versão estável do React 19, eliminando conflitos de biblioteca.



## Lições Aprendidas
- **Localização de Assets:** Arquivos de SEO (robots, sitemap) devem residir na pasta `public/` em projetos Vite para serem servidos na raiz.
- **Contexto de Marca:** Nomes criativos exigem `meta description` e `abstract` extremamente técnicos para "educar" as IAs de busca.
- **Compatibilidade de Imagem:** `og:image` deve ser PNG/JPG para evitar quebras em plataformas que ainda não processam WebP em previews.
- **Higiene de Código:** Revisar o `index.html` gerado por boilerplates para evitar scripts duplicados que prejudicam o desempenho e o SEO.

## Status: Resolvido ✅