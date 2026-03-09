#!/bin/bash
# =============================================================================
# Exec Wrapper - Backend (Data Engineering / Python Worker)
# =============================================================================
# Facilitador para rodar scripts no container do backend.
# Ex: ./exec.sh python scripts/remove_pagamentos_mockados.py
# =============================================================================

if [ "$#" -eq 0 ]; then
    echo "Erro: Nenhum comando passado."
    echo "Uso: ./exec.sh <comando>"
    echo "Ex:  ./exec.sh python scripts/meu_script.py"
    exit 1
fi

docker compose -f .docker/compose.yaml exec backend "$@"
