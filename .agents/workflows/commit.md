---
description: Workflow operacional para comando /commit
---

Execute nesta ordem:

1. Carregue `.agents/rules/git.md`.
2. Analise `git status` e `git diff --staged`.
3. Se não houver arquivos staged, informe e aguarde orientação para stage seletivo.
4. Gere a mensagem usando obrigatoriamente o **Template obrigatório de commit** da regra de git.

Saída esperada antes do commit:
- uma única sugestão de mensagem pronta no formato obrigatório.
