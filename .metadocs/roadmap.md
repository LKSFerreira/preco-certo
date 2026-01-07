# Roadmap - Preço Certo 🛒

## Decisão Técnica: Supabase Auth

> **Escolha:** Supabase Auth (em vez de Firebase Auth)

### Por que Supabase Auth?

```
┌─────────────────────────────────────────────────────────┐
│   COM FIREBASE AUTH          │   COM SUPABASE AUTH      │
├─────────────────────────────────────────────────────────┤
│   Firebase (Auth)            │   Supabase               │
│        +                     │   (Auth + DB + API)      │
│   Supabase (DB + API)        │                          │
│        =                     │        =                 │
│   2 serviços para gerenciar  │   1 serviço              │
│   2 SDKs diferentes          │   1 SDK                  │
│   2 dashboards               │   1 dashboard            │
└─────────────────────────────────────────────────────────┘
```

**Motivos da escolha:**

1. **Simplicidade** — Um único serviço para Auth + Database + API
2. **Menos dependências** — Um SDK em vez de dois
3. **RLS integrado** — As políticas de segurança usam o mesmo `auth.users`
4. **Menos configuração** — Não precisa sincronizar IDs entre Firebase e Supabase
5. **Custo** — Ambos são gratuitos, mas gerenciar um serviço é mais simples

> [!NOTE]
> Firebase Auth é excelente, mas para este projeto usar Supabase para tudo evita
> complexidade desnecessária. Se precisarmos de features específicas do Firebase
> (como push notifications), podemos adicionar depois.

---

## Visão do Produto

Aplicativo web (PWA) para controle de gastos em compras de supermercado, com scanner de código de barras, catálogo pessoal de produtos, e sincronização em nuvem.

---

## Fase 0: Ambiente de Desenvolvimento 🔧

> **Objetivo:** Dev Container configurado e funcional
> **Duração:** 1-2 dias

- [ ] **0.1** Configurar Dev Container com Node 20
- [ ] **0.2** Adicionar PostgreSQL local para desenvolvimento
- [ ] **0.3** Configurar extensões VS Code (Prettier, ESLint, Prisma)
- [ ] **0.4** Criar estrutura de variáveis de ambiente
- [ ] **0.5** Documentar setup no README

**Critério de sucesso:** `npm run dev` funciona dentro do container

---

## Fase 1: Backend com Supabase 🔐

> **Objetivo:** Autenticação e banco de dados funcionais
> **Duração:** 1 semana

- [ ] **1.1** Criar projeto no Supabase (gratuito)
- [ ] **1.2** Criar tabelas: `produtos`, `precos`, `compras`
- [ ] **1.3** Configurar Row Level Security (RLS)
- [ ] **1.4** Integrar Supabase SDK no React
- [ ] **1.5** Implementar tela de login com Google
- [ ] **1.6** Proteger rotas para usuários logados

**Critério de sucesso:** Fazer login e ver email no dashboard

---

## Fase 2: Migração de Dados 💾

> **Objetivo:** Dados persistidos na nuvem
> **Duração:** 1 semana

- [ ] **2.1** Criar hooks: `useProdutos`, `useCarrinho`, `useCompras`
- [ ] **2.2** Migrar catálogo de localStorage → Supabase
- [ ] **2.3** Migrar carrinho de localStorage → Supabase
- [ ] **2.4** Implementar loading states e error handling
- [ ] **2.5** Testar em dois dispositivos diferentes

**Critério de sucesso:** Mesmo carrinho aparece no celular e no PC

---

## Fase 3: Features Core 📦

> **Objetivo:** Scanner real e histórico
> **Duração:** 1-2 semanas

- [ ] **3.1** Integrar `html5-qrcode` para scanner real
- [ ] **3.2** Testar scanner em dispositivos móveis
- [ ] **3.3** Finalizar compra e salvar no histórico
- [ ] **3.4** Tela de histórico de compras
- [ ] **3.5** Editar/excluir produtos do catálogo
- [ ] **3.6** Pesquisa de produtos por nome

**Critério de sucesso:** Escanear produto real e finalizar compra

---

## Fase 4: PWA e Deploy 🚀

> **Objetivo:** App instalável e online
> **Duração:** 3-5 dias

- [ ] **4.1** Configurar `vite-plugin-pwa`
- [ ] **4.2** Criar manifest.json com ícones
- [ ] **4.3** Implementar Service Worker básico
- [ ] **4.4** Deploy no Vercel ou Netlify
- [ ] **4.5** Testar instalação no celular

**Critério de sucesso:** Instalar app na home screen e usar offline

---

## Backlog (Pós-MVP) 📋

- [ ] Comparador de preços entre lojas
- [ ] Listas de compras predefinidas
- [ ] Notificações de ofertas
- [ ] Modo escuro
- [ ] Exportar histórico (CSV/PDF)

---

## Débitos Técnicos 🔴

- [ ] Configurar ESLint + Prettier
- [ ] Adicionar testes com Vitest
- [ ] Remover arquivos desnecessários (python.md)
- [ ] Otimizar imagens e bundle size
