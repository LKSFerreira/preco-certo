# Arquitetura de Instruções do Agente

Este projeto usa a pasta `.agents/` como fonte oficial de instruções.

## Estrutura oficial
- `/.agents/rules/`: regras estáveis e sempre válidas (políticas).
- `/.agents/workflows/`: procedimentos acionáveis por comando (runbooks).

> **Diretriz crítica:** O agente deve ler, considerar e obedecer **todas** as regras existentes dentro de `/.agents/rules/`. A lista de precedência abaixo define a **ordem de leitura e desempate**, mas **não limita** a validade das demais rules presentes no diretório.

## Regra de organização
- Regras respondem: **o que é obrigatório**.
- Workflows respondem: **como executar** uma tarefa específica.
- Workflows não podem contradizer regras.

## Ordem de leitura e precedência
1. `/.agents/rules/code.md`.
2. `/.agents/rules/workflow.md`.
3. `/.agents/rules/docker.md`.
4. `/.agents/rules/git.md` (commits e PRs).
5. `/.agents/rules/<linguagem>.md`, conforme `LINGUAGEM_PROJETO`.
6. `/.agents/workflows/<comando>.md` somente quando o comando for solicitado.

## Linguagem do projeto
> LINGUAGEM_PROJETO: javascript

Mapeamento:
- Python -> `/.agents/rules/python.md`
- Java -> `/.agents/rules/java.md`
- JavaScript -> `/.agents/rules/javascript.md`

## Diretriz de versionamento
- Commits, push e ações de versionamento só podem ser executados quando solicitados explicitamente pelo usuário.
