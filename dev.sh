#!/bin/bash
# =============================================================================
# Dev Script - Sem Susto
# =============================================================================
# Este script detecta o IP da sua rede local (Windows) e inicia o Docker.
# Uso: ./dev.sh
# =============================================================================

# Procura o IP da rede local (192.168.* ou 10.*) usando ipconfig (Windows)
# Usamos grep -oE para pegar apenas o número do IP, ignorando labels (como "Endereço IPv4") e encodings
IP=$(ipconfig | grep -oE "\b(192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\b" | head -n 1 | tr -d '\r ')

if [ -n "$IP" ]; then
    export HOST_IP=$IP
    COLOR_IP="\033[0;32m$IP\033[0m"
else
    export HOST_IP=""
    COLOR_IP="\033[0;31mNão detectado\033[0m"
fi

# 1. Sobe os containers em background para não poluir o início
echo -e "\033[0;90m[1/3] 🔨 Iniciando containers (Argumentos: $@)...\033[0m"
# Repassa todos os argumentos do script para o docker compose (ex: --build)
docker compose -f .docker/compose.yaml up -d "$@"

# 2. Limpa e mostra status de inicialização
clear
echo -e "\033[1;35m🚀 SEM SUSTO - INICIANDO AMBIENTE\033[0m"
echo -e "\033[0;90mOs logs e links de acesso aparecerão abaixo...\033[0m"
echo ""

# 3. Segue os logs (fica travado aqui até o Ctrl+C)
docker compose -f .docker/compose.yaml logs -f
