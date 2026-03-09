#!/bin/bash
# =============================================================================
# Gerador de Conta Premium (Trial) - Sem Susto
# =============================================================================
# Wrapper para `lib/scripts/database/gerar_token.ts` no container `app`.
# Uso: ./premium.sh [plano] (padrão: trial)
# =============================================================================

echo -e "\033[1;35m💎 GERADOR DE TOKEN PREMIUM (VIA app)\033[0m"

PLANO=${1:-trial}
COMPOSE_FILE=".docker/compose.yaml"

echo -e "\033[0;90mExecutando comando no container...\033[0m"
RESPOSTA=$(docker compose -f "$COMPOSE_FILE" exec -T app npx tsx lib/scripts/database/gerar_token.ts --plano "$PLANO" 2>&1)
EXIT_CODE=$?

if [[ "$RESPOSTA" == *"relation \"tokens\" does not exist"* ]]; then
    echo -e "\033[0;33m⚠️ Tabela 'tokens' não encontrada. Inicializando banco de dados...\033[0m"
    docker compose -f "$COMPOSE_FILE" exec -T app npx tsx lib/scripts/database/init_db.ts

    echo -e "\033[0;90mRetentando geração do token...\033[0m"
    RESPOSTA=$(docker compose -f "$COMPOSE_FILE" exec -T app npx tsx lib/scripts/database/gerar_token.ts --plano "$PLANO" 2>&1)
    EXIT_CODE=$?
fi

echo "$RESPOSTA"

if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo -e "\033[0;33m💡 DICA: Verifique se os containers 'database' e 'app' estão rodando.\033[0m"
    echo -e "\033[0;33m   Rode: ./dev.sh para iniciar o ambiente.\033[0m"
fi
