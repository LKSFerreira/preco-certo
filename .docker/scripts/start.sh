#!/bin/bash
# =============================================================================
# Inicia o Preço Certo com IP da rede local
# Uso: .docker/scripts/start.sh
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_DIR"

# Descobre IP da rede local (Windows Git Bash)
IP_LOCAL=$(ipconfig 2>/dev/null | grep -E "IPv4.*192\." | head -1 | awk -F': ' '{print $2}' | tr -d '\r\n ')

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  🚀 Preço Certo - Iniciando..."
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  📍 Acesso local (PC):     http://localhost:5173"
if [ -n "$IP_LOCAL" ]; then
  echo "  📱 Acesso rede (celular): http://${IP_LOCAL}:5173"
fi
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Sobe os containers (passa argumentos, ex: -d para detached)
docker compose -f .docker/compose.yaml up "$@"
