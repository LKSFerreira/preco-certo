# Orquestrador de Pagamentos + Fila Manual

## Contexto
- O frontend nao pode validar automaticamente pagamento feito em chave PIX estatica (Nubank failover).
- O backend precisava parar de acoplar confirmacao ao host do Mercado Pago.

## Decisao de arquitetura
- Centralizar regras de pagamento em `api/_lib/pagamentos/orquestrador.ts`.
- Normalizar status de dominio para: `pendente`, `aprovado`, `falha`, `expirado`, `pendente_manual`.
- Tratar gateways com dois modos de confirmacao:
  - `automatico`: polling + confirmacao automatica.
  - `manual`: fila de comprovantes + aprovacao humana.

## Fluxo manual
1. Front cria PIX.
2. Em `nubank_failover`, backend retorna `modo_confirmacao: manual`.
3. Usuario envia comprovante no WhatsApp.
4. Front registra solicitacao em `POST /api/pagamentos/manual/solicitar`.
5. Backoffice aprova em `POST /api/pagamentos/manual/aprovar` com `X-API-Secret`.
6. Backend gera token premium e marca solicitacao como aprovada.

## Persistencia
- Nova tabela `pagamentos_manuais` (migration `009`).
- Campos principais: `pagamento_id`, `plano_id`, `nome_contato`, `mensagem`, `status`, `aprovado_por`, `token_hash`.

## Beneficios
- Remocao do acoplamento entre endpoint de confirmacao e provedor especifico.
- Idempotencia preservada por `tokens.pagamento_id`.
- Suporte operacional para cenarios sem webhook/consulta automatica.
