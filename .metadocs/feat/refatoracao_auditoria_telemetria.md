# Feature Plan - Refatoracao Auditoria Telemetria

> **Ultima atualizacao:** 2026-03-08
> **Status:** Em planejamento
> **Tipo:** Refatoracao arquitetural
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

O projeto hoje registra leituras de produto (`SELECT`) em `auditoria_logs` no endpoint de busca por GTIN.

A intencao original e valida do ponto de vista de produto: preservar sinais de interesse do usuario para, no futuro, sustentar:

- recomendacoes
- preferencia de produtos
- recorrencia de interesse
- curadoria de catalogo

O problema identificado e arquitetural: o mecanismo atual mistura **auditoria operacional** com **telemetria de comportamento**.

---

## 2. Problema Raiz

Hoje a aplicacao trata um evento de consulta/scan como se fosse auditoria de seguranca/rastreabilidade.

Isso gera acoplamento indevido entre duas camadas com objetivos diferentes:

- **Auditoria:** imutabilidade, rastreabilidade, seguranca, investigacao
- **Telemetria:** comportamento, produto, agregacao, sinais analiticos, recomendacao

Como consequencia, o fluxo critico do scanner passa a pagar o custo de uma escrita sincronizada que nao e essencial para a resposta ao usuario.

---

## 3. Decisao Arquitetural

### Decisao

Separar formalmente:

- `auditoria_logs`
- `eventos_produto` ou estrutura equivalente de telemetria

### Regra nova

`auditoria_logs` deve guardar apenas eventos de interesse operacional, de seguranca ou de rastreabilidade forte.

Eventos de comportamento do usuario devem ir para uma trilha propria de telemetria, com desenho orientado a:

- escalabilidade
- retenção
- agregacao
- analise futura
- anonimização compativel com a proposta do produto

---

## 4. Alternativas Avaliadas

### Alternativa A - Manter `SELECT` em `auditoria_logs`

**Vantagens**

- zero mudanca conceitual imediata
- historico bruto comecando agora

**Desvantagens**

- aumenta latencia do scanner
- transforma leitura em leitura + escrita
- polui o conceito de auditoria
- escala mal em ambiente gerenciado/free tier
- dificulta retenção e consulta analitica

**Decisao:** descartada

### Alternativa B - Remover log de `SELECT` sem substituto

**Vantagens**

- simplifica imediatamente o endpoint
- reduz custo e escrita

**Desvantagens**

- perde completamente o sinal de comportamento
- inviabiliza aprendizado futuro sobre interesse por produto

**Decisao:** descartada

### Alternativa C - Criar trilha propria de telemetria

**Vantagens**

- preserva o objetivo de produto
- separa responsabilidade corretamente
- permite regras proprias de retenção e agregacao
- prepara base para recomendacao e analytics

**Desvantagens**

- exige refatoracao
- exige definicao de schema e estrategia de ingestao

**Decisao:** aprovada

---

## 5. Objetivo da Refatoracao

Substituir a captura impropria de `SELECT` em `auditoria_logs` por uma arquitetura dedicada de telemetria de produto, sem degradar o fluxo de scanner e sem perder o potencial estrategico dos dados.

---

## 6. Escopo Proposto

### Dentro do escopo

- revisar o papel de `auditoria_logs`
- remover a auditoria de leitura do endpoint de produto
- definir tabela ou mecanismo de telemetria de produto
- definir eventos minimos relevantes
- definir payload minimo e politica de anonimização
- decidir se a telemetria inicial sera:
  - sincrona
  - assincrona
  - agregada
  - amostrada

### Fora do escopo

- engine completa de recomendacao
- dashboard analitico final
- personalizacao por usuario autenticado
- UI de analytics

---

## 7. Eventos Candidatos

Os sinais abaixo sao mais ricos do que `SELECT` isolado:

- `produto_escaneado`
- `produto_encontrado`
- `produto_nao_encontrado`
- `produto_adicionado_carrinho`
- `produto_removido_carrinho`
- `compra_finalizada_com_item`

### Observacao

Nem todos precisam entrar na primeira iteracao.

A primeira fase pode capturar apenas:

- `produto_escaneado`
- `produto_adicionado_carrinho`

Isso ja cria uma base muito melhor de interesse vs conversao.

---

## 8. Riscos

### Tecnicos

- criar uma telemetria detalhada demais e reintroduzir custo excessivo
- acoplar a coleta de evento ao tempo de resposta do scanner
- desenhar schema cedo demais sem validar o uso real

### Produto

- coletar eventos demais com pouco valor pratico
- interpretar scan como preferencia definitiva

### Operacionais

- crescimento descontrolado da tabela de eventos
- ausencia de politica de retenção

---

## 9. Principios de Implementacao

- nao degradar o tempo de resposta do scanner
- manter anonimização coerente com a proposta LGPD do projeto
- separar auditoria de analytics
- preferir desenho incremental
- comecar com poucos eventos de alto valor

---

## 10. Plano de Implementacao Proposto

### Fase 1 - Alinhamento de modelo

- definir nome oficial da trilha de telemetria
- definir eventos iniciais
- definir campos minimos por evento
- definir politica inicial de retenção

### Fase 2 - Infraestrutura de dados

- criar migration da tabela de telemetria
- definir indices minimos
- validar custo esperado de escrita

### Fase 3 - Refatoracao do endpoint de produto

- remover `SELECT` de `auditoria_logs`
- manter apenas auditoria coerente com operacoes sensiveis
- publicar evento de telemetria segundo o modelo aprovado

### Fase 4 - Expansao controlada

- integrar evento de adicao ao carrinho
- validar utilidade do dado
- medir volume e qualidade antes de novos eventos

---

## 11. Criterios de Sucesso

- o endpoint de produto deixa de gravar `SELECT` em `auditoria_logs`
- existe uma trilha separada para sinais de comportamento
- a nova coleta nao degrada perceptivelmente o scanner
- os dados coletados servem para responder perguntas de produto no futuro
- o desenho continua compativel com migracao para Supabase em producao

---

## 12. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- `api/produtos/[codigo].ts`
- `api/_lib/banco.ts`

---

## 13. Destino Pos-Implementacao

Apos a implementacao, este mesmo arquivo deve ser movido para:

- `.metadocs/walkthrough/refatoracao_auditoria_telemetria.md`

Depois do movimento:

- o conteudo deve ser ajustado de plano para walkthrough
- a referencia deve ser adicionada ao `historico.md`
- a feature deve ser marcada como concluida na documentacao correspondente
