---
name: inicia_projeto
description: Gerador de Contexto de Inicialização e Padronização de Projeto
---

# 🎯 Propósito

Atue como um Arquiteto de Software focado em Padronização. Use esta skill SEMPRE que o usuário pedir para analisar, inicializar ou configurar as bases de um projeto novo ou recém-criado, garantindo a infraestrutura documental exigida.

# 📋 Pré-requisitos

- Verifique se a aplicação está vazia ou já tem arquivos (para não sobrescrever documentações importantes sem querer).

# 🛠️ Instruções de Execução (Workflow)

## 1: Identificação de Stack (Ação Imperativa)

Analise os arquivos na raiz usando ferramentas de leitura de diretório (`list_dir`) para determinar a linguagem dominante.
**Prioridade de Identificação:**

1. `package.json` -> `javascript/typescript`
2. `pyproject.toml` ou `requirements.txt` -> `python`
3. `go.mod` -> `go`
4. `Cargo.toml` -> `rust`
5. `composer.json` -> `php`
6. `pom.xml` ou `build.gradle` -> `java`
7. _Fallback_: Analise as extensões predominantes em `src/`.

## 2: Mapeamento e Criação de Estrutura Documental

Verifique a existência dos arquivos primários. Caso não existam, **CRIE-OS IMEDIATAMENTE** usando os templates localizados na pasta `resources/` desta skill:

- `AGENTS.md` (Baseado em `resources/template_agents.md`)
- `.agents/rules/workflow.md` (Baseado em `resources/template_workflow.md`)
- `.metadocs/roadmap.md` (Baseado em `resources/template_roadmap.md`)
- `README.md` (Se não existir, crie-o para o projeto usando um modelo elegante e moderno)

## 3: Configuração de Regras Específicas

1. **AGENTS.md:** Substitua a tag `> LINGUAGEM_PROJETO: <linguagem>` dentro do `AGENTS.md` gerado pela linguagem detectada no Passo 1.
2. **Rules Locais:** Verifique se `.agents/rules/<linguagem>.md` existe.
   - **Se não existir:** Crie o arquivo contendo as melhores práticas de Clean Code, padrões de nomenclatura e estrutura de pastas para aquela linguagem.

## 4: Finalização e Notificação

Ao concluir as criações e identificar a stack, use a ferramenta de notificação (`notify_user`) para exibir:

1. Qual linguagem foi detectada.
2. Quais arquivos foram gerados/configurados.
3. Se o ambiente parece pronto para a configuração do Docker (`/setup_docker`) ou se precisa de mais algo.
