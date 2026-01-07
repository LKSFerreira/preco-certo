# Definição de Escopo — Preço Certo

## 1. Problema

Consumidores perdem o controle do valor total durante compras no supermercado, resultando em surpresas no caixa e orçamentos estourados.

## 2. Solução

Aplicativo web (PWA) que permite escanear produtos durante a compra, registrar preços e acompanhar o total acumulado em tempo real, com sincronização em nuvem.

## 3. Público-Alvo

- Famílias que fazem compras semanais/mensais
- Pessoas com orçamento controlado
- Consumidores que comparam preços entre lojas

---

## 4. Stack Tecnológica

### Frontend

| Tecnologia      | Versão | Propósito           |
| --------------- | ------ | ------------------- |
| React           | 19     | Biblioteca UI       |
| TypeScript      | 5.8    | Tipagem estática    |
| Vite            | 7      | Build tool          |
| vite-plugin-pwa | -      | Progressive Web App |

### Backend (BaaS)

| Tecnologia         | Propósito                       |
| ------------------ | ------------------------------- |
| **Supabase**       | Banco de dados + Auth + API     |
| PostgreSQL         | Banco de dados relacional       |
| Row Level Security | Isolamento de dados por usuário |

### Inteligência Artificial

| Tecnologia    | Propósito                     |
| ------------- | ----------------------------- |
| Google Gemini | Leitura automática de rótulos |

### Infraestrutura

| Tecnologia     | Propósito                           |
| -------------- | ----------------------------------- |
| Dev Containers | Ambiente de desenvolvimento isolado |
| Docker         | Containerização                     |
| Vercel/Netlify | Hospedagem do frontend              |

---

## 5. Funcionalidades

### MVP (Fases 0-4)

| Feature           | Descrição                   | Fase |
| ----------------- | --------------------------- | ---- |
| Dev Container     | Ambiente reproduzível       | 0    |
| Login com Google  | Autenticação via Supabase   | 1    |
| Catálogo na nuvem | Produtos salvos por usuário | 2    |
| Scanner de barras | Leitura via câmera          | 3    |
| Carrinho          | Controle de quantidade      | 2-3  |
| Histórico         | Compras finalizadas         | 3    |
| PWA               | App instalável              | 4    |

### Pós-MVP

| Feature              | Descrição           |
| -------------------- | ------------------- |
| Comparador de preços | Preço por loja      |
| Listas predefinidas  | Compras recorrentes |
| Modo escuro          | Tema alternativo    |

---

## 6. Fora do Escopo

- Versão nativa iOS/Android (consideramos PWA suficiente para MVP)
- Integração com APIs de preços externos
- Pagamentos dentro do app
- Funcionalidades sociais (compartilhar listas)

---

## 7. Modelo de Dados

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   usuarios  │     │  produtos    │     │   precos    │
│  (auth.users│◄────┤              │◄────┤             │
│   Supabase) │     │ codigo_barras│     │             │
│             │     │ nome         │     │ loja        │
│             │     │ marca        │     │ data        │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       │            ┌─────────────┐
       └───────────►│   compras   │
                    │             │
                    │ total       │
                    │ itens (JSON)│
                    │ data        │
                    └─────────────┘
```

---

## 8. Ambiente de Desenvolvimento

O projeto utiliza **Dev Containers** para garantir ambiente reproduzível:

- Container Node.js 20 (imagem oficial Microsoft)
- PostgreSQL local para desenvolvimento
- Extensões pré-configuradas (ESLint, Prettier, Prisma)
- Variáveis de ambiente isoladas

**Comando para iniciar:**

```bash
# VS Code detecta automaticamente o .devcontainer
# Ou manualmente: Ctrl+Shift+P → "Reopen in Container"
```
