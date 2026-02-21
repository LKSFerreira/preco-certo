# 🧠 Memória do Projeto: Sem Susto

Este documento é a **Fonte Única de Verdade (Single Source of Truth)** sobre a história, contexto e decisões do projeto "Sem Susto". Ele deve ser consultado por qualquer agente LLM que inicie uma nova sessão no repositório.

> **Status:** 🚀 Em Produção
> **URL:** [https://www.semsusto.app](https://www.semsusto.app)
> **Versão:** Fase 0.8 (MVP + Monetização em Desenv.)

---

## 1. Visão Geral e Propósito

**Sem Susto** (anteriormente "Preço Certo") é um PWA _mobile-first_ projetado para resolver a "ansiedade do carrinho cheio": a incerteza do valor total a pagar durante as compras.

*   **Problema Real:** O consumidor perde a conta do total enquanto coloca itens no carrinho.
*   **Solução:** Um scanner de bolso super rápido + Lista em tempo real.
*   **Diferencial:** IA que lê o rótulo (OCR) para você não precisar digitar nome, marca e peso.
*   **Filosofia:** _Local-First_ (funciona offline), Privacidade Total (sem ads, sem venda de dados) e UX "Frictionless" (o mínimo de toques possível).

---

## 2. Status do Projeto

*   **Produção:** Deploy ativo na Vercel (`semsusto.app`).
*   **Ambiente Dev:** Docker Compose (PostgreSQL, App, Scripts Python).
*   **Monetização:** Em implementação (Sistema de Tokens Anônimos).

---

## 3. Funcionalidades Chave

### 📷 Scanner & Entrada
*   **Scanner Híbrido:** Usa `html5-qrcode` para ler códigos de barras EAN-13/EAN-8 com alta performance no browser.
*   **Fallback Manual:** Se o código não ler, digitação rápida numérica.
*   **IA (Mágica):** Se o produto não existe no banco, o usuário tira uma foto. O **Groq (Llama 4 Vision)** lê a imagem e preenche: Nome, Marca, Tamanho.

### ⚡ UX Premium (Detalhes que importam)
*   **Rainbow Button:** O botão "Auto Preencher" brilha/anima para incentivar o uso da IA.
*   **Tutorial Visual:** Slide interativo no primeiro acesso ensinando a escanear.
*   **Edição Fluida:** Ao tocar em um campo (ex: Nome), o texto é **selecionado automaticamente** para facilitar reescrita.
*   **Validação Inteligente:** Se o usuário tentar salvar com erro, o app foca e scrolla até o campo errado.
*   **Dica de Foto:** Se a IA falhar ou imagem for ruim, o app orienta como tirar uma foto melhor.

### 💰 Monetização (Ética)
*   **Privacidade:** Zero Ads. Zero Trackers. Zero Venda de Dados.
*   **Tokens:** O usuário compra um "café" (R$ 4,90) e recebe um Token Anônimo (`SEM-SUSTO-XXXX`).
*   **Sem Login:** Não exigimos email ou senha. O Token é a conta.

---

## 4. Arquitetura Técnica

### Frontend (Core)
*   **React 19 + Vite 6:** Performance de build e runtime.
*   **TypeScript 5.8:** Tipagem estrita.
*   **Tailwind CSS v4:** Estilização moderna e leve.
*   **PWA:** Manifesto e Service Workers para instalação no celular.

### Backend & Infra
*   **Repository Pattern:** Abstração completa do acesso a dados.
*   **RepositorioHibrido:** Sincronia automática entre LocalStorage (Cache/Offline) e PostgreSQL (Cloud/Sync).
*   **Strategy Pattern (IA):** Interface comum para troca fácil de provedores (hoje Groq, amanhã OpenAI/Gemini).
*   **Proxy Serverless:** Handlers na Vercel protegem as chaves de API e emulam o comportamento da API em desenvolvimento local.

### Cascata de Busca (Resiliência)
Ao escanear um código `789...`:
1.  **Cache Local (<10ms):** "Já escaneei isso?"
2.  **OpenFoodFacts (~500ms):** Banco de dados mundial gratuito.
3.  **Cosmos API (~800ms):** Banco de dados comercial brasileiro (via Proxy).
4.  **IA/Manual:** "Não achei, tira uma foto".

---

## 5. Histórico e Evolução

### Janeiro 2026: The Big Bang
*   Nasce como **"Preço Certo"**.
*   Foco total no MVP: Scanner funcionando e Carrinho somando.
*   Implementado Docker DevContainer para ambiente padronizado.

### Fevereiro 2026: Refinamento e Identidade
*   **Rebranding:** Renomeado para **"Sem Susto"** (domínio disponível e mais "catchy").
*   **Infraestrutura:** Migração de scripts shell para Docker nativo. Scripts de limpeza de dados (30k produtos BR).
*   **Qualidade:** Implementação de "Guerra aos Dados Sujos" (Lista negra e sanitização via Zod).
*   **UX:** Implementação do Select-on-focus e scroll automático em erros.

### 17/02 - 18/02: PostgreSQL, Monetização e Segurança (Marco Crítico)
*   **Integração DB:** Implementado Repositório Híbrido e API Serverless para persistência segura.
*   **Backend de Monetização:**
    *   Implementada arquitetura de Tokens Anônimos: `api/tokens/gerar`, `ativar` (com limite de 2 dispositivos e cooldown 24h) e `consultar`.
    *   **Rate Limiting:** Tabela `rate_limit_geral` bloqueando abusos e tentativas suspeitas por IP.
*   **Auditoria Hardcore:**
    *   Implementados Triggers PostgreSQL que capturam alterações (`dados_antigos` vs `dados_novos`) e injetam o IP do cliente via `app.client_ip` na transação.
*   **Segurança (Pentest Realizado):**
    *   **SQL Injection:** Blindado via consultas parametrizadas.
    *   **XSS:** Mitigado via sanitização estrita e React escaping.
    *   **Flood Attack:** Proteção de Rate Limit (429) validada com sucesso em simulações de carga.
*   **Decisão de CORS:** Decidido aplicar `Access-Control-Allow-Origin` rigoroso via `vercel.json` para eliminar acesso externo não oficial à API.

### 18/02: Segurança de API (CORS) Blindada 🛡️
*   **Produção (`vercel.json`):** Configuração estrita permitindo apenas `https://www.semsusto.app`.
*   **Local (`server.ts`):** Middleware dinâmico implementado para aceitar IPs da rede local (192.168.x.x, 10.x.x.x) permitindo testes em dispositivos reais via Docker.
*   **Infraestrutura:** Servidor local agora suporta `PORT` via variável de ambiente, facilitando testes automatizados.
*   **Validação:** Script `scripts/verify_cors.js` criado para CI/CD de segurança.

### 18/02: Refatoração Offline First e Correção de Fluxo 🔄
*   **Arquitetura:** `RepositorioProdutosHibrido` renomeado para `RepositorioProdutosOfflineFirst`. Estratégia de priorizar cache local e sincronizar com remoto (database) agora está explícita.
*   **Fluxo de Busca:** `App.tsx` corrigido para consultar o Banco de Dados (Remoto) antes de APIs externas (OFF/Cosmos).
*   **Integridade de Dados:** Removido salvamento automático de dados crus de APIs externas. Sistema redireciona para formulário manual, prevenindo erros de validação ("Dados inválidos").
*   **UX:** Corrigido bug visual onde produtos vindos do banco não apareciam no carrinho por falta de atualização de estado React.

### 19/02: Validação Dinâmica, Fluxo OCR-First e Feature Flags 🎯
*   **Validação Dinâmica (REGEX):** `REGEX_UNIDADE` agora é gerada automaticamente a partir do `UNIT_MAP` (fonte única de verdade). Adicionadas variações pt-BR: `peça`, `pça`, `pças`, `pçs`, `pcs`, `pecas`.
*   **Fluxo OCR-First:** Formulário de produto abre com campos desabilitados (Fase Foto). Usuário é incentivado a tirar foto do rótulo antes de digitar. Após OCR (sucesso ou falha), campos são liberados.
*   **Botão Premium (Preencher Manualmente):** Implementado com cadeado 🔒, pronto para desbloquear quando sistema premium estiver ativo. Não regride a UX atual.
*   **Feature Flags (Storage):** Adicionadas `VITE_USAR_LOCALSTORAGE` e `VITE_USAR_BANCO_POSTGRES` seguindo o mesmo padrão das flags de APIs externas. Composição condicional dos repositórios em `ContextoRepositorios.tsx`.
*   **Logs de OCR:** Dados extraídos pela IA agora são exibidos no console seguindo o mesmo padrão das APIs (`✅ [ORIGEM: IA_OCR]`).

### 19/02: Migração de Armazenamento → IndexedDB 📦
*   **Incidente:** Estouro do `localStorage` em produção (~7 itens com foto Base64 = crash). Documentado em `postmortem_estouro_localstorage.md`.
*   **Solução:** Migração do catálogo de produtos para `IndexedDB` (store único com keyPath `codigo_barras`). Imagens Base64 são convertidas para `Blob` (binário) na escrita, e para `objectURL` na leitura — app não precisa saber que usa IndexedDB.
*   **Arquitetura:** Carrinho e flags permanecem no `localStorage` (~5KB). Catálogo e imagens vão para IndexedDB (GBs). Schema do PostgreSQL não foi alterado.
*   **Repositório:** Criado `RepositorioProdutosIndexedDB` (`repositorios/indexed-db.ts`) substituindo `RepositorioProdutosLocalStorage` em `ContextoRepositorios.tsx`.
*   **Débitos Técnicos Registrados:** fila de retry para sync offline. (Token premium corrigido).

### 21/02: [Segurança Front-end](./walkthrough/seguranca_front-end.md) (Client-Side Hashing) 🛡️
*   **Problema:** Token premium era armazenado em texto puro, sujeito a vazamento e interceptação/cópia.
*   **Solução:** Implementado ofuscação com `SHA-256` via Web Crypto nativa (`crypto.subtle`) no Front-end após a validação. O `localStorage` tem apenas `sem_susto_premium_hash`.
*   **Arquitetura Strict:** O novo `RepositorioPremium` intercepta as requisições (Groq API, Consultas) e despacha usando headers `X-Premium-Token`. 
*   **Design Serverless:** Lógicas de autorização extraídas do _Proxy Groq_ (`analisar.ts`) e encapsuladas na abstração `api/_lib/auth.ts`, respeitando _Single Responsibility Principle_.

### 21/02: [Refino de UX Premium](./walkthrough/ux_premium_feedback.md) (Quantum Core & Input Mask) 💎
*   **UX Quântica:** Implementado componente `QuantumCore` com animações 3D CSS (`preserve-3d`) e filtros SVG Rainbow para feedback visual de estados (Idle, Loading, Sucesso, Erro).
*   **Anti-Fragilidade de Input:** Criada máscara de input híbrida que bloqueia a exclusão do prefixo `SEM-SUSTO-` e formata a chave randômica automaticamente.
*   **Higiene de Navegação:** Implementado fallback de rota global (`404`) que limpa incondicionalmente a barra de endereços suja, mantendo a experiência PWA limpa.
*   **Acessibilidade:** Adicionado botão de colar inteligente com limpeza de clipboard e foco automático via `focus-within`.

---

## 6. Padrões de Desenvolvimento (Para o Agente)

Se você, Agente, está assumindo agora, siga estas regras sagradas:
1.  **Idioma:** Português (pt-BR) sempre. Código, Vars, Comentários, Commits.
2.  **Abreviações:** PROIBIDAS. Use `quantidade_itens`, não `qtd`.
3.  **Atomicidade:** Um commit por mudança lógica. Use o workflow `@[/commit]`.
4.  **Local-First:** Teste tudo rodando dentro do container (Docker).
5.  **Segurança em Primeiro Lugar:** Toda nova API ou modificação de banco deve passar por validação de schema (Zod) e auditoria.

---

> _"Faça com qualidade e leve o tempo que precisar."_
