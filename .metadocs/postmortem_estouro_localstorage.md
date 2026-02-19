# Postmortem: Estouro do localStorage em Produção 💥

> **Data do incidente:** 2026-02-19
> **Ambiente:** Produção (`semsusto.app`) — Supermercado real
> **Impacto:** App reiniciou durante uso, perdendo todos os dados do carrinho
> **Severidade:** 🔴 Crítica (experiência destruidora para o usuário)

---

## 1. O Que Aconteceu

Durante teste real em supermercado, o usuário adicionou ~7 itens ao carrinho. Ao cadastrar manualmente um novo produto e tirar foto do rótulo, o app tentou salvar a imagem em Base64 no `localStorage` e **estourou o limite de armazenamento** (~5-10MB, varia por navegador).

Isso disparou um `throw` no `salvarCatalogo()`, que — combinado com o `localStorage.clear()` de debug ativo no `useEffect` de inicialização — causou um reinício completo do app, **zerando todos os dados**.

---

## 2. Causa Raiz

### Cadeia completa do problema:

```
Câmera do celular (12MP) → foto ~3-5MB bruta
    → comprimirImagem(arquivo, 0.6, 500) → ~60-100KB Base64
        → ModalRecorte → comprimirImagemBase64(base64, 0.7, 400) → ~30-80KB Base64
            → produto.imagem = base64String
                → localStorage.setItem("catalogo", JSON.stringify({...todos os produtos...}))
                    → 💥 QuotaExceededError
```

### Por que ~7 itens estouram?

| Componente | Tamanho Estimado |
|---|---|
| **1 produto (campos texto)** | ~0.3 KB |
| **1 produto com imagem Base64** | ~30-80 KB + overhead de encoding |
| **7 produtos com imagens** | ~210-560 KB só de imagens |
| **Catálogo cache do banco** | Pode hidratar dezenas/centenas de produtos |
| **Carrinho + Histórico** | Variável |
| **Flags de tutorial, token, etc.** | ~1 KB |

> [!CAUTION]
> O problema real não é só o tamanho individual. É que o `OfflineFirst` **hidrata o cache local** a cada busca no banco remoto — se o usuário escaneou 7 produtos que existiam no banco, foram 7 produtos completos (com URL de imagem) salvos no localStorage. Somado aos produtos cadastrados manualmente (com Base64 pesado), o espaço acabou rápido.

### Limites reais do localStorage:

| Navegador | Limite |
|---|---|
| Chrome (Android/Desktop) | ~5 MB |
| Safari (iOS) | ~5 MB |
| Firefox | ~5-10 MB |

> [!IMPORTANT]
> `localStorage` armazena strings UTF-16. Um caractere Base64 consome **2 bytes** no localStorage. Uma imagem de 50KB em Base64 consome ~100KB de localStorage. O limite efetivo é **~2.5 MB de dados Base64**.

---

## 3. Agravantes

1. **`localStorage.clear()` no `useEffect` do `App.tsx`** — comportamento legacy de debug que resetava o app a cada acesso.
2. **Sem `try-catch` amigável** — o erro propagou sem tratamento UX, gerando crash silencioso.
3. **Sem limite de itens no catálogo local** — o cache crescia sem controle.

---

## 4. Diagnóstico: Por Que localStorage Não Serve Para Imagens?

O `localStorage` foi projetado para armazenar **pequenos dados textuais** (tokens, preferências, flags). Não é um banco de dados. Comparativo:

| Storage | Tipo | Limite | Adequado para imagens? |
|---|---|---|---|
| **localStorage** | Síncrono, string-only | ~5 MB | ❌ Não |
| **sessionStorage** | Síncrono, string-only | ~5 MB | ❌ Não |
| **IndexedDB** | Assíncrono, binary-ready | ~50% do disco (GBs) | ✅ Sim |
| **Cache API (Service Worker)** | Assíncrono, HTTP-based | ~50% do disco | ✅ Sim (para URLs) |
| **OPFS (Origin Private File System)** | Assíncrono, file-based | ~50% do disco | ✅ Sim (moderno) |

---

## 5. Soluções Propostas (Para Discussão)

### Opção A: IndexedDB como Cache de Imagens (Recomendada)
- Mover **apenas imagens** para IndexedDB (armazenar como `Blob`, não string Base64).
- localStorage continua guardando dados textuais leves (carrinho, flags, token).
- Produto no localStorage aponta para chave no IndexedDB: `imagem: "idb://codigo_barras"`.
- **Prós:** Limite de GBs, armazena binário nativo (sem overhead de Base64), compatível com todos os browsers.
- **Contras:** API assíncrona (mas já usamos async/await no repositório).

### Opção B: Migrar Tudo Para IndexedDB (Dexie.js)
- Usar biblioteca `Dexie.js` (wrapper amigável para IndexedDB) como repositório completo.
- Substituir `RepositorioProdutosLocalStorage` inteiro.
- **Prós:** Solução definitiva, busca indexada, sem limite de storage.
- **Contras:** Maior refatoração, nova dependência.

### Opção C: Comprimir Mais + Limitar Cache
- Reduzir qualidade/tamanho da imagem (200px, 40% quality).
- Limitar catálogo local a N produtos mais recentes (LRU cache).
- **Prós:** Mudança mínima de código.
- **Contras:** Não resolve o problema fundamental, apenas adia. Imagens feias.

### Opção D: Não Salvar Imagens Localmente
- Persistir imagens apenas no banco remoto (Supabase Storage ou coluna `bytea`).
- localStorage só guarda dados textuais do produto.
- **Prós:** localStorage fica super leve.
- **Contras:** Precisa de conexão para ver imagens. Depende de Supabase configurado.

---

## 6. Como Apps de Supermercado Resolvem Isso?

Apps como **Cornershop**, **Rappi**, **iFood** e **Mercado Livre**:

1. **Nunca armazenam imagens no cliente.** Imagens ficam em CDN (Cloudflare, CloudFront).
2. **Catálogo é server-side.** O app busca sob demanda via API paginada.
3. **Cache local usa IndexedDB + Service Worker Cache API.**
4. **Carrinho é server-side** (associado a sessão/usuário), com cache local para offline.
5. **Imagens de produto do usuário** são uploaded para Object Storage (S3, Supabase Storage) e substituídas por URL.

---

## 7. Ações Imediatas (Quick Wins)

- [ ] **Remover `localStorage.clear()` do `useEffect`** — causa raiz do "reinício" em produção
- [ ] **Adicionar `try-catch` com UX amigável** no `salvarCatalogo()` — em vez de crash, avisar o usuário
- [ ] **Evitar salvar Base64 bruto em localStorage** — se produto tem imagem remota (URL), nunca substituir por Base64

---

## 8. Decisão Tomada ✅

> **Data da decisão:** 2026-02-19
> **Opção escolhida:** Híbrida (baseada na Opção A, com catálogo completo no IndexedDB)

### Arquitetura Aprovada

```
localStorage (~5MB)                IndexedDB (GBs)
┌──────────────────────┐          ┌──────────────────────────┐
│ carrinho: [          │          │ STORE "produtos": {      │
│   {cod, qtd},        │          │   codigo_barras,         │
│   {cod, qtd},        │          │   descricao, marca,      │
│ ]           ~5KB     │          │   tamanho, preco,        │
│                      │          │   imagem: Blob | URL     │
│ tutorial_visto: true │          │ }                        │
│ token: "SEM-SUSTO-X" │          │                          │
│ tutorial_foto: true  │          │   Store único — simples  │
│                      │          │   Performance OK até     │
│   Nunca estoura      │          │   ~500 itens (nosso caso │
│                      │          │   é ~50-200 por usuário) │
└──────────────────────┘          └──────────────────────────┘
```

> [!NOTE]
> **Store único vs separado:** Foi avaliado separar imagens em store próprio para otimizar leitura, mas a performance de store único só degrada acima de ~500 itens (~250ms). Como nosso cenário é ~50-200 itens por usuário, a simplicidade do store único compensa.

### Regras de armazenamento de imagem

| Fonte da imagem | Cache local (IndexedDB) | PostgreSQL |
|---|---|---|
| **URL de API** | Salva URL como string no campo `imagem` | Salva URL como string (sem mudança) |
| **Foto manual** | Salva como Blob no campo `imagem` | Converte Blob → Base64 na hora do sync |
| **Vinda do banco (Base64)** | Converte Base64 → Blob na chegada | Já está lá (sem mudança) |

### Fluxo de hidratação (PostgreSQL → Cache Local)

```
PostgreSQL responde com produto (imagem = Base64 ou URL)
    │
    ├─ Se Base64 → converte para Blob → salva no campo "imagem" do produto
    │
    ├─ Se URL → mantém como string no campo "imagem"
    │
    └─ Salva produto completo no store "produtos" (IndexedDB)
```

### O que NÃO muda

- Schema do PostgreSQL (`imagem TEXT` continua igual)
- API Serverless (continua enviando/recebendo strings)
- Fluxo de busca em cascata
- `RepositorioCarrinhoLocalStorage` (carrinho continua no localStorage)
- `RepositorioHistoricoLocalStorage` (histórico continua no localStorage)

### O que MUDA

- `RepositorioProdutosLocalStorage` → `RepositorioProdutosIndexedDB`
- Imagens de foto manual salvas como `Blob` (binário) em vez de string Base64
- Para exibir imagem Blob: `URL.createObjectURL(blob)` em vez de string direta
