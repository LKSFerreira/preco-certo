# Feature Plan - Idempotencia Confirmacao Pagamento

> **Ultima atualizacao:** 2026-03-08
> **Status:** Em planejamento
> **Tipo:** Refatoracao de robustez operacional
> **Origem:** Debate derivado de `roadmap_supabase_prontidao_producao.md`

---

## 1. Contexto

O fluxo atual de confirmacao de pagamento gera token premium a partir de um `pagamento_id`.

Na pratica, a confirmacao do mesmo pagamento pode chegar mais de uma vez por motivos normais de sistemas distribuidos:

- retry do frontend
- clique repetido do usuario
- nova tentativa apos timeout de rede
- repeticao de chamada em polling ou reprocessamento
- reexecucao em ambiente serverless

O sistema ja possui protecao de unicidade no banco via `pagamento_id`, o que evita duplicidade de token persistido.

O problema restante nao e de integridade do dado puro; e de **comportamento idempotente e previsivel da aplicacao**.

---

## 2. Problema Raiz

Hoje o fluxo segue a logica:

1. verificar se ja existe token para o `pagamento_id`
2. se nao existir, gerar token
3. persistir o token

Esse desenho possui janela de corrida.

Duas requisicoes concorrentes podem ler o estado "nao existe token" antes que a primeira persistencia seja concluida.

Resultado possivel:

- a primeira requisicao grava com sucesso
- a segunda colide no indice unico
- o usuario recebe erro tecnico em um fluxo de negocio legitimo

---

## 3. Decisao Arquitetural

### Decisao

Implementar idempotencia de confirmacao de pagamento de forma **simples, atomica e sem overengineering**.

### Diretriz

O sistema deve tratar confirmacoes repetidas para o mesmo `pagamento_id` como comportamento esperado de dominio, e nao como erro inesperado de infraestrutura.

### Regra de negocio desejada

Para um mesmo `pagamento_id`:

- nunca mais de um token persistido
- nenhuma confirmacao legitima deve falhar com erro 500 por corrida
- chamadas repetidas devem retornar um estado de negocio consistente

---

## 4. Alternativas Avaliadas

### Alternativa A - Manter fluxo atual com `SELECT` seguido de `INSERT`

**Vantagens**

- implementacao simples
- baixa mudanca estrutural imediata

**Desvantagens**

- possui janela de corrida
- depende de erro tecnico para arbitrar concorrencia
- experiencia ruim exatamente no fluxo de pagamento

**Decisao:** descartada

### Alternativa B - Sistema completo de `idempotency keys`

**Vantagens**

- modelo robusto e classico de APIs de pagamento
- muito controle de replay

**Desvantagens**

- complexo demais para o porte atual do projeto
- adiciona infraestrutura e regras que ainda nao sao necessarias

**Decisao:** descartada por excesso de complexidade

### Alternativa C - Locking/transacao pesada no fluxo todo

**Vantagens**

- controle explicito de concorrencia

**Desvantagens**

- mais complexo de manter
- maior risco de acoplamento e erro operacional
- pouco proporcional ao volume esperado do projeto

**Decisao:** descartada como solucao primaria

### Alternativa D - Operacao atomica guiada pelo banco com resposta de dominio consistente

**Vantagens**

- resolve o problema real com simplicidade
- usa a unicidade do banco a favor da aplicacao
- reduz risco sem hipercomplexidade

**Desvantagens**

- exige cuidado no desenho da resposta para token ja processado
- precisa alinhar UX do caso "token ja existente"

**Decisao:** aprovada

---

## 5. Objetivo da Refatoracao

Transformar o fluxo de confirmacao de pagamento em uma operacao idempotente do ponto de vista do negocio, eliminando falhas tecnicas por concorrencia normal.

---

## 6. Escopo Proposto

### Dentro do escopo

- revisar a confirmacao automatica de pagamento
- revisar a aprovacao manual quando aplicavel
- garantir comportamento consistente para `pagamento_id` repetido
- tratar colisao como estado de dominio e nao como erro generico
- alinhar a resposta do backend para chamadas repetidas

### Fora do escopo

- plataforma completa de `idempotency keys`
- mensageria/fila dedicada
- redesenho total do fluxo premium
- mudanca de modelo de token anonimo

---

## 7. Comportamento Esperado

### Primeira confirmacao valida

- pagamento aprovado
- token gerado
- resposta de sucesso normal

### Confirmacao repetida do mesmo pagamento

- nenhum novo token criado
- backend responde de forma previsivel
- o caso e tratado como estado conhecido

### Colisao de concorrencia

- a aplicacao nao deve estourar erro interno para o usuario
- o fluxo deve convergir para:
  - token gerado agora
  - ou token ja existente para aquele pagamento

---

## 8. Ponto de Atencao de UX

Existe uma nuance importante:

- o banco persiste `token_hash`
- o texto puro do token nao pode ser reconstruido depois

Isso significa que chamadas repetidas concorrentes nem sempre poderao receber novamente o token em texto puro.

Portanto, o sistema precisa assumir explicitamente um comportamento para o caso:

- "token ja existente"

Esse estado deve ser tratado como parte legitima do fluxo.

---

## 9. Principios de Implementacao

- resolver concorrencia sem overengineering
- usar garantias do banco como base
- manter o fluxo simples
- evitar locks mais pesados do que o necessario
- nunca retornar erro 500 para repeticao legitima do mesmo pagamento

---

## 10. Plano de Implementacao Proposto

### Fase 1 - Revisao do contrato de resposta

- definir com clareza os estados de retorno de confirmacao
- alinhar o significado de `token_gerado`
- alinhar o significado de `token_existente`

### Fase 2 - Refatoracao do fluxo de persistencia

- substituir a janela `SELECT -> INSERT` por operacao atomica ou tratamento robusto de conflito
- garantir que conflito de unicidade vire resposta de dominio

### Fase 3 - Blindagem dos fluxos correlatos

- revisar aprovacao manual
- revisar pontos que dependem do mesmo `pagamento_id`
- validar consistencia entre caminhos automatico e manual

### Fase 4 - Validacao

- simular chamadas repetidas
- simular concorrencia do mesmo pagamento
- validar ausencia de duplicidade e ausencia de erro 500

---

## 11. Criterios de Sucesso

- um mesmo `pagamento_id` nunca gera mais de um token persistido
- chamadas repetidas retornam comportamento consistente
- concorrencia nao explode erro tecnico para o usuario
- o backend continua simples e compreensivel
- a solucao permanece proporcional ao porte da aplicacao

---

## 12. Referencias

- [roadmap_supabase_prontidao_producao.md](../roadmap_supabase_prontidao_producao.md)
- [roadmap.md](../roadmap.md)
- `api/_lib/pagamentos/orquestrador.ts`
- `api/pagamentos/confirmar.ts`
- `api/pagamentos/manual/aprovar.ts`

---

## 13. Destino Pos-Implementacao

Apos a implementacao, este mesmo arquivo deve ser movido para:

- `.metadocs/walkthrough/idempotencia_confirmacao_pagamento.md`

Depois do movimento:

- o conteudo deve ser ajustado de plano para walkthrough
- a referencia deve ser adicionada ao `historico.md`
- a feature deve ser marcada como concluida na documentacao correspondente
