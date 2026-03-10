# Arquitetura de Instruções do Agente

Este projeto usa a pasta `.agents/` como fonte oficial de instruções.

> **Diretriz crítica:** O agente deve seguir estritamente as regras para cada contexto solicitado pelo usuário. A lista de precedência abaixo define as diretrizes deste projeto.

## Regra de organização
- Regras: **o que é obrigatório**.
- Skills: **como executar** uma tarefa específica.
- Workflows: **gatilhos (slash commands) e procedimentos**.

## Ordem de leitura e precedência
1. `/.agents/rules/code.md`.
2. `/.agents/rules/workflow.md`.
3. `/.agents/rules/<linguagem>.md`, conforme `LINGUAGEM_PROJETO`.

## Linguagem do projeto
> LINGUAGEM_PROJETO: javascript

Mapeamento:
- Python -> `/.agents/rules/python.md`
- Java -> `/.agents/rules/java.md`
- JavaScript -> `/.agents/rules/javascript.md`

## Diretriz de versionamento
- Commits, push e ações de versionamento só podem ser executados quando solicitados explicitamente pelo usuário.
