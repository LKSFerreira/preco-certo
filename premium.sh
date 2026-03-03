#!/bin/bash
# =============================================================================
# Gerador de Conta Premium (Trial) - Sem Susto
# =============================================================================
# Este script é um wrapper para o scripts/gerar_token.py rodando no container.
# Uso: ./premium.sh [plano] (padrão: trial)
# =============================================================================

echo -e "\033[1;35m💎 GERADOR DE TOKEN PREMIUM (VIA backend)\033[0m"

# 1. Configurações
PLANO=${1:-trial}
COMPOSE_FILE=".docker/compose.yaml"

# 2. Executa o script Python dentro do container backend
# O container 'backend' já tem acesso direto ao banco e as dependências python.
echo -e "\033[0;90mExecutando comando no container...\033[0m"
RESPOSTA=$(docker compose -f "$COMPOSE_FILE" exec -T backend python scripts/gerar_token.py --plano "$PLANO" 2>&1)
EXIT_CODE=$?

# 3. Auto-correção: Se a tabela não existir, tenta inicializar o banco
if [[ "$RESPOSTA" == *"relation \"tokens\" does not exist"* ]]; then
    echo -e "\033[0;33m⚠️ Tabela 'tokens' não encontrada. Inicializando banco de dados...\033[0m"
    docker compose -f "$COMPOSE_FILE" exec -T backend python scripts/init_db.py
    
    echo -e "\033[0;90mRetentando geração do token...\033[0m"
    RESPOSTA=$(docker compose -f "$COMPOSE_FILE" exec -T backend python scripts/gerar_token.py --plano "$PLANO" 2>&1)
    EXIT_CODE=$?
fi

# 4. Exibe a resposta final
echo "$RESPOSTA"

# 5. Dica amigável caso ainda falhe
if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo -e "\033[0;33m💡 DICA: Verifique se os containers 'database' e 'backend' estão rodando.\033[0m"
    echo -e "\033[0;33m   Rode: ./dev.sh para iniciar o ambiente.\033[0m"
fi

