# Walkthrough - Refatoracao Auditoria Telemetria

> **Ultima atualização:** 2026-03-08
> **Status:** Implementado e validado
> **Tipo:** Refatoracao arquitetural
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

O projeto registrava leituras de produto (`SELECT`) em `auditoria_logs` no endpoint de busca por GTIN.

A intencao de produto continuava valida: preservar sinais de interesse do usuário para futuros usos como:

- recomendacoes
- preferencia de produtos
- recorrencia de interesse
- curadoria de catalogo

O problema era arquitetural: a implementação misturava **auditoria operacional** com **telemetria de comportamento**.

---

## 2. Problema Raiz

O endpoint `GET /api/produtos/[código]` transformava leitura em leitura + escrita de auditoria.

Isso criava acoplamento indevido entre duas camadas com objetivos diferentes:

- **Auditoria:** imutabilidade, rastreabilidade, seguranca, investigacao
- **Telemetria:** comportamento, produto, agregacao, sinais analiticos, recomendação

Como consequencia, o scanner e a busca de catalogo pagavam o custo de uma escrita sincronizada em uma tabela inadequada para esse tipo de sinal.

---

## 3. Solução Implementada

Foi separada formalmente a responsabilidade entre:

- `auditoria_logs`
- `telemetria_produtos`

### Regra aplicada

`auditoria_logs` permanece reservada para eventos de interesse operacional, de seguranca ou de rastreabilidade forte.

Eventos de comportamento do usuário passaram a ser registrados em uma trilha propria de telemetria, com desenho orientado a:

- escalabilidade
- agregacao
- análise futura
- anonimização compativel com a proposta do produto

---

## 4. O Que Foi Alterado

### Infraestrutura de dados

- criada a migration `010_cria_tabela_telemetria_produtos.sql`
- criada a tabela `telemetria_produtos` com agregacao diaria por:
  - `data_referencia`
  - `evento`
  - `origem`
  - `codigo_barras`
  - `usuario_id`
  - `ip_hash`
- a telemetria inicial usa `UPSERT` com incremento de `quantidade`, reduzindo explosao bruta de linhas

### Backend

- criado o helper `api/_lib/telemetria_produtos.ts`
- removido o `INSERT` manual de `SELECT` em `auditoria_logs` do endpoint `GET /api/produtos/[código]`
- o endpoint passou a registrar:
  - `produto_encontrado`
  - `produto_nao_encontrado`
- a origem inicial foi padronizada como `api_produtos_get`

### Auditoria operacional preservada

- o trigger de `auditoria_logs` para `INSERT`, `UPDATE` e `DELETE` em `produtos` foi mantido
- a refatoracao alterou apenas a captura indevida de leitura

---

## 5. Escopo Entregue

- separação entre auditoria de escrita e telemetria de leitura no endpoint de produto
- telemetria agregada e anonima para comportamento de consulta
- validação dos ramos `produto_encontrado` e `produto_nao_encontrado`

### Fora do escopo nesta iteracao

- engine completa de recomendação
- dashboard analitico final
- personalizacao por usuário autenticado
- UI de analytics
- expansao para eventos de carrinho e compra

---

## 6. Eventos de Telemetria Ativados

Os eventos ativados nesta primeira iteracao foram:

- `produto_encontrado`
- `produto_nao_encontrado`

Eventos mapeados para etapas futuras:

- `produto_escaneado`
- `produto_adicionado_carrinho`
- `produto_removido_carrinho`
- `compra_finalizada_com_item`

---

## 7. Validação Executada

### Validação técnica

- migration `010` aplicada com sucesso no banco local
- build de produção validado com sucesso no fluxo Docker oficial

Comandos executados:

```bash
docker compose -f .docker/compose.yaml exec backend python scripts/init_db.py
docker compose -f .docker/compose.yaml exec app npm run build
```

### Validação funcional

Validação manual no ambiente Docker local:

- `GET /api/produtos/0000000000000` retornou `404` e gerou `produto_nao_encontrado` em `telemetria_produtos`
- `GET /api/produtos/000000000000001` retornou `200` e gerou `produto_encontrado` em `telemetria_produtos`
- a consulta a `auditoria_logs` mostrou que o ultimo `SELECT` em `produtos` permaneceu anterior a refatoracao validada, sem nova escrita de leitura apos a mudanca

---

## 8. Criterios Atendidos

- o endpoint de produto deixou de gravar `SELECT` em `auditoria_logs`
- existe agora uma trilha separada para sinais de comportamento
- a coleta inicial ficou agregada e anonima
- o desenho permaneceu compativel com a migração para Supabase em produção

---

## 9. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- `api/produtos/[código].ts`
- `api/_lib/telemetria_produtos.ts`
- `infra/migrations/010_cria_tabela_telemetria_produtos.sql`

---

## 10. Resultado

O bloqueador de separação entre auditoria operacional e telemetria de comportamento foi implementado com uma primeira iteracao segura, incremental e validada no ambiente local oficial do projeto.
