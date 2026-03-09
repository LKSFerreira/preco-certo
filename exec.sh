#!/bin/bash
# =============================================================================
# Exec Wrapper - App (TypeScript / Scripts Operacionais)
# =============================================================================
# Facilitador para rodar comandos no container `app`.
# Ex: ./exec.sh npx tsx lib/scripts/database/remove_pagamentos_mockados.ts
# =============================================================================

if [ "$#" -eq 0 ]; then
    echo "Erro: Nenhum comando passado."
    echo "Uso: ./exec.sh <comando>"
    echo "Ex:  ./exec.sh npx tsx lib/scripts/database/init_db.ts"
    exit 1
fi

docker compose -f .docker/compose.yaml exec app "$@"
