# Refatoração do Fluxo de Pagamento

## Visão Geral

A lógica de processamento de pagamentos, incluindo a comunicação com provedores como Mercado Pago e PagBank, bem como opções de mock para testes, foi centralizada no backend.

##.Alterações Realizadas

- **Remoção de Factories no Frontend:** Arquivos locais e lógica de decisão sobre provedores de pagamento (`fabrica.ts`, `mock.ts`, `mercado-pago.ts`, etc.) foram removidos da pasta `services/pagamento` do frontend.
- **Cliente API Unificado:** Criado o `services/api-pagamento.ts` para que o frontend apenas consuma os endpoints `/api/pagamentos/pix` e `/api/pagamentos/status`, sem precisar conhecer a complexidade dos provedores.
- **Modais Atualizados:** `ModalPagamento.tsx` e `Premium.tsx` foram atualizados para utilizar os novos clientes de API em vez das antigas classes factory de frontend.

## Impacto e Benefícios

- O código frontend ficou consideravelmente mais leve, recebendo apenas dados prontos para exibição (como QR Codes ou Status de pagamentos).
- A responsabilidade de integração com chaves privadas e lógica de negócio de pagamento agora reside exlusivamente no backend, aumentando o isolamento e segurança.
