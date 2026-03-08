# Roadmap de Mock para Ativacao de Token

## Contexto

Durante os testes do fluxo premium, surgiu a necessidade de validar o comportamento da modal de ativacao com cenarios previsiveis:

- 1a tentativa deve falhar.
- 2a tentativa deve ter sucesso.

A demanda foi adiada para nao interromper o fluxo atual, mas ficou formalizada para implementacao futura.

## Decisao Documentada

Foi definido registrar no roadmap um item especifico para mock de QA no endpoint `POST /api/tokens/ativar`, com chave de ambiente e sem impacto no comportamento real quando desativado.

## Escopo Registrado no Roadmap

- Flag de ambiente: `MOCK_ATIVACAO_TOKEN=true` (somente testes).
- Reutilizar a tabela existente `tentativas_ativacao`.
- Controle por `token_hash_tentado + fingerprint_hash`.
- Regra de simulacao:
  - 1a tentativa: falha.
  - 2a tentativa: sucesso.
- Garantia de isolamento:
  - com flag desligada, fluxo real segue inalterado.

## Resultado

A demanda ficou rastreavel no roadmap como pendencia tecnica, pronta para execucao futura sem rediscussao de escopo.
