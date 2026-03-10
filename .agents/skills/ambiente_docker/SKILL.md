---
name: ambiente_docker
description: Gerencia dependências e a integridade do ambiente Docker Compose do projeto usando os utilitários corretos (dev.sh e exec).
---

# 🎯 Propósito

Atue como Especialista em DevOps. Use esta skill SEMPRE que solicitado para configurar o ambiente Docker do zero (`/setup_docker`) ou para gerenciar dependências e a vida útil dos containers.

# 📋 Pré-requisitos

- Identificar a stack via `AGENTS.md` (`LINGUAGEM_PROJETO`).
- O terminal do ambiente Host deve estar disponível para executar scripts bash.

# 🛠️ Instruções de Execução (Workflow)

## 1: Configuração Inicial (Setup)

1. **Diretório**: Crie `.docker/` na raiz.
2. **Templates**: Copie `compose.yaml` e `Dockerfile.*` apropriados para `.docker/`.
3. **Paths**: Ajuste caminhos no `compose.yaml` de `./` para `../`.
4. **Variáveis**: Configure `.env.example` e `.env` na raiz.
5. **Script**: Crie `dev.sh` na raiz com detecção de IP local.

## 2: Manutenção e Dependências

- **Subir/Build**: `bash dev.sh` (adicione `--build` se houver mudanças no Dockerfile).
- **Node.js**: Use `bash exec.sh npm install <pacote>` para instalar dentro do container `app`.
- **Python**: Use `docker compose -f .docker/compose.yaml exec backend uv pip install --system <pacotes>`.

# ⚠️ Regras e Restrições (Guardrails)

- **PROIBIDO** instalar dependências no host.
- **PROIBIDO** usar `docker compose` sem o parâmetro `-f .docker/compose.yaml`.
- **Limpeza**: Após o setup, remova diretórios de templates temporários.
