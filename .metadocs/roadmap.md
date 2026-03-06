# Roadmap - Sem Susto 🛒

## Filosofia de Desenvolvimento

> **Princípio:** Aplicação funcionando primeiro, infraestrutura depois.

```
┌───────────────────────────────────────────────────────────────┐
│  FASE 0.5    │  FASE 1      │  FASE 2        │  FASE 3        │
│  MVP Local   │  Deploy      │  PostgreSQL    │  Auth + RLS    │
│  ─────────   │  ─────────   │  ─────────     │  ─────────     │
│  localStorage│  Vercel      │  Local + Prod  │  Supabase Auth │
│  Repository  │  Funcional   │  Coexistindo   │  Row Level Sec │
│  Pattern     │              │                │                │
└───────────────────────────────────────────────────────────────┘
```

---

## Fase 0.5: Ambiente de Desenvolvimento (Antiga Fase 0) ✅

> **Status:** Concluída

- [x] **0.1** Docker Compose configurado
- [x] **0.2** Estrutura de variáveis de ambiente
- [x] **0.3** README documentado

---

## Fase 0.5: MVP Funcional Local ✅

> **Objetivo:** App 100% funcional no browser usando localStorage
> **Arquitetura:** Repository Pattern para facilitar migração futura
> **Duração:** 2-3 dias

### Preparação da Arquitetura

- [x] **0.5.1** Criar interface `RepositorioProdutos` (contrato abstrato)
- [x] **0.5.2** Criar interface `RepositorioCarrinho` (contrato abstrato)
- [x] **0.5.3** Implementar `RepositorioProdutosLocalStorage`
- [x] **0.5.4** Implementar `RepositorioCarrinhoLocalStorage`
- [x] **0.5.5** Criar contexto React para injeção de repositórios

### Funcionalidades Core

- [x] **0.5.6** Scanner funcionando (entrada manual OK, câmera real implementada com `html5-qrcode`)
- [x] **0.5.7** Cadastro de produto com IA (Gemini / OpenRouter)
- [x] **0.5.8** Carrinho operacional (adicionar, remover, alterar quantidade)
- [x] **0.5.9** Cálculo de total em tempo real
- [x] **0.5.10** In-app Debugger para mobile
- [x] **0.5.11** Limpar carrinho / Finalizar compra (salvar histórico local)

### Polimento

- [x] **0.5.12** Testar fluxo completo no browser local
- [x] **0.5.13** Corrigir bugs encontrados (Keyboard overlap, CORS, API Key security)

### Melhorias de UX (Pós-Testes com Usuários)

- [x] **0.5.14** Validação de formulário com foco automático no primeiro campo inválido
- [x] **0.5.15** Campo de tamanho aceita vírgula como separador decimal (pt-BR)
- [x] **0.5.16** Imagens do carrinho redimensionadas e centralizadas (`object-contain`)
- [x] **0.5.17** Remover botão de lixeira duplicado na lista de produtos
- [x] **0.5.18** Modais customizados substituindo `window.confirm` e `alert`
- [x] **0.5.19** Modal de doação exibido após finalizar/esvaziar carrinho
- [x] **0.5.20** Aumentar contraste do botão cancelar no modal de recorte
- [x] **0.5.21** Tutorial visual de primeiro acesso (2 slides: scanner + foto OCR)
- [x] **0.5.22** Padronização de textos em Title Case (API e IA)
- [x] **0.5.23** Botão "Auto Preencher" com animação Rainbow Border
- [x] **0.5.24** Finalização direta de compra (bypass de modal)
- [x] **0.5.25** Proxy reverso para API Cosmos (correção CORS)

**Critério de sucesso:** Usar o app do início ao fim no `localhost:5173` sem erros.

---

## Fase 0.6: Ajustes de Aplicação ✅

> **Objetivo:** Preparação do ambiente, correções de pipeline e otimização de consultas de dados.

- [x] **0.6.1** Padronizar DevContainer (migrado scripts `.sh` para Dockerfile nativo)
- [x] **0.6.2** Implementar fluxo de consulta: Local -> API BR (OpenFoodFacts) -> Cosmos (Fallback)
- [x] **0.6.3** Configurar ambiente (IDE) para ignorar erros de lint/sintaxe irrelevantes no contexto atual
- [x] **0.6.4** Criar script de processamento de dump da Open Food Facts (31.498 produtos BR extraídos!)

---

## Fase 0.6.5: Débitos Técnicos e Higienização de Dados 🧹

> **Objetivo:** Garantir qualidade e padronização dos dados antes de popular o banco.
> **Contexto:** Padronização de unidades (L, ml), formatação de nomes e limpeza do CSV bruto.

- [x] **0.6.5.1** Criar script Python para higienização do CSV `produtos_brasil_v1.csv` (Campos: descricao, marca, tamanho, preco)
- [x] **0.6.5.2** Implementar regras de padronização de Tamanho (Regex para unificar L, ml, kg, g)
- [x] **0.6.5.3** Implementar regras de padronização de Descrição (Title Case, remover unidades redundantes)
- [x] **0.6.5.4** Gerar dataset limpo `produtos_higienizados.csv`
- [x] **0.6.5.5** Refatorar serviços do Frontend para usar as mesmas regras de padronização

---

## Fase 0.7: Banco de Dados Local (PostgreSQL) ✅

> **Objetivo:** Persistir dados no Postgres rodando no Docker, saindo do LocalStorage/JSON.
> **Duração:** 1-2 dias

- [x] **0.7.1** Criar estrutura de Migrations (`infra/migrations/*.sql`) e DDL da tabela `produtos`
- [ ] ~~**0.7.2** Criar DDL da tabela `carrinho`~~ _(Removido: carrinho fica no localStorage como referências)_
- [x] **0.7.3** Criar script Python `scripts/init_db.py` para rodar migrations e popular dados
- [x] **0.7.4** Importar `produtos_higienizados.json` para o Postgres Local (Bulk Insert)
- [x] **0.7.5** Validar dados no banco (30.196 produtos importados via CLI)
- [x] **0.7.6** Criar API REST (Node/Express ou FastAPI) para expor o repositório PostgreSQL ao frontend

**Critério de sucesso:** Banco populado com 30k produtos e acessível via API.

> [!NOTE]
> **Estratégia Local First:**
> Validamos tudo no container Postgres do Docker. A migração para Cloud (Supabase) será apenas um "dump & restore" futuro.
> Mantemos os arquivos Imutáveis `.sql`.

> [!IMPORTANT]
> **Arquitetura de Armazenamento:**
>
> - **Banco de Dados (PostgreSQL/Supabase):** Produtos (catálogo compartilhado)
> - **IndexedDB:** Catálogo local (cache) com imagens como Blob (binário)
> - **localStorage:** Carrinho (apenas referências: codigo_barras + quantidade) + flags de UI
> - **Imagens:** URLs externas quando disponíveis, Blob binário para fotos manuais

---

## Fase 0.8: Implementação do Fluxo de Busca em Cascata ✅

> **Objetivo:** Novo fluxo de busca com fallback progressivo
> **Duração:** 2-3 dias

### Serviços de Busca

- [x] **0.8.1** Criar `services/openfoodfacts.ts` (integração com API pública)
- [x] **0.8.2** Refatorar `services/cosmos.ts` para ser mais defensivo
- [x] **0.8.3** Implementar busca em cascata no `App.tsx` (cache → OFF → Cosmos → Manual)

### Tratamento de Dados Parciais

- [x] **0.8.4** Implementar detecção de campos faltantes (foto, marca, tamanho)
- [x] **0.8.5** Criar componente `DicaFoto` para orientar usuário sobre foto de qualidade

### Tutorial e UX

- [x] **0.8.6** Reduzir tutorial inicial para 2 slides (remover slide 3 do onboarding)
- [x] **0.8.7** Ajustar lógica do `TutorialFoto`: Visual redesenhado ("Cereal Box"), validando com usuário. ✅
- [x] **0.8.8** Melhorar feedback visual durante busca em cascata (loading states com animação de carrinho)
- [x] **0.8.9** Extrair componente reutilizável `LoadingCarrinho.tsx`
- [x] **0.8.10** Criar função de reset completo do localStorage (limpa tutorial, carrinho, catálogo, DicaFoto)
- [x] **0.8.11** Refatoração Offline First: Priorizar busca no Banco (Remoto) antes de API Externa.

**Critério de sucesso:** Escanear produto desconhecido e ver cascata de busca funcionar.

---

## Fase 0.8.5: Sistema de Monetização 💰

> **Objetivo:** Implementar contribuição voluntária com tokens anônimos (conforme `.metadocs/monetizacao.md`)
> **Duração:** 3-5 dias
> **Dependência:** Decisões de negócio aprovadas em `monetizacao.md`

### Schema e Migrations (Local First)

- [x] **0.8.5.1** Criar DDL da tabela `tokens` (token_hash, plano, status, duracao_dias, criado_em, ativado_em, expira_em)
- [x] **0.8.5.2** Criar DDL da tabela `dispositivos` (token_hash, fingerprint_hash, vinculado_em)
- [x] **0.8.5.3** Criar DDL da tabela `tentativas_ativacao` (ip_hash, user_agent_hash, fingerprint_hash, token_hash_tentado, resultado, criado_em)
- [x] **0.8.5.4** Rodar migrations no PostgreSQL local via `scripts/init_db.py`

### Lógica de Tokens (Backend — Vercel Serverless Functions)

- [x] **0.8.5.5** Implementar geração de token no backend — `POST /api/tokens/gerar` (charset base30, SHA-256, protegido por `X-API-Secret`)
- [x] **0.8.5.6** Implementar ciclo de vida: VALIDO → ATIVO → EXPIRADO — `POST /api/tokens/ativar` (expiração lazy)
- [x] **0.8.5.7** Implementar limite de 2 dispositivos por token + cooldown de 24h
- [x] **0.8.5.8** Implementar rate limiting — `api/_lib/rate_limiter.ts` (5 tentativas/hora por IP, bloqueio após 10 tokens inexistentes)
- [x] **0.8.5.9** Criar script CLI `scripts/gerar_token.py` para tokens trial manuais + `GET /api/tokens/consultar`

### Frontend (Premium - Core & Segurança) ✅

- [x] **0.8.5.10** Implementar armazenamento seguro (`localStorage`) utilizando ofuscação com SHA-256 no Frontend.
- [x] **0.8.5.11** Atualizar o envio do Headerv `X-Premium-Token` nas chamadas para a Vercel Serverless Functions para transmitir apenas o Hash gerado localmente.
- [x] **0.8.5.12** Refatorar APIs do Backend (Groq Proxy e etc) para validar consumo Premium através do `token_hash`.

### Frontend (Premium - UI) ✅

- [x] **0.8.5.13** Criar tela de planos de contribuição (Café R$4,90 / Lanche R$6,90 / Apoiador R$12,90)
- [x] **0.8.5.14** Criar modal de pagamento aprovado (exibir token, ativar, salvar via WhatsApp, screenshot para salvar na galeria)
- [x] **0.8.5.15** Criar rota `/ativar/:token` para ativação via deep link
- [x] **0.8.5.16** Implementar funcionalidades gratuito vs premium (limites de IA e carrinho)
- [x] **0.8.5.17** Criar modal de status do token (plano, dias restantes, expiração) com dados do localStorage
- [x] **0.8.5.18** Implementar cache de status do token no localStorage (evitar requisições desnecessárias ao `/api/tokens/consultar`)

### Integração com Pagamento (MVP — última etapa)

- [x] **0.8.5.19** Integrar API Mercado Pago para geração de PIX
- [x] **0.8.5.20** Implementar polling de status de pagamento (intervalo: 5s)
- [x] **0.8.5.21** Gerar token automaticamente após confirmação de pagamento

> [!NOTE]
> **Status de implementação validado via Git (23/02/2026 a 28/02/2026):**
>
> - Backend de pagamentos Mercado Pago e endpoint de status implementados.
> - Polling de status implementado na `ModalPagamento`.
> - A UI de QR Code/Copia e Cola segue **mockada temporariamente** no frontend por decisão de produto.

**Critério de sucesso:** Fluxo completo local: escolher plano → pagar PIX → receber token → ativar → funcionalidades premium desbloqueadas.

> [!NOTE]
> **Referência completa:** Todas as regras de negócio, limites, frases da UI e decisões de LGPD estão em [monetizacao.md](.metadocs/monetizacao.md).

---

## Fase 1: Deploy Funcional na Vercel ✅

> **Objetivo:** MVP online acessível publicamente
> **Duração:** 1-2 dias

- [x] **1.1** Verificar build de produção (`docker compose exec app npm run build`)
- [x] **1.2** Configurar variáveis de ambiente na Vercel (API Gemini/Groq)
- [x] **1.3** Deploy e testar no celular
- [x] **1.4** Configurar domínio customizado: **https://www.semsusto.app**

**Critério de sucesso:** ✅ App acessível em https://www.semsusto.app

> [!NOTE]
> Nesta fase os dados ficam apenas no navegador do usuário.
> Se ele limpar o cache, perde tudo. Isso é **aceitável temporariamente**.

---

## Fase 2: PostgreSQL (Local + Produção) 🐘

> **Objetivo:** Dados persistidos em banco real, com ambientes separados
> **Duração:** 1 semana

### Configuração de Ambiente

- [x] **2.1** PostgreSQL local via Docker Compose (já existe no `.docker`)
- [ ] **2.2** PostgreSQL produção (Supabase Database ou Neon.tech)
- [ ] **2.3** Variáveis de ambiente separadas (`DATABASE_URL_DEV`, `DATABASE_URL_PROD`)

---

## Fase 2.5: Migração para Produção (Supabase) ⚡

> **Objetivo:** Implementação segura do banco de produção, seguindo o guia `supabase_learning.md`.
> **Foco:** Segurança (RLS), Custos (Free Tier) e Performance.

- [x] **2.5.1** Criar documentação `supabase_learning.md` (Checklist de Segurança/Custos)
- [ ] **2.5.2** Configurar Projeto Supabase (Região SP, Spend Cap Ativo)
- [ ] **2.5.3** Configurar Migrations e Seeds (Réplica do Schema Local)
- [ ] **2.5.4** Implementar `RepositorioProdutosSupabase` (SDK Oficial)
- [ ] **2.5.5** Configurar RLS (Row Level Security) para proteção de dados
- [ ] **2.5.6** Switch de Repositório (Local -> Supabase) via Variável de Ambiente

---

### Migração dos Repositórios (Continuação da Fase 2)

- [x] **2.4** Implementar `RepositorioProdutosPostgres` (via RepoHibrido e API Serverless)
- [ ] **2.5** Implementar `RepositorioCarrinhoPostgres` (quando houver autenticação — hoje o carrinho é local-only)
- [x] **2.6** Criar script de migração de dados (`scripts/init_db.py`)
- [x] **2.7** Switch automático baseado em ambiente (RepoOfflineFirst)

### Validação

- [x] **2.8** Testar localmente com banco Postgres (30.196 produtos importados)
- [ ] **2.9** Deploy na Vercel conectando ao banco de produção
- [ ] **2.10** Verificar dados persistindo entre dispositivos

### Auditoria e Monitoramento (Bônus Segurança) ✅

- [x] **2.11** Criar tabela `auditoria_logs` para rastreabilidade
- [x] **2.12** Implementar Triggers para captura automática de mudanças
- [x] **2.13** Injetar contexto de IP (`set_config`) na transação da API
- [x] **2.14** Realizar Pentest (Simulação de SQLi, XSS e Flood Attack - OK)

**Critério de sucesso:** Adicionar produto no celular, ver no PC.

---

## Fase 3: Autenticação e Segurança 🔐

> **Objetivo:** Usuários identificados, dados isolados por conta
> **Duração:** 1 semana

- [ ] **3.1** Configurar Supabase Auth
- [ ] **3.2** Tela de login (Google/Email)
- [ ] **3.3** Rotas protegidas
- [ ] **3.4** Row Level Security (RLS) no banco
- [ ] **3.5** Associar produtos e carrinho ao `user_id`

### Segurança Avançada de API (CORS) 🚧

- [x] **3.6** Implementação de políticas de CORS em `vercel.json`
  - [x] Criar/Configurar arquivo de roteamento da Vercel.
  - [x] Restringir `Access-Control-Allow-Origin` apenas para domínios oficiais e dev local.
  - [x] Blindar métodos e cabeçalhos (`Methods`, `Headers`).
  - [x] Validar bloqueio bloqueando solicitações de origens externas simuladas.

**Critério de sucesso:** Dois usuários diferentes têm carrinhos isolados.

---

## Fase 4: Features Avançadas 🚀

> **Objetivo:** Experiência completa de app
> **Duração:** 2 semanas

- [x] **4.1** Scanner real com `html5-qrcode` (Adiantado para Fase 0.5.6)
- [ ] **4.2** Histórico de compras (tela dedicada com compras anteriores — feature Premium)
- [ ] **4.3** PWA completo (prompt "Adicionar à tela inicial" + cache offline via Service Worker)
- [ ] **4.4** Pesquisa de produtos
- [ ] **4.5** Editar/Excluir produtos do catálogo

### Insights de Consumo (Requer Autenticação)

- [ ] **4.6** Indicador de variação de preço: seta verde ↓ para itens mais baratos vs última compra, seta vermelha ↑ para mais caros (com % de variação)
- [ ] **4.7** Dashboard de consumo mensal
- [ ] **4.8** Recomendações baseadas no histórico

---

## Backlog (Pós-MVP) 📋

- [ ] Comparador de preços entre lojas
- [ ] Listas de compras predefinidas
- [ ] Notificações de ofertas
- [ ] Modo escuro
- [ ] Exportar histórico (CSV/PDF)
- [ ] Configurar página de doações com chave PIX real

---

## Fase 5: Débitos Técnicos 🔴

### 🟡 Qualidade de Código

- [ ] **Lint:** Configurar ESLint + Prettier (Padronização de código)
- [ ] **Testes:** Adicionar testes automatizados com Vitest

### 🔴 Segurança

- [x] **Token em texto puro:** RESOLVIDO (21/02). Agora utiliza `SHA-256` no client-side para armazenamento e transmissão via headers. Ref: [ux_premium_feedback.md](.metadocs/walkthrough/ux_premium_feedback.md) e [monetizacao.md](.metadocs/monetizacao.md)

### 🟢 Armazenamento (Migração localStorage → IndexedDB)

- [x] **Catálogo no IndexedDB:** Migrar o catálogo de produtos do `localStorage` (5MB) para `IndexedDB` (GBs). Imagens salvas como `Blob` (binário) em store único. Ref: [postmortem_estouro_localstorage.md](.metadocs/postmortem_estouro_localstorage.md)

### 🔴 Estabilidade (Offline First)

- [ ] **SyncQueue:** Implementar fila de retry para salvar dados quando offline (`repositorios/offline-first.ts`)

### 🟢 Limpeza

- [ ] **Cleanup:** Remover códigos mortos (delays de debug em `App.tsx`) e arquivos não utilizados
- [ ] Otimizar bundle size

### 🟡 Casos de uso

- [x] **5.1** Criar Seed de 5 Itens Genéricos (GENERICO-01 a 05) para casos de falha/indisponibilidade:
  - [x] **Câmera Quebrada/Indisponível:** Usuário não consegue tirar foto.
  - [x] **Sem Rótulo:** Produto sem informações legíveis.
  - [x] **A Granel/Feira:** Produtos pesados na hora sem código de barras.
  - [x] **Agilidade:** Usuário quer apenas somar o preço sem cadastrar detalhes.
