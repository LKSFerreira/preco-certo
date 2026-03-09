---
description: Finaliza uma feature documentalmente, promovendo o artefato de feat para walkthrough e sincronizando histórico e referências.
---

# Workflow: Feat Completa

> **Objetivo:** Padronizar o fechamento de uma feature já implementada e validada, evitando que o agente dependa de instruções manuais repetidas para ajustar, promover e registrar a entrega.

## 1: Pré-condições Obrigatórias

Antes de executar este workflow, confirme que:

- a implementação já foi concluída
- a feature foi validada de forma compatível com o seu escopo
- já existe um arquivo em `/.metadocs/feat/` representando a feature

Se uma dessas condições não estiver satisfeita, **não promova** o arquivo ainda.

---

## 2: Ajuste do Artefato

Abra o documento da feature em `/.metadocs/feat/` e converta o conteúdo de **plano** para **walkthrough**.

### Ações obrigatórias

- atualizar o título para refletir walkthrough/implementação concluída
- atualizar status para concluído, implementado ou equivalente
- substituir linguagem de intenção futura por linguagem de entrega real
- registrar a solução que foi efetivamente aplicada
- registrar validações executadas
- registrar scripts utilitários ou comandos de teste, quando existirem

### Regra de qualidade

O documento promovido não pode continuar com texto ambíguo do tipo:

- "será implementado"
- "deve ser movido"
- "plano proposto"
- "destino pós-implementação"

Após a promoção, o arquivo precisa ler como **registro da implementação**, não como proposta.

---

## 3: Promoção do Arquivo

Mova o mesmo arquivo de:

- `/.metadocs/feat/<tema>.md`

para:

- `/.metadocs/walkthrough/<tema>.md`

### Regra obrigatória

- **não criar um segundo arquivo redundante**
- o mesmo artefato deve ser promovido e ajustado

---

## 4: Sincronização de Referências

Após mover o arquivo, procure e atualize todas as referências que ainda apontam para o caminho antigo em `/.metadocs/feat/`.

### Locais típicos que devem ser auditados

- `/.metadocs/roadmap.md`
- `/.metadocs/roadmap_supabase_prontidao_producao.md`
- `/.metadocs/feat/plano_implementacao_postgres_producao.md`
- outros documentos que referenciem a feature explicitamente

### Regra obrigatória

Não deixe links quebrados ou referências mistas (`feat/` e `walkthrough/`) para a mesma feature concluída.

---

## 5: Atualização do Histórico

Abra o `historico.md` em `/.metadocs/` e adicione uma nova entrada seguindo **exatamente o padrão visual existente**.

### A entrada deve conter obrigatoriamente

- data
- título resumido da feature
- link Markdown relativo para o walkthrough promovido
- resumo objetivo do que foi implementado
- validação realizada, quando isso for relevante para a natureza da feature

---

## 6: Critério de Fechamento

Considere a feature documentalmente completa apenas quando todos os itens abaixo estiverem satisfeitos:

- artefato ajustado para walkthrough
- arquivo promovido de `feat/` para `walkthrough/`
- referências sincronizadas
- histórico atualizado

Se qualquer um desses itens estiver pendente, a feature **não está completamente encerrada**.

---

## 7: Relatório de Entrega

Ao concluir:

- informe qual arquivo foi promovido
- informe quais referências foram atualizadas
- informe que o histórico foi sincronizado

Se houver qualquer limitação, diga explicitamente o que não foi possível concluir.
