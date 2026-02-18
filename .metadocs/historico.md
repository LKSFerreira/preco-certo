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
