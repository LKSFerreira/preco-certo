# Orquestrador Manual de Pagamentos

## Contexto do problema

O fluxo de pagamento estava vulnerável em dois pontos críticos:

- **Acoplamento indevido no backend:** a confirmação consultava diretamente o host do Mercado Pago, mesmo quando o gateway ativo não era Mercado Pago.
- **Divergência entre status técnico e status de domínio:** o frontend esperava estados padronizados (`aprovado`, `falha`, `pendente`), mas cada provedor retornava seu status nativo.

Além disso, o cenário de failover manual (`nubank_failover`) não tinha uma trilha de operação persistida para suporte humano aprovar comprovante com rastreabilidade.

## Objetivo da refatoração

Implementar um desenho robusto para evolução futura:

- **Orquestrador central** para decisão de fluxo.
- **Estados de domínio padronizados** independentes do gateway.
- **Fila manual persistida** para aprovações operacionais.
- **Compatibilidade com mock** para QA visualizar erro e sucesso sem regressão visual.

## Arquitetura implementada

### 1) Camada de orquestração

Arquivo: `api/_lib/pagamentos/orquestrador.ts`

Responsabilidades centralizadas:

- Normalizar status externos para estados de domínio.
- Definir modo de confirmação (`automatico` ou `manual`) por gateway ativo.
- Criar PIX via fábrica de gateways sem vazar detalhes do provedor.
- Confirmar pagamento com idempotência por `pagamento_id`.
- Coordenar fila manual (`solicitar` e `aprovar`) com geração de token.

Estados de domínio consolidados:

- `pendente`
- `aprovado`
- `falha`
- `expirado`
- `pendente_manual`

### 2) Endpoints desacoplados do provedor

Arquivos:

- `api/pagamentos/pix.ts`
- `api/pagamentos/status.ts`
- `api/pagamentos/confirmar.ts`

Mudança principal:

- As rotas deixaram de falar com gateway específico diretamente e passaram a delegar ao orquestrador.
- A rota de confirmação removeu dependência fixa de Mercado Pago e passou a responder por resultado de domínio.

### 3) Fila manual de aprovação

Arquivos:

- `api/pagamentos/manual/solicitar.ts`
- `api/pagamentos/manual/aprovar.ts`
- `infra/migrations/009_cria_tabela_pagamentos_manuais.sql`

Comportamento:

- `manual/solicitar` registra ou atualiza uma solicitação de comprovante.
- `manual/aprovar` exige header `X-API-Secret` e gera token premium ao aprovar.
- Idempotência preservada quando token já existe para o `pagamento_id`.

Tabela criada: `pagamentos_manuais`

Campos-chave:

- `pagamento_id` (único)
- `plano_id`
- `nome_contato`
- `mensagem`
- `status` (`pendente`, `aprovado`, `rejeitado`)
- `aprovado_por`, `aprovado_em`
- `token_hash`

## Integração com frontend

### 1) Cliente de API

Arquivo: `services/api-pagamento.ts`

Adições:

- `apiSolicitarAprovacaoManual(...)`
- Tipagem de payload e resposta para fila manual.

### 2) Modal de pagamento manual

Arquivo: `components/ModalPagamento.tsx`

Ajustes no modo manual:

- Antes de abrir WhatsApp, o frontend registra solicitação no backend.
- Mensagem segue o formato operacional:
  - "Olá, meu nome..."
  - "Realizei o pagamento do plano X na data Y às Z..."
- Feedback de erro para caso de falha no registro da fila.
- Preservação da experiência visual existente (animações de sucesso/falha não foram removidas).

## Regra de negócio do mock (QA)

O gateway `mockado` foi mantido com alternância:

- tentativa ímpar: `falha`
- tentativa par: `aprovado`

Validação aplicada:

- confirmação mock agora respeita status atual antes de liberar token.
- evita geração de token quando status mock está em falha.

## Segurança e operação

### `X-API-Secret`

- Endpoint `manual/aprovar` protegido por segredo de ambiente (`API_SECRET`).
- `.env.example` atualizado para explicitar o uso operacional desse header.

### Migrations

- A rota manual depende da migration `009`.
- Sem migration aplicada, o endpoint retorna erro de relação inexistente.
- Fluxo operacional exige execução de inicialização/migrations no backend.

## Benefícios obtidos

- **Desacoplamento real de gateway** no backend.
- **Padrão único de estado** entre backend e frontend.
- **Rastreabilidade operacional** para pagamentos manuais.
- **Base pronta para múltiplos provedores** sem condicionais espalhadas.
- **Fluxo de QA previsível** para testar tela de falha e tela de sucesso.

## Limitações atuais e próximos passos

- A aprovação manual ainda depende de operação humana externa (WhatsApp + backoffice).
- Recomendado criar painel administrativo mínimo para listar pendências de `pagamentos_manuais`.
- Recomendado registrar auditoria de aprovação manual (IP, agente, motivo) em tabela dedicada.
