---
name: cria_commit
description: Aplica rigorosamente os padrões de versionamento para criar mensagens de commit (formatação, emojis e convenção de nomes) no repositório.
---

# 🎯 Propósito

Use esta skill SEMPRE que for solicitado a criar um commit, descrever mudanças para versionamento ou quando usar a ferramenta de terminal para rodar `git commit`. Esta skill garante que a mensagem do commit siga o padrão imutável do projeto.

# 📋 Pré-requisitos

- O usuário deve concordar com a execução do commit ou pedir explicitamente.
- Só execute `git add` no que for necessário (proibido usar `git add .` indiscriminadamente).

# 🛠️ Instruções de Execução (Workflow)

1. **Análise de Alterações:** Utilize as ferramentas de git e diff para entender exatamente quais arquivos foram alterados.
2. **Definição de Tipo e Emoji:** Consulte a Tabela de Tipos (abaixo) para classificar o commit corretamente.
3. **Construção da Mensagem:** Use estritamente o modelo localizado em `resources/commit_template.txt`. Nenhuma outra variação é permitida.
4. **Execução:** Se autorizado pelo usuário, rode o comando `git commit -m "SUA MENSAGEM"`.

### Tabela de Tipos Oficial (Obrigatório)

Só é permitido usar as combinações exatas de código emoji (nunca unicode) e tipo abaixo:

- `:tada:` -> `init`
- `:books:` -> `docs`
- `:bug:` -> `fix`
- `:sparkles:` -> `feat`
- `:bricks:` -> `ci`
- `:recycle:` -> `refactor`
- `:zap:` -> `perf`
- `:boom:` -> `breaking`
- `:lipstick:` -> `feat` (para UI/UX)
- `:test_tube:` -> `test`
- `:bulb:` -> `docs` (para comentários no código)
- `:card_file_box:` -> `data`
- `:broom:` -> `cleanup`
- `:wastebasket:` -> `remove`

# ⚠️ Regras e Restrições (Guardrails)

- **Idioma:** Sempre em `pt-BR`.
- **Formatação de referências:** Nomes de arquivos, funções, rotas ou variáveis na descrição DEVEM OBRIGATORIAMENTE estar entre crases (ex: `funcaoX()`).
- **Emoji em texto:** Usa a string textual do emoji (ex: `:bug:` e não 🐛).
