# Supabase Learning & Implementation Log 📘

Este documento registra todo o processo de aprendizado, configuração e decisões tomadas durante a implementação do Supabase no projeto **Sem Susto**.

> **Objetivo Crítico:** Implementar banco de produção seguro, performático e **SEM CUSTOS SURPRESA** (Free Tier Only).

---

## 1. Princípios de Segurança e Custos 🛡️💸

### 💰 Proteção Contra Cobranças (Spend Cap)
O maior medo é a fatura de R$ 100k. Para evitar isso:
1.  **Plano Free Tier:** Manter-se estritamente nos limites (500MB database, 5GB bandwidth).
2.  **Spend Cap (Limite de Gastos):** O Supabase tem um "Spend Cap" ativado por padrão no plano Free. Isso significa que se excedermos o limite, **o serviço para**, mas não cobra.
    *   *Ação:* Verificar explicitamente se o Spend Cap está ATIVO no painel.
3.  **Monitoramento:** Configurar alertas de uso (se possível via dashboard).

### 🔐 Segurança na Abordagem "Postgres Gerenciado"
Conforme definido no `plano_implementacao_postgres_producao.md`, **não utilizaremos o SDK do Supabase nem sua API REST no frontend nesta fase**. O Supabase será tratado exclusivamente como um banco PostgreSQL remoto.

Isso altera nosso modelo de ameaça:
1.  **Sem Chaves no Frontend:** As chaves `ANON_KEY` e `SERVICE_ROLE_KEY` **não serão utilizadas** pela aplicação. O frontend continuará se comunicando apenas com a nossa API na Vercel.
2.  **Conexão Direta:** A Vercel acessará o Supabase via string de conexão direta (Connection Pooler/URI IPv4) armazenada na variável `DATABASE_URL`.
3.  **Blindagem Total:** Como o banco de dados não está exposto diretamente à internet pública (acesso indireto via Vercel), a segurança da nossa própria API Serverless passa a ser a nossa principal linha de defesa (CORS, Rate Limiting, Validação de Dados).

*Nota sobre RLS:* O Row Level Security (RLS) perde protagonismo nessa abordagem, já que não temos usuários do frontend acessando o banco diretamente com a `ANON_KEY`. Toda operação no banco é feita pelo backend (equivalente à role de serviço). No entanto, ativar o RLS por padrão continua sendo uma boa prática de "Defesa em Profundidade" caso a API venha a ser exposta no futuro.

---

## 2. Checklist de Implementação (Foco em Postgres Remoto) 🚀

### A. Configuração do Projeto (Painel Supabase)
- [ ] Criar conta/organização no Supabase.
- [ ] Criar projeto na região **São Paulo (sa-east-1)** (Melhor latência com a Vercel).
- [ ] Definir senha forte para o banco de dados.
- [ ] Guardar credenciais no gerenciador de senhas.
- [ ] Copiar a **Connection string (URI)** em `Project Settings -> Database`. (Preferir IPv4 ou Connection Pooler compatível com Node.js).

### B. Banco de Dados (Operação via Node/JS CLI)
> A execução dessas etapas será feita localmente apontando para o banco remoto usando nossa trilha operacional em `lib/scripts/database/`.

- [ ] Configurar `DATABASE_URL_PROD` localmente (não commitar).
- [ ] Executar migrations no banco remoto (`aplicar_migrations.ts`).
- [ ] Executar carga inicial do catálogo (`carregar_catalogo_inicial.ts`).
- [ ] Executar script de validação para garantir integridade e schema (`validar_banco_remoto.ts`).

### C. Integração Produção (Cutover)
- [ ] Configurar a variável `DATABASE_URL` no painel da Vercel com a string de conexão do Supabase.
- [ ] Garantir que `APP_ENV=producao` na Vercel.
- [ ] Fazer um novo deploy (Cutover).
- [ ] Executar Smoke Test em produção.

---

## 3. Diário de Bordo (Log) 📝

### [Fevereiro/2026] - Início
*   Documento criado com foco em Spend Cap e RLS.

### [Março/2026] - Revisão Arquitetural
*   Decisão registrada em `plano_implementacao_postgres_producao.md`: Supabase será usado como **Postgres Gerenciado**.
*   Documento atualizado para remover referências ao SDK (`@supabase/supabase-js`) e focar na conexão direta via `DATABASE_URL` pela Vercel. A segurança baseada em ocultação total de chaves e conexão proxy via backend mitiga os riscos de exposição.

---

## 4. Casos de Estudo e Prevenção (Security Hardening) 🛡️

### O Caso "OpenClaw" e Vazamento de Chaves
Usuários relataram incidentes (como no caso OpenClaw/OpenAI wrappers) onde chaves de API com permissões de administração total foram expostas por erro simples.
*   **Nossa Proteção Atual:** Como não usamos as chaves `ANON_KEY` e `SERVICE_ROLE_KEY` do Supabase, nós eliminamos completamente esse vetor de ataque no frontend. Nossa string de conexão `DATABASE_URL` ficará **exclusivamente** na Vercel e NUNCA no frontend.

### 🚫 O Pecado Capital da String de Conexão
Para não acordarmos com uma dívida ou banco apagado, **JAMAIS** faremos isso:

1.  **Expor a `DATABASE_URL` no Frontend ou Repositório:**
    *   *Errado:* Commitar `.env.local` ou colocar a string em variáveis prefixadas com `VITE_` (ex: `VITE_DATABASE_URL`). Variáveis `VITE_` vão para o código fonte do cliente!
    *   *Certo:* A `DATABASE_URL` não tem prefixo e só existe nos servidores (Vercel) e no `.env.local` da máquina do desenvolvedor (que já está no `.gitignore`).

### ✅ Checklist de Blindagem (Antes do Deploy de Cutover)
- [ ] **Lint de Secrets:** Verificar se não há strings de conexão ou senhas hardcoded no código.
- [ ] **Network Restrictions:** Restringir conexões do banco, se possível e viável no Free Tier, para minimizar IPs que podem tentar brute force.
- [ ] **Backup Frio:** Garantir que o script de seed local (`produtos_higienizados.json`) continua sendo nossa fonte de verdade para a carga inicial.

---

## 5. Glossário Rápido
*   **GTIN:** Global Trade Item Number (Código de Barras).
*   **Postgres Gerenciado:** Abordagem onde o banco roda na nuvem, mas acessamos ele como se fosse um Postgres comum (via TCP/IP), sem usar as APIs REST proprietárias do provedor.
*   **Connection Pooler:** Serviço (como o PgBouncer, incluído no Supabase) que gerencia conexões de forma eficiente, vital para ambientes Serverless (como a Vercel) que podem abrir muitas conexões simultâneas.
