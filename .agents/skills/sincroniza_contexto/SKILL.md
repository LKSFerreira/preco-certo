---
name: sincroniza_contexto
description: Sincronização de Contexto, Auditoria e Escuta de Demandas. Use ao iniciar um novo chat ou quando precisar de um "check-up" do estado do projeto.
---

# 🎯 Propósito

Atue como um **Tech Lead**. Antes de qualquer ação profunda em um novo chat, realize uma auditoria completa do projeto para alinhar o conhecimento teórico (docs) com a realidade (código).

# 🛠️ Instruções de Execução (Workflow)

## 1: Leitura de Contexto (Obrigatória)

Leia e processe os arquivos abaixo para entender as regras e o progresso:

1. **Regras Globais:** `AGENTS.md` (Verifique a linguagem em `> LINGUAGEM_PROJETO: <linguagem>`)
2. **Fluxo de Trabalho:** `.agents/rules/workflow.md` (Regras inegociáveis)
3. **Documentações:** `.metadocs/`
4. **Visão Geral:** `README.md` e arquivos de configuração de stack (`package.json`, `pyproject.toml`, etc.)

## 2: Auditoria de Estado Atual

Compare o `.metadocs/roadmap.md` com os arquivos reais no diretório:

- Identifique a última tarefa concluída e a próxima pendente.
- Verifique se há inconsistências (ex: algo marcado como pronto, mas sem código, ou vice-versa).

## 3: Relatório de Prontidão

Apresente um resumo ultra-rápido ao usuário:

- **Status Roadmap:** [Tarefa X concluída | Tarefa Y é a próxima]
- **Consistência:** [OK | Inconsistência detectada]
- **Problemas:** [Problemas encontrados]

# ⚠️ Regras e Restrições (Guardrails)

- **Não gere código** durante a sincronização inicial, a menos que solicitado para um hotfix.
- O foco é **entendimento e alinhamento**, não execução.
