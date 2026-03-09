# Walkthrough - Idempotência Confirmação Pagamento

> **Ultima atualização:** 2026-03-08
> **Status:** Implementado e validado
> **Tipo:** Refatoracao de robustez operacional
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

O fluxo atual de confirmação de pagamento gera token premium a partir de um `pagamento_id`.

Na pratica, a confirmação do mesmo pagamento pode chegar mais de uma vez por motivos normais de sistemas distribuidos:

- retry do frontend
- clique repetido do usuário
- nova tentativa apos timeout de rede
- repeticao de chamada em polling ou reprocessamento
- reexecucao em ambiente serverless

O sistema já possui protecao de unicidade no banco via `pagamento_id`, o que evita duplicidade de token persistido.

O problema restante não e de integridade do dado puro; e de **comportamento idempotente e previsivel da aplicacao**.

---

## 2. Problema Raiz

Hoje o fluxo segue a lógica:

1. verificar se já existe token para o `pagamento_id`
2. se não existir, gerar token
3. persistir o token

Esse desenho possui janela de corrida.

Duas requisicoes concorrentes podem ler o estado "não existe token" antes que a primeira persistencia seja concluída.

Resultado possivel:

- a primeira requisicao grava com sucesso
- a segunda colide no indice único
- o usuário recebe erro técnico em um fluxo de negocio legitimo

---

## 3. Solução Implementada

O sistema agora trata confirmações repetidas para o mesmo `pagamento_id` como comportamento esperado de domínio, e não como erro inesperado de infraestrutura.

### Regra de negocio implementada

Para um mesmo `pagamento_id`:

- nunca mais de um token persistido
- nenhuma confirmação legitima deve falhar com erro 500 por corrida
- chamadas repetidas devem retornar um estado de negocio consistente

---

## 4. O Que Foi Alterado

### Backend

- revisar a confirmação automática de pagamento
- revisar a aprovação manual quando aplicavel
- garantir comportamento consistente para `pagamento_id` repetido
- tratar colisao como estado de domínio e não como erro generico
- alinhar a resposta do backend para chamadas repetidas

- o fluxo de confirmação saiu do modelo fragil `SELECT -> INSERT` como barreira de concorrência e passou a usar a unicidade do banco como arbitro final
- conflitos de unicidade (`23505`) passaram a ser tratados como estado de domínio `token_existente`
- o fluxo de aprovação manual foi alinhado com a mesma regra
- o modo `mockado` passou a reutilizar a mesma persistencia idempotente do fluxo real, permitindo validação local de verdade

### Frontend

- foi adicionado um guard simples no `App.tsx` para ignorar confirmações duplicadas do mesmo `pagamento_id` enquanto uma requisicao ainda esta em andamento

---

## 5. Comportamento Final

### Primeira confirmação valida

- pagamento aprovado
- token gerado
- resposta `201`

### Confirmação repetida do mesmo pagamento

- nenhum novo token criado
- backend responde `200`
- o caso e tratado como estado conhecido

### Colisao de concorrência

- a aplicacao não deve estourar erro interno para o usuário
- o fluxo deve convergir para:
  - token gerado agora
  - ou token já existente para aquele pagamento

---

## 6. Ponto de Atencao de UX

Existe uma nuance importante:

- o banco persiste `token_hash`
- o texto puro do token não pode ser reconstruido depois

Isso significa que chamadas repetidas concorrentes nem sempre poderao receber novamente o token em texto puro.

Portanto, o sistema precisa assumir explicitamente um comportamento para o caso:

- "token já existente"

Esse estado deve ser tratado como parte legitima do fluxo.

---

## 7. Validação Executada

- um mesmo `pagamento_id` nunca gera mais de um token persistido
- chamadas repetidas retornam comportamento consistente
- concorrência não explode erro técnico para o usuário
- o backend continua simples e compreensivel
- a solução permanece proporcional ao porte da aplicacao

### Teste automatizado de concorrência

Foi criado o script:

- `scripts/testar_concorrencia_pagamento.ts`

O script roda no container `app` e:

- gera pagamentos mockados até encontrar um aprovado
- dispara duas confirmações em paralelo para o mesmo `pagamento_id`
- consulta a tabela `tokens`
- falha se houver `500`, mais de um token persistido, ausencia de `201` ou ausencia de `200`

Comando utilizado na validação:

```bash
docker compose -f .docker/compose.yaml exec app npx tsx scripts/testar_concorrencia_pagamento.ts
```

Resultado observado na validação real:

- 1 resposta `201` com token novo
- 1 resposta `200` com `token_ja_existente`
- 1 único token persistido para o `pagamento_id`
- nenhum erro `500`

---

## 8. Validação Local e Higiene de Teste

### Validação local com gateway mockado

O gateway `mockado` foi ajustado para continuar simulando a aprovação do pagamento, mas reutilizar o mesmo caminho real de persistencia idempotente de token.

Isso permite testar localmente:

- primeira confirmação do mesmo `pagamento_id` gerando token novo
- segunda confirmação retornando `token_existente`
- ausencia de erro 500 em repeticao legitima

### Identificacao dos pagamentos mockados

Os `pagamento_id` do gateway mockado seguem o padrão:

- `PIX-MOCKADO_<timestamp>_SEM-SUSTO`

Esse padrão permite rastrear e limpar facilmente os registros de teste no banco local.

### Script utilitario de limpeza

Foi criado o utilitario:

- `scripts/remove_pagamentos_mockados.py`

Objetivo:

- remover da tabela `tokens` os registros de pagamentos mockados
- permitir limpeza manual ou encaixe em fluxo automatizado de teste local

Uso:

```bash
python scripts/remove_pagamentos_mockados.py
```

### Procedimento minimo de validação

1. gerar um pagamento no fluxo mockado
2. confirmar o pagamento aprovado uma primeira vez
3. repetir a confirmação para o mesmo `pagamento_id`
4. validar:
   - primeira resposta com token novo
   - segunda resposta com `token_ja_existente`
   - apenas um registro persistido na tabela `tokens`
5. executar o script de limpeza quando necessário

---

## 9. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- `api/_lib/pagamentos/orquestrador.ts`
- `api/pagamentos/confirmar.ts`
- `api/pagamentos/manual/aprovar.ts`
- `scripts/remove_pagamentos_mockados.py`
- `scripts/testar_concorrencia_pagamento.ts`

---

## 10. Resultado

O bloqueador de concorrência/idempotência em pagamento foi implementado e validado localmente com teste automatizado concorrente no ambiente Docker oficial do projeto.
