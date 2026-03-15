# 🧠 Memória do Projeto: Sem Susto

Este documento é a **Fonte Única de Verdade (Single Source of Truth)** sobre a história, contexto e decisões do projeto "Sem Susto". Ele deve ser consultado por qualquer agente LLM que inicie uma nova sessão no repositório.

> **Status:** 🚀 Em Produção
> **URL:** [https://www.semsusto.app](https://www.semsusto.app)
> **Versão:** Fase 0.8 (MVP + Monetização em Desenv.)

---

## 1. Visão Geral e Propósito

**Sem Susto** (anteriormente "Preço Certo") é um PWA _mobile-first_ projetado para resolver a "ansiedade do carrinho cheio": a incerteza do valor total a pagar durante as compras.

- **Problema Real:** O consumidor perde a conta do total enquanto coloca itens no carrinho.
- **Solução:** Um scanner de bolso super rápido + Lista em tempo real.
- **Diferencial:** IA que lê o rótulo (OCR) para você não precisar digitar nome, marca e peso.
- **Filosofia:** _Local-First_ (funciona offline), Privacidade Total (sem ads, sem venda de dados) e UX "Frictionless" (o mínimo de toques possível).

---

## 2. Status do Projeto

- **Produção:** Deploy ativo na Vercel (`semsusto.app`).
- **Ambiente Dev:** Docker Compose (PostgreSQL, App, Scripts Python).
- **Monetização:** Em implementação (Sistema de Tokens Anônimos).

---

## 3. Funcionalidades Chave

### 📷 Scanner & Entrada

- **Scanner Híbrido:** Usa `html5-qrcode` para ler códigos de barras EAN-13/EAN-8 com alta performance no browser.
- **Fallback Manual:** Se o código não ler, digitação rápida numérica.
- **IA (Mágica):** Se o produto não existe no banco, o usuário tira uma foto. O **Groq (Llama 4 Vision)** lê a imagem e preenche: Nome, Marca, Tamanho.

### ⚡ UX Premium (Detalhes que importam)

- **Rainbow Button:** O botão "Auto Preencher" brilha/anima para incentivar o uso da IA.
- **Tutorial Visual:** Slide interativo no primeiro acesso ensinando a escanear.
- **Edição Fluida:** Ao tocar em um campo (ex: Nome), o texto é **selecionado automaticamente** para facilitar reescrita.
- **Validação Inteligente:** Se o usuário tentar salvar com erro, o app foca e scrolla até o campo errado.
- **Dica de Foto:** Se a IA falhar ou imagem for ruim, o app orienta como tirar uma foto melhor.

### 💰 Monetização (Ética)

- **Privacidade:** Zero Ads. Zero Trackers. Zero Venda de Dados.
- **Tokens:** O usuário compra um "café" (R$ 4,90) e recebe um Token Anônimo (`SEM-SUSTO-XXXX`).
- **Sem Login:** Não exigimos email ou senha. O Token é a conta.

---

## 4. Arquitetura Técnica

### Frontend (Core)

- **React 19 + Vite 6:** Performance de build e runtime.
- **TypeScript 5.8:** Tipagem estrita.
- **Tailwind CSS v4:** Estilização moderna e leve.
- **PWA:** Manifesto e Service Workers para instalação no celular.

### Backend & Infra

- **Repository Pattern:** Abstração completa do acesso a dados.
- **RepositorioHibrido:** Sincronia automática entre LocalStorage (Cache/Offline) e PostgreSQL (Cloud/Sync).
- **Strategy Pattern (IA):** Interface comum para troca fácil de provedores (hoje Groq, amanhã OpenAI/Gemini).
- **Proxy Serverless:** Handlers na Vercel protegem as chaves de API e emulam o comportamento da API em desenvolvimento local.

### Cascata de Busca (Resiliência)

Ao escanear um código `789...`:

1.  **Cache Local (<10ms):** "Já escaneei isso?"
2.  **OpenFoodFacts (~500ms):** Banco de dados mundial gratuito.
3.  **Cosmos API (~800ms):** Banco de dados comercial brasileiro (via Proxy).
4.  **IA/Manual:** "Não achei, tira uma foto".

---

## 5. Padrões de Desenvolvimento (Para o Agente)

Se você, Agente, está assumindo agora, siga estas regras sagradas:

1.  **Idioma:** Português (pt-BR) sempre. Código, Vars, Comentários, Commits.
2.  **Abreviações:** PROIBIDAS. Use `quantidade_itens`, não `qtd`.
3.  **Atomicidade:** Um commit por mudança lógica. Use o workflow `@[/commit]`.
4.  **Local-First:** Teste tudo rodando dentro do container (Docker).
5.  **Segurança em Primeiro Lugar:** Toda nova API ou modificação de banco deve passar por validação de schema (Zod) e auditoria.

---

> _"Faça com qualidade e leve o tempo que precisar."_

---

## 6. Histórico e Evolução

### Janeiro 2026: The Big Bang

- Nasce como **"Preço Certo"**.
- Foco total no MVP: Scanner funcionando e Carrinho somando.
- Implementado Docker DevContainer para ambiente padronizado.

### Fevereiro 2026: Refinamento e Identidade

- **Rebranding:** Renomeado para **"Sem Susto"** (domínio disponível e mais "catchy").
- **Infraestrutura:** Migração de scripts shell para Docker nativo. Scripts de limpeza de dados (30k produtos BR).
- **Qualidade:** Implementação de "Guerra aos Dados Sujos" (Lista negra e sanitização via Zod).
- **UX:** Implementação do Select-on-focus e scroll automático em erros.

### 17/02 - 18/02: PostgreSQL, Monetização e Segurança (Marco Crítico)

- **Integração DB:** Implementado Repositório Híbrido e API Serverless para persistência segura.
- **Backend de Monetização:**
  - Implementada arquitetura de Tokens Anônimos: `api/tokens/gerar`, `ativar` (com limite de 2 dispositivos e cooldown 24h) e `consultar`.
  - **Rate Limiting:** Tabela `rate_limit_geral` bloqueando abusos e tentativas suspeitas por IP.
- **Auditoria Hardcore:**
  - Implementados Triggers PostgreSQL que capturam alterações (`dados_antigos` vs `dados_novos`) e injetam o IP do cliente via `app.client_ip` na transação.
- **Segurança (Pentest Realizado):**
  - **SQL Injection:** Blindado via consultas parametrizadas.
  - **XSS:** Mitigado via sanitização estrita e React escaping.
  - **Flood Attack:** Proteção de Rate Limit (429) validada com sucesso em simulações de carga.
- **Decisão de CORS:** Decidido aplicar `Access-Control-Allow-Origin` rigoroso via `vercel.json` para eliminar acesso externo não oficial à API.

### 18/02: Segurança de API (CORS) Blindada 🛡️

- **Produção (`vercel.json`):** Configuração estrita permitindo apenas `https://www.semsusto.app`.
- **Local (`server.ts`):** Middleware dinâmico implementado para aceitar IPs da rede local (192.168.x.x, 10.x.x.x) permitindo testes em dispositivos reais via Docker.
- **Infraestrutura:** Servidor local agora suporta `PORT` via variável de ambiente, facilitando testes automatizados.
- **Validação:** Script `scripts/verify_cors.js` criado para CI/CD de segurança.

### 18/02: Refatoração Offline First e Correção de Fluxo 🔄

- **Arquitetura:** `RepositorioProdutosHibrido` renomeado para `RepositorioProdutosOfflineFirst`. Estratégia de priorizar cache local e sincronizar com remoto (database) agora está explícita.
- **Fluxo de Busca:** `App.tsx` corrigido para consultar o Banco de Dados (Remoto) antes de APIs externas (OFF/Cosmos).
- **Integridade de Dados:** Removido salvamento automático de dados crus de APIs externas. Sistema redireciona para formulário manual, prevenindo erros de validação ("Dados inválidos").
- **UX:** Corrigido bug visual onde produtos vindos do banco não apareciam no carrinho por falta de atualização de estado React.

### 19/02: Validação Dinâmica, Fluxo OCR-First e Feature Flags 🎯

- **Validação Dinâmica (REGEX):** `REGEX_UNIDADE` agora é gerada automaticamente a partir do `UNIT_MAP` (fonte única de verdade). Adicionadas variações pt-BR: `peça`, `pça`, `pças`, `pçs`, `pcs`, `pecas`.
- **Fluxo OCR-First:** Formulário de produto abre com campos desabilitados (Fase Foto). Usuário é incentivado a tirar foto do rótulo antes de digitar. Após OCR (sucesso ou falha), campos são liberados.
- **Botão Premium (Preencher Manualmente):** Implementado com cadeado 🔒, pronto para desbloquear quando sistema premium estiver ativo. Não regride a UX atual.
- **Feature Flags (Storage):** Adicionadas `VITE_USAR_LOCALSTORAGE` e `VITE_USAR_BANCO_POSTGRES` seguindo o mesmo padrão das flags de APIs externas. Composição condicional dos repositórios em `ContextoRepositorios.tsx`.
- **Logs de OCR:** Dados extraídos pela IA agora são exibidos no console seguindo o mesmo padrão das APIs (`✅ [ORIGEM: IA_OCR]`).

### 19/02: Migração de Armazenamento → IndexedDB 📦

- **Incidente:** Estouro do `localStorage` em produção (~7 itens com foto Base64 = crash). Documentado em `postmortem_estouro_localstorage.md`.
- **Solução:** Migração do catálogo de produtos para `IndexedDB` (store único com keyPath `codigo_barras`). Imagens Base64 são convertidas para `Blob` (binário) na escrita, e para `objectURL` na leitura — app não precisa saber que usa IndexedDB.
- **Arquitetura:** Carrinho e flags permanecem no `localStorage` (~5KB). Catálogo e imagens vão para IndexedDB (GBs). Schema do PostgreSQL não foi alterado.
- **Repositório:** Criado `RepositorioProdutosIndexedDB` (`repositorios/indexed-db.ts`) substituindo `RepositorioProdutosLocalStorage` em `ContextoRepositorios.tsx`.
- **Débitos Técnicos Registrados:** fila de retry para sync offline. (Token premium corrigido).

### 21/02: [Segurança Front-end](./walkthrough/seguranca_front-end.md) (Client-Side Hashing) 🛡️

- **Problema:** Token premium era armazenado em texto puro, sujeito a vazamento e interceptação/cópia.
- **Solução:** Implementado ofuscação com `SHA-256` via Web Crypto nativa (`crypto.subtle`) no Front-end após a validação. O `localStorage` tem apenas `sem_susto_premium_hash`.
- **Arquitetura Strict:** O novo `RepositorioPremium` intercepta as requisições (Groq API, Consultas) e despacha usando headers `X-Premium-Token`.
- **Design Serverless:** Lógicas de autorização extraídas do _Proxy Groq_ (`analisar.ts`) e encapsuladas na abstração `api/_lib/auth.ts`, respeitando _Single Responsibility Principle_.

### 21/02: [Refino de UX Premium](./walkthrough/ux_premium_feedback.md) (Quantum Core & Input Mask) 💎

- **UX Quântica:** Implementado componente `QuantumCore` com animações 3D CSS (`preserve-3d`) e filtros SVG Rainbow para feedback visual de estados (Idle, Loading, Sucesso, Erro).
- **Anti-Fragilidade de Input:** Criada máscara de input híbrida que bloqueia a exclusão do prefixo `SEM-SUSTO-` e formata a chave randômica automaticamente.
- **Higiene de Navegação:** Implementado fallback de rota global (`404`) que limpa incondicionalmente a barra de endereços suja, mantendo a experiência PWA limpa.
- **Acessibilidade:** Adicionado botão de colar inteligente com limpeza de clipboard e foco automático via `focus-within`.

### 22/02: [Universalização de Layout e Refinamento de Botões](./walkthrough/universalizacao_tablet_refinamento_botoes.md) 📱💎

- **Tablet Mode Universal:** Implementado Wrapper de Tablet (`768px`) centralizado no Desktop, garantindo contenção de todas as telas e modais (Scanner, Cadastro, etc).
- **Refatoração de Modais:** Migração de posicionamento `fixed` para `absolute` nos componentes de UI para respeitar os limites do container central.
- **Padronização Estética:** Sincronizado o estilo do botão "Auto Preencher" com o botão "Ativar Premium", utilizando gradientes rainbow e animações de borda suaves.
- **Responsividade Fluida:** Ajustes na tela de ativação para suporte perfeito em dispositivos estreitos (iPhone SE/320px).

### 22/02: [Bloqueio Reativo de Campos](./walkthrough/bloqueio_reativo_campos.md) 🛡️

- **Problema:** A remoção de fotos corrompidas ou manuais deixava os campos de descrição, marca e tamanho liberados para edição sem evidência fotográfica.
- **Solução:** Implementado estado derivado (`useMemo`) para a fase do formulário, tornando o bloqueio de campos uma consequência direta e instantânea da ausência de imagem.
- **Regra de Negócio:** Mantida a liberdade de edição do campo de preço, enquanto os campos de texto permanecem estritamente vinculados à presença da foto (OCR-First).

### 22/02: [Despertador de APIs (Warm-up)](./walkthrough/warmup_api.md) ⏰

- **Incidente:** Cold Start de Serverless Functions (Vercel) causava falha na primeira requisição após inatividade. Documentado em `postmortem_cold_start_api.md`.
- **Solução:** Implementado sistema de "Warm-up" silencioso disparado antecipadamente pelo botão "Ler Código".
- **Controle:** Adicionada variável de ambiente `VITE_COLD_START_API` para ligar/desligar o recurso.
- **Higiene:** Uso de requisições `HEAD` e throttle de 10 minutos para otimização de banda e recursos.

### 22/02: [Refatoração de Componentes (Modais & Hooks)](./walkthrough/walkthrough_refatoracao_modais.md) 🏗️

- **Padronização de UI**: Migração massiva de componentes de página/tela para o padrão de Modais (`ModalFormularioProduto`, `ModalScannerBarras`, etc).
- **Modularização de Lógica**: Extração de regras de tutorial de primeiro acesso para Hooks reutilizáveis (`useTutorialUso`, `useTutorialFoto`).
- **Higiene de Importação**: Refatoração do `App.tsx` para uma estrutura mais limpa e declarativa, facilitando a manutenção de fluxos de sobreposição.\* **Limpeza**: Remoção de componentes legados e redundantes, consolidando a identidade visual e técnica do projeto.

### 22/02: [Otimização de SEO e Correção de HMR](./walkthrough/seo_hmr_otimizacao.md) 🚀

- **SEO SPA:** Criado fallback de conteúdo textual para robôs de busca no `index.html`, eliminando o erro de "0 palavras detectadas".
- **Semântica Técnica:** Implementada hierarquia `H1/H2` e metatag `apple-touch-icon` para pontuação mobile e acessibilidade.
- **HMR (Fast Refresh):** Correção definitiva do erro de invalidação do Vite através do isolamento total de Hooks e constantes de componentes `.tsx`.
- **Documentação:** Consolidação do relatório de auditoria e técnica no post-mortem de performance.

### 22/02: [Refatoração da Cascata de Busca (Callbacks)](./walkthrough/cascata_busca_callbacks.md) 🔄

- **Encapsulamento Arquitetural:** Implementado sistema de callbacks de status na interface de repositórios, eliminando o acoplamento entre a UI e os detalhes técnicos de storage (IndexedDB vs Postgres).
- **Transparência de Busca:** A UI agora informa precisamente em qual camada a busca está (Memória -> Local -> Remoto -> API), melhorando o feedback durante o carregamento.
- **Resiliência Offline:** Otimização do fluxo para garantir que o cache em memória (estado) e o cache persistente (IndexedDB) sejam priorizados, reduzindo a latência e o consumo de rede.

### 22/02: [Lazy Loading e Code Splitting](./walkthrough/lazy_loading_suspense.md) ⚡

- **Performance Percebida:** Implementado `React.lazy` e `Suspense` para todos os modais da aplicação, reduzindo o bundle inicial.
- **Modularização:** Convertidos 9 componentes para `export default`, permitindo o carregamento assíncrono apenas sob demanda (on-click).
- **Robustez UX:** Adicionado fallback visual durante o carregamento dos chunks dinâmicos, evitando "piscadas" ou erros de mount.

### 22/02: [Substituição Global de Ícones (SVG)](./walkthrough/substituicao_icones_svg.md) 🚀

- **Migração Total:** Removidos todos os ícones Font Awesome da aplicação, substituídos por SVGs nativos e emojis.
- **Performance:** Excluída a dependência `@fortawesome/fontawesome-free` do `package.json` e as importações no `index.tsx/index.html`.
- **Código de Barras Premium:** Criado um novo design literal e padronizado (**w-8 h-8**) com alinhamento otimizado para uma experiência mais moderna.
- **Segurança Visual:** Todos os SVGs agora usam `currentColor` e são controlados via Tailwind, eliminando flash de ícones não carregados.

### 23/02: [Otimização de Performance (Lighthouse 100)](./walkthrough/otimizacao_performance_terser.md) ⚡

- **Minificação Agressiva:** Implementada configuração do `terser` no `vite.config.ts` para remoção de `console.log` e `debugger` em produção.
- **Consolidação de CSS:** Desativado `cssCodeSplit` para reduzir requisições HTTP críticas durante o carregamento inicial.
- **Build via Docker:** Processo de build padronizado e executado via `docker compose exec app npm run build`.

### 23/02: [Monetização Premium & Automação](./walkthrough/monetizacao_premium_final.md) 💎

- **Strategy Pattern & Polling:** Implementada arquitetura desacoplada para Mercado Pago com sistema de polling resiliente, cleanup automático e validação de preços server-side.
- **Aesthetics & Responsividade:** `ModalPlano` redesenhada com animações premium e adaptabilidade dinâmica (`max-height`) para dispositivos móveis e telas pequenas.
- **Mock de Pagamento:** Provedor flexível para testes rápidos, simulando aprovação automática sem dependência de APIs externas.

### 25/02: [Responsividade Dinâmica e UX Mobile](./walkthrough/responsividade_dinamica.md) 📱

- **Performance 0% JS (App.tsx):** Aplicação de injetores híbridos nativos (`[@media(max-height:700px)]`) via Tailwind para espremer o layout e botões da tela principal sem utilizar processamento React, preservando nota máxima (`100/100`) de _Interaction to Next Paint_.
- **Scale Visual Inteligente (Loading Carrinho):** Implementada a manipulação CSS de fator global atrelada ao `ResizeObserver` para simular uma lente quântica em celulares de tela baixa: a "chuva de comida" não invade bordas alheias, garantindo proporção física perfeita 1:1 de animações em qualquer tela.
- **Migração de Mocks para Real Data (Modais):** Mapeamento 100% real implementado entre os Modais base e de instrução de uso com a verdadeira Factory da arquitetura IA do projeto e os persisters de localStorage do Hook padrão.
- **React Lifecycle (ModalAtivarToken & Plano):** Substituição cirúrgica dos CSS puros do Tailwind para medição de visores assíncrona baseada em ResizeObserver (flags visuais dinâmicas de estados curtos / compactos em tempo real).

### 26/02: [Refinamento Padrão Ouro (Scanner)](./walkthrough/refinamento_scanner_ouro.md) 🟢

- **Responsividade Dinâmica:** Implementação de `ResizeObserver` no `ModalScannerBarras.tsx` para ajuste automático de interface em telas curtas e tablets.
- **QR Box Adaptativo:** Inteligência visual que redimensiona a área de captura do scanner em tempo real, garantindo visibilidade total do formulário manual.
- **Upgrade Estético:** Aplicação de Glassmorphism (`backdrop-blur`) e animações sequenciais de erro, elevando o componente ao nível de curadoria premium.
- **Status de Curadoria:** Atualização do mapeamento oficial do projeto, removendo o scanner da lista de pendências e promovendo-o ao "Padrão Ouro".

### 27/02: [Curadoria Responsiva (Produção)](./walkthrough/curadoria_responsiva.md) 📱

- **Escopo Preservado:** Ajustes restritos a responsividade (tamanho, espaçamento, limites e rolagem), sem alterar core, estilo, brilho ou efeitos.
- **Layout Base Estável:** `App.tsx` migrado para `100dvh` com rolagem no `main`, mantendo o rodapé sempre acessível em telas pequenas.
- **Modais com Teclado Virtual:** `ModalScannerBarras`, `ModalContato` e `ModalPlano` receberam limites por viewport, ancoragem mobile e overflow interno para evitar corte de campos e CTAs.
- **Fluxo de Formulário Aprimorado:** `ModalFormularioProduto` ganhou progressão de foco por Enter, visibilidade de ações com teclado aberto e acessibilidade de teclado no "Auto Preencher".
- **Curadoria Aplicada:** `ModalTutorialUso` e `ModalTutorialFoto` tiveram remoção dos ícones superiores e suporte melhor de rolagem vertical em alturas reduzidas.
- **Validação Técnica:** Build de produção validado com sucesso no fluxo Docker oficial (`docker compose -f .docker/compose.yaml run --rm app npm run build`).

### 27/02: [Refino de Formulário e Scanner](./walkthrough/refino_formulario_scanner.md) 🧪

- **Fluxo de Foco Corrigido:** `ModalFormularioProduto` passou a avançar por campos pendentes com base em validade real, evitando salto para preço quando `tamanho` vem parcial da API.
- **Validação Coerente de Tamanho:** Regras de `REGEX_UNIDADE` foram alinhadas entre foco, indicação visual e liberação de salvamento.
- **Feedback de Erro no Campo:** `Tamanho` inválido agora exibe destaque visual e mensagem contextual com exemplos (`1L`, `500g`, `250ml`).
- **Tutorial com Continuidade:** Fluxo do `AUTO PREENCHER` no primeiro uso foi ajustado para seguir direto para seleção/câmera após concluir o tutorial.
- **Refino no Scanner:** `ModalScannerBarras` voltou ao centro por padrão e ganhou vinheta para escurecer o entorno da área de leitura.
- **Validação Técnica:** Build de produção validado com sucesso via Docker (`docker compose -f .docker/compose.yaml run --rm app npm run build`).

### 28/02: [Contato, Contador e Handoff WhatsApp](./walkthrough/contato_whatsapp_handoff.md) 💬

- **Feedback Compacto:** ModalContato trocou mensagens longas por contadores dinâmicos (nome e mensagem) com progresso visual por cor (cinza, vermelho e verde).
- **Responsividade com Teclado:** Contadores foram reposicionados para evitar empurrar o layout e reduzir risco de campos importantes ficarem cobertos no mobile.
- **Envio sem Flicker:** Fluxo de abertura do WhatsApp migrou de window.open(..., "\_blank") para redirecionamento direto com fallback mobile, eliminando o flash visual antes do handoff.
- **Regra de Negócio Preservada:** Botão de envio continua bloqueado enquanto o formulário não atinge os mínimos (MIN_NOME=3, MIN_MENSAGEM=25).

### 28/02: [Mock de Pagamento, Resiliência e Feedback Sonoro](./walkthrough/mock_pagamento_resiliencia.md)

- **Diagnóstico PROD vs DEV:** Mapeada a cadeia de erro causada pela ausência de `VITE_USAR_MOCK_PAGAMENTO` no painel da Vercel, que fazia o frontend de produção usar o provedor real (sem chave de API).
- **Falha Controlada no Mock:** `ProvedorMock` agora força falha proposital na 1ª geração de PIX para permitir testes completos do fluxo de erro.
- **Retentativa sem Fechar Modal:** Botão "Tentar Novamente" regenera o PIX para o mesmo plano selecionado, sem fechar e reabrir a modal.
- **Efeito Sonoro de Sucesso:** Acorde harmônico (Mi Maior) sintetizado via Web Audio API, sincronizado com as animações visuais de confirmação.
- **Polling Seguro:** `useEffect` do polling agora ignora status terminais (`aprovado`, `falha`), evitando requisições desnecessárias.

### 28/02: [Infraestrutura PWA e Prompt de Instalação](./walkthrough/pwa_install_prompt.md)

- **Manifest & Service Worker:** Implementação da base PWA para tornar o app instalável e offline-ready.
- **Banner Customizado:** Componente `BannerInstalarApp.tsx` com design premium e animações slide-up.
- **Controle de Frequência:** Lógica de exibição 1x por mês via `localStorage` para evitar fadiga do usuário mobile.
- **Standalone Detection:** Ocultação automática do banner quando o app já está instalado.

### 28/02: [Normalização Flexível de Unidades](./walkthrough/normalizacao_unidades.md)

- **Camada Única de Normalização:** Criada a função `normalizarTamanho` no arquivo `services/utilitarios.ts` que centraliza toda a lógica de tratamento de strings de tamanho/unidade.
- **Suporte a Unidades Comuns:** A função agora aceita e converte padrões comuns para um formato canônico (ex: "l", "litro", "LTS" -> "L"; "g", "gr", "gramas" -> "g").
- **Tratamento de Espaços e Case:** Remove espaços extras e converte para o padrão de mercado (ex: "500ml" -> "500 mL").
- **Integração Ponta a Ponta:** Normalização aplicada no formulário (`blur`/`submit`) e nos fluxos OFF/Cosmos/IA, removendo `toUpperCase` conflitante no campo `tamanho`.
- **Fonte de Verdade Preservada:** `REGEX_UNIDADE` continua derivada de `UNIT_MAP`, sem regra duplicada, com mensagem de erro atualizada para exemplos válidos.

### 03/03: [Estabilidade de Memória no Fluxo de Foto e Recorte](./walkthrough/memoria_foto_recorte.md) 📷

- **Mitigação do Incidente em Produção:** Fluxo de foto migrado de `readAsDataURL` para `createObjectURL`, reduzindo picos de memória no Android durante captura e recorte.
- **Higiene de Recursos Temporários:** Implementada limpeza explícita com `URL.revokeObjectURL` em confirmação, cancelamento e desmontagem do formulário.
- **Recorte Resiliente:** `ModalRecorte` recebeu `try/catch` com feedback de erro amigável, evitando quebra silenciosa em dispositivos com baixa RAM.
- **Robustez Pós-Recorte:** Blindagem no retorno da IA para cenários `null`, mantendo continuidade do fluxo de edição.
- **Debug Controlado:** `localStorage.clear()` mantido por necessidade de validação, agora com throttle de 5 minutos para evitar reset destrutivo em todo reload.

### 04/03: [Depreciação de ModalDoacao e Atualização de Curadoria](./walkthrough/deprecacao_curadoria_status.md) 🧹

- **Auditoria de Consistência:** Identificados desalinhamentos entre `status_curadoria.md` e o código real: `ModalPagamento` já era Padrão Ouro e `ModalDoacao` era código morto.
- **Padrão de Depreciação:** Criada pasta `components/_deprecated/` com header `@deprecated` documentando data, motivo e instruções de restauração.
- **Limpeza de Código Morto:** Removidos import lazy, estado `mostrarDoacao` e bloco de renderização da `ModalDoacao` no `App.tsx`.
- **Curadoria Atualizada:** `ModalPagamento` promovida para 🟢 Padrão Ouro (9 componentes). Nova seção ⚫ Deprecados criada no `status_curadoria.md`.

### 04/03: [Confirmação de Pagamento e Geração Automática de Token](./walkthrough/confirmacao_token_pagamento.md) 🔐

- **Endpoint de Confirmação:** Criado `POST /api/pagamentos/confirmar` que verifica pagamento no Mercado Pago server-side e gera token automaticamente, separando responsabilidade do endpoint admin `gerar.ts`.
- **Idempotência:** Migration `008` adiciona coluna `pagamento_id` com índice único parcial à tabela `tokens`, impedindo geração duplicada para o mesmo pagamento.
- **Integração ModalPagamentoAprovado:** Componente pré-existente (241 linhas, UI premium) agora conectado ao fluxo real via `App.tsx` — exibe token, permite ativação direta, compartilhamento WhatsApp e screenshot.
- **Refatoração aoSucesso:** Callback de `ModalPagamento` passou de `() => void` para `(pagamento_id: string) => void`, permitindo rastreabilidade do pagamento aprovado.
- **Fix ModalPagamentoAprovado:** Removidos números de linha corrompidos (`580:`–`621:`) embutidos no conteúdo real do arquivo, que impediam compilação.
- **Correção de Preços:** `monetizacao.md` alinhada com `pix.ts` (fonte de verdade server-side): Café R$ 2,90, Lanche R$ 4,90, Apoiador R$ 9,90.
- **Dependência:** `html-to-image@^1.11.13` adicionada ao `package.json` para funcionalidade de screenshot do cartão premium.
- **Guia Conceitual:** Criado `integracao_pagamento_learning.md` com 10 seções sobre integração com gateways (transferível para qualquer linguagem/framework/gateway).

### 05/03: [Emojis nos Console Logs](./walkthrough/emojis_console_logs.md) 💬

- **Padronização Visual:** Implementação da padronização de tags e emojis (`🔴 [ERRO]`, `✅ [SUCESSO]`, `⚠️ [AVISO]`, `🔄 [INFO]`, `🧪 [MOCK]`) em todos os logs do fluxo de pagamento (gateway e factory).
- **Visibilidade de Debug:** Atualizados `api/pagamentos/pix.ts`, `api/pagamentos/status.ts`, `api/_lib/gateways/fabrica.ts` e `api/_lib/gateways/mockado.ts` para facilitar a identificação de comportamentos durante o desenvolvimento.

### 05/03: [Refatoração do Fluxo de Pagamento](./walkthrough/refatoracao_fluxo_pagamento.md) 💸

- **Centralização:** Lógica de pagamento (Mercado Pago, PagBank, Mock) movida inteiramente do frontend para o backend (API routes).
- **Abstração Frontend:** Serviços e factories do frontend (`fabrica.ts`, `mock.ts`, etc.) foram substituídos por um cliente unificado (`api-pagamento.ts`).
- **Simplificação de Modais:** `ModalPagamento` e `Premium` atualizados para consumir a nova API backend para geração e consulta de status, reduzindo dependências pesadas no client-side.

### 05/03: [Remoção de Strings Genéricas e Correções de UI](./walkthrough/remocao_strings_genericas.md) 🧹

- **Limpeza de Adapters:** Removidos os _fallbacks_ _hardcoded_ (`'Produto sem nome'`, `'Genérica'`) nos adapters de API (Cosmos e OpenFoodFacts), que causavam ambiguidades indesejadas na UI. Agora os dados nulos retornam de fato strings vazias.
- **Correção da IA Analisadora:** Removida a mesma instrução contraditória do prompt Groq (Llama), que estimulava a preencher com resíduos dados desconhecidos.
- **Adequação do React DOM:** Fornecido o manipulador de eventos `onChange` necessário para evitar o aviso de 'You provided a `value` prop to a form field' no Input numérico de Preços (`ModalFormularioProduto.tsx`).

### 07/03: [Orquestrador Manual de Pagamentos](./walkthrough/orquestrador_manual_pagamentos.md) 💳

- **Desacoplamento de Provedor:** Rotas `pix`, `status` e `confirmar` passaram a delegar decisão para o orquestrador de pagamentos, removendo acoplamento direto com host específico de gateway.
- **Estados de Domínio:** Fluxo consolidado com status padronizados (`pendente`, `aprovado`, `falha`, `expirado`, `pendente_manual`), impedindo divergência entre backend e UI.
- **Fila Manual Persistida:** Implementados endpoints `manual/solicitar` e `manual/aprovar` com migration `009_cria_tabela_pagamentos_manuais.sql`, habilitando operação humana com rastreabilidade.
- **Segurança Operacional:** `manual/aprovar` protegido por `X-API-Secret`/`API_SECRET`, com validações de entrada e respostas explícitas para cenários de erro.
- **Integração Frontend:** `ModalPagamento` em modo manual agora registra solicitação interna antes do handoff para WhatsApp, preservando experiência visual premium existente.
- **QA Mockado:** Regra de alternância (falha/sucesso) mantida no mock para permitir validação previsível de ambas as telas no fluxo de pagamento.

### 08/03: [Roadmap de Mock para Ativacao](./walkthrough/roadmap_mock_ativacao.md)

- **Demanda Adiada com Rastreabilidade:** Necessidade de teste previsivel da ativacao premium foi documentada para implementação futura, sem alterar o fluxo atual.
- **Escopo Fechado de QA:** Definido mock backend para `POST /api/tokens/ativar` com regra controlada de tentativas (1a falha, 2a sucesso).
- **Reuso de Estrutura Existente:** Planejado uso da tabela `tentativas_ativacao` para controle por `token_hash_tentado + fingerprint_hash`, evitando nova migration.
- **Seguranca Operacional:** Mock deve ser habilitado apenas por flag (`MOCK_ATIVACAO_TOKEN=true`) e manter o comportamento real inalterado com a flag desligada.

### 08/03: [Idempotência na Confirmação de Pagamento](./walkthrough/idempotencia_confirmacao_pagamento.md)

- **Blindagem de Concorrência:** `api/_lib/pagamentos/orquestrador.ts` passou a tratar conflito de unicidade em `pagamento_id` como estado de domínio, retornando `token_existente` em vez de erro técnico.
- **Protecao em Duas Camadas:** O frontend ganhou guarda contra confirmações duplicadas do mesmo pagamento em andamento, enquanto o backend permaneceu como arbitro final da idempotência.
- **Mock Tornado Testavel:** O gateway `mockado` deixou de devolver token fixo e passou a persistir token real via o mesmo caminho de produção, permitindo QA fiel no banco local.
- **Automacao de QA:** Criados os utilitarios `scripts/remove_pagamentos_mockados.py` e `scripts/testar_concorrencia_pagamento.ts` para limpeza e teste concorrente automatizado dentro do Docker.
- **Validação Pratica:** Teste em paralelo no container `app` comprovou 1 resposta `201`, 1 resposta `200`, nenhum `500` e apenas 1 token persistido para o mesmo `pagamento_id`.

### 08/03: [Refatoracao de Auditoria e Telemetria](./walkthrough/refatoracao_auditoria_telemetria.md)

- **Separação de Responsabilidade:** O `GET /api/produtos/[código]` deixou de registrar `SELECT` em `auditoria_logs` e passou a publicar comportamento em `telemetria_produtos`.
- **Telemetria Agregada:** A migration `010_cria_tabela_telemetria_produtos.sql` criou uma trilha agregada diaria por evento, origem, produto, usuário e `ip_hash`, reduzindo explosao de linhas sem perder o sinal de uso.
- **Eventos Iniciais:** A primeira iteracao ativou `produto_encontrado` e `produto_nao_encontrado`, com origem `api_produtos_get`.
- **Auditoria Preservada:** O trigger de escrita em `produtos` foi mantido para `INSERT`, `UPDATE` e `DELETE`, preservando a rastreabilidade operacional forte.
- **Validação no Docker:** O ambiente local confirmou os dois ramos do endpoint (`200` e `404`) gerando telemetria correta, sem nova escrita de leitura em `auditoria_logs` apos a refatoracao.

### 08/03: [Estrategia de Ambiente](./walkthrough/estrategia_ambiente.md)

- **Contrato Operacional Explicito:** Introduzidos `APP_ENV` e `VITE_APP_ENV` como fonte oficial para distinguir `local` e `producao`, sem ativar o PostgreSQL remoto nesta fase.
- **Defaults Seguros no Frontend:** `ContextoRepositorios.tsx` deixou de assumir PostgreSQL remoto em producao por ausencia de flag, mantendo o app em modo local/offline ate o cutover.
- **Banco Sob Demanda:** `api/_lib/banco.ts` passou a inicializar o pool apenas no primeiro uso real, evitando derrubar o servidor por `DATABASE_URL` ausente em ambiente que ainda nao deve usar banco remoto.
- **Travas no `init_db.py`:** Reset, criacao automatica e carga inicial passaram a respeitar `APP_ENV`, `INIT_DB_IMPORTAR_DADOS` e `INIT_DB_RESETAR_BANCO`.
- **Validacao:** `docker compose -f .docker/compose.yaml exec app npm run build` aprovado e `docker compose -f .docker/compose.yaml exec backend env APP_ENV=local INIT_DB_IMPORTAR_DADOS=false INIT_DB_RESETAR_BANCO=false python scripts/init_db.py` validado com sucesso.

### 09/03: [Governanca Catalogo Compartilhado](./walkthrough/governanca_catalogo_compartilhado.md)

- **Catalogo Oficial Preservado:** `GET /api/produtos/:codigo` continua lendo exclusivamente de `produtos`.
- **Escrita do Usuario em Staging:** `POST /api/produtos/:codigo` passou a registrar contribuicoes em `produtos_adicionados_pelo_usuario`, retornando `202 Accepted` com status `enviado_para_curadoria`.
- **Nova Tabela de Inbox:** A migration `011_cria_tabela_produtos_adicionados_pelo_usuario.sql` criou a camada de staging com `status_curadoria`, `origem`, `usuario_id`, `ip_hash` e trigger de auditoria.
- **Contrato OfflineFirst Alinhado:** `repositorios/offline-first.ts` e `repositorios/postgres.ts` agora assumem explicitamente que leitura remota e catalogo oficial, enquanto escrita remota e staging.
- **Validacao Pratica:** Build aprovado, migration `011` aplicada e teste real confirmou 1 linha em `produtos_adicionados_pelo_usuario` e 0 linhas em `produtos` para o mesmo GTIN.

### 09/03: [Validação de Migrations e Carga Remota](./walkthrough/validacao_migrations_carga_remota.md) 🧭

- **Trilha Operacional em Node/JS CLI:** Implementados `aplicar_migrations.ts`, `carregar_catalogo_inicial.ts`, `validar_banco_remoto.ts` e `orquestrar_validacao_remota.ts` em `lib/scripts/database/`, sem expandir Python e sem expor endpoints HTTP para operar banco.
- **Infraestrutura Compartilhada Corrigida:** `ambiente` foi consolidado em `infra/ambiente/`, `lib/database/banco.ts` passou a reutilizar essa base e a camada nova deixou de depender semanticamente de `api/_lib/`.
- **Validação Local Completa:** Build aprovado e execução validada via Docker dos quatro comandos da trilha, incluindo a orquestração completa com `12/12` migrations registradas, `30196` registros lidos no catálogo e escrita controlada com rollback.

### 09/03: [Features Premium e Histórico](./walkthrough/release_features_premium.md) 💎

- **Entitlement Centralizado:** Fluxo premium agora deriva do cache validador `useEntitlementPremium` (Server-Side + Local TTL) substituindo verificações isoladas de hash na UI.
- **Histórico Assinante:** Migração completa da persistência de histórico para o `IndexedDB` e criação do `ModalHistoricoCompras` com acesso exclusivo a assinantes.
- **Limite Gratuito Inteligente:** Implementada trava client-side de 15 _itens distintos_ no carrinho para usuários free (`ModalBloqueio`), sem afetar a alteração de quantidade de itens já presentes.
- **Limpeza Textual Visual:** Script `fix_accents.cjs` implementado com correção de acentuação massiva em todos os modais da UI, restaurando "Café", "Pêndulo", "Automático" do mojibake nativo.
- **Validação de Fluxos:** O botão do coração agora se oculta graciosamente via _gating_ visual reativo na barra de navegação quando o prêmio é reconhecido como ativo e validado.

### 14/03: [Postgres Gerenciado no Supabase](./walkthrough/postgres_gerenciado_supabase.md) ☁️

- **Plano Mestre Executado:** O roadmap definido em [Plano Implementação Postgres Produção](./walkthrough/plano_implementacao_postgres_producao.md) foi concluído.
- **Cutover de Infraestrutura:** Banco de dados de produção criado e migrado com sucesso para o Supabase usando a estratégia de *Postgres Gerenciado* (sem uso de SDK ou dependência de Auth no cliente).
- **Trilha Operacional Validada:** Execução real da nossa trilha Node.js (`001_aplicar_migrations`, `002_carregar_catalogo_inicial`, `003_validar_deploy_do_banco_em_producao`) via pipeline limpa com `exec.sh` usando a string do `Pooler` (porta 6543).
- **Governança de Setup:** Garantia de que nenhuma chave do banco (`anon_key`, `service_role`) trafegue no frontend; a Vercel atua como proxy seguro e exclusivo.
- **Resiliência e Ferramental:** Adicionado script `000_testar_conexao.ts` para análise semântica prévia de conectividade (DNS, TCP, Auth).
- **Validação de Produção:** O [Smoke Test de Produção](./walkthrough/smoke_test_producao.md) está configurado como artefato definitivo para ser executado manualmente após deploys.
