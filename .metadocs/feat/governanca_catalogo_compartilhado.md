# Feature Plan - Governanca Catalogo Compartilhado

> **Ultima atualizacao:** 2026-03-08
> **Status:** Em planejamento
> **Tipo:** Arquitetura de dados e sincronizacao
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

Hoje o unico banco PostgreSQL do projeto existe apenas localmente. Em producao, o app opera com:

- `IndexedDB` como catalogo local do usuario
- `localStorage` para partes especificas do estado
- APIs remotas complementares

A introducao de um PostgreSQL remoto compartilhado cria uma mudanca importante:

o projeto passa a ter, pela primeira vez, um **catalogo compartilhado oficial**.

Isso exige definir previamente a governanca do dado para evitar que dados locais errados, incompletos ou inconsistentes contaminem o catalogo oficial.

---

## 2. Decisao Arquitetural

### Decisao

Separar formalmente:

- `produtos`
- `produtos_adicionados_pelo_usuario`

### Papel de cada estrutura

#### `produtos`

Catalogo compartilhado oficial.

- fonte principal de leitura
- usado no `GET` de produtos
- representa o dado consolidado e confiavel

#### `produtos_adicionados_pelo_usuario`

Camada intermediaria de staging/inbox.

- recebe dados sincronizados do catalogo local do usuario
- nao representa dado oficial
- serve como insumo para curadoria e promocao futura

---

## 3. Regra Central de Governanca

O dado local do usuario **nao deve** ser promovido automaticamente para o catalogo compartilhado oficial sem passar por regras de governanca.

### Consequencia direta

Sincronizar com o backend **nao** significa publicar em `produtos`.

Sincronizar significa, no maximo:

- enviar para staging
- aguardar curadoria
- promover apenas quando a regra permitir

---

## 4. Modelo de Leitura e Escrita

### Leitura

- o `GET` principal de produtos deve consultar a tabela `produtos`

### Escrita local

- o usuario continua formando seu catalogo no `IndexedDB`

### Escrita remota

- quando houver sincronizacao, os dados vao para `produtos_adicionados_pelo_usuario`
- a escrita remota nao atualiza `produtos` diretamente

---

## 5. Sync Automatico

### Decisao

O sync automatico **nao e obrigatorio** para esta arquitetura existir.

Ele deve ser tratado como capacidade opcional e implementado apenas se fizer sentido para o projeto naquele momento.

### Motivo

O projeto pode perfeitamente adotar a governanca do catalogo compartilhado sem precisar ativar sincronizacao automatica.

Assim, a decisao de nao implementar sync automatico no futuro **nao gera debito tecnico**.

### Se for implementado

O sync automatico deve ocorrer:

- em segundo plano
- sem bloquear a abertura do app
- apenas se estiver online
- respeitando janela minima, por exemplo `1 dia` desde a ultima sincronizacao

### O que evitar

- sincronizacao rigida no startup critico
- escrita remota constante a cada scan
- promocao automatica direta para o catalogo oficial

---

## 6. Curadoria

Os dados em `produtos_adicionados_pelo_usuario` podem ser analisados por um fluxo de curadoria.

### Curadoria futura possivel

- analise de imagem com IA
- verificacao de coerencia entre imagem e:
  - descricao
  - marca
  - tamanho

### Regra importante

Preco nao entra como criterio de consolidacao do catalogo oficial, porque e uma informacao contextual e relativa.

---

## 7. Regra de Promocao para `produtos`

### Regra aprovada

Um item vindo de `produtos_adicionados_pelo_usuario` so pode promover dado para `produtos` quando:

- o produto ainda nao existe em `produtos`

ou

- o produto existe, mas possui campos ausentes (`null`) que podem ser enriquecidos

### Regra de protecao

Nao sobrescrever campos ja consolidados do catalogo oficial.

### Exemplos de campos candidatos a enriquecimento

- `marca`
- `tamanho`
- `imagem`

### Exemplo de campo que nao deve ser promovido para consolidacao

- `preco`

---

## 8. Ponto de Atencao com Imagens

Imagens exigem cuidado especial.

Sincronizacao de imagem nao deve ser tratada como equivalente a sincronizacao de texto.

Riscos:

- payload grande
- aumento de storage
- custo em banco remoto
- complexidade de curadoria

### Diretriz

A arquitetura deve prever que:

- metadados textuais e imagens podem ter estrategias diferentes
- o sync inicial pode ser mais conservador com imagens

---

## 9. Alternativas Avaliadas

### Alternativa A - Usuario sincroniza direto para `produtos`

**Vantagens**

- simples de implementar
- catalogo cresce rapido

**Desvantagens**

- alto risco de contaminar o catalogo oficial
- dificulta governanca e qualidade
- conflito direto com a proposta do projeto

**Decisao:** descartada

### Alternativa B - Nao permitir nenhuma escrita remota oriunda do catalogo local

**Vantagens**

- risco minimo para o catalogo oficial

**Desvantagens**

- impossibilita enriquecimento progressivo do catalogo compartilhado
- perde oportunidade de aproveitar dados coletados pelo uso real

**Decisao:** descartada

### Alternativa C - Staging + curadoria + promocao controlada

**Vantagens**

- preserva qualidade do catalogo oficial
- permite evolucao futura
- desacopla sincronizacao de consolidacao

**Desvantagens**

- exige desenho de governanca e fluxo de curadoria

**Decisao:** aprovada

---

## 10. Plano de Implementacao Proposto

### Fase 1 - Modelo de dados

- definir tabela `produtos_adicionados_pelo_usuario`
- definir campos minimos
- definir status/etapas de curadoria, se necessario

### Fase 2 - Regra de escrita remota

- garantir que o `GET` continue vindo de `produtos`
- garantir que escrita de sync va apenas para staging

### Fase 3 - Regra de promocao

- definir criterios de promocao para `produtos`
- impedir sobrescrita de dado consolidado
- permitir apenas enriquecimento de campos ausentes ou criacao de novo produto

### Fase 4 - Sync opcional

- decidir se o sync automatico sera implementado
- se sim, executar em segundo plano
- aplicar frequencia minima entre sincronizacoes

---

## 11. Criterios de Sucesso

- `produtos` permanece como catalogo oficial de leitura
- dados do usuario nao escrevem direto no catalogo oficial
- existe camada intermediaria de governanca
- sync automatico continua opcional
- a arquitetura nao vira debito tecnico caso o sync automatico nao seja implementado

---

## 12. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- [postgres_gerenciado_supabase.md](./postgres_gerenciado_supabase.md)
- `repositorios/indexed-db.ts`
- `repositorios/offline-first.ts`
- `api/produtos/[codigo].ts`

---

## 13. Destino Pos-Implementacao

Apos a implementacao, este mesmo arquivo deve ser movido para:

- `.metadocs/walkthrough/governanca_catalogo_compartilhado.md`

Depois do movimento:

- o conteudo deve ser ajustado de plano para walkthrough
- a referencia deve ser adicionada ao `historico.md`
- a feature deve ser marcada como concluida na documentacao correspondente
