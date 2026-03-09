# @deprecated Desde 09/03/2026.
# Substituído por `lib/scripts/data/remover_genericos.ts`.
# Mantido em `_deprecated/` para referência histórica e rollback controlado.

import json
import os
import re

CAMINHO_JSON = '/app/produtos_higienizados.json'
CAMINHO_JSON_FINAL = '/app/produtos_higienizados_final.json'

def limpar_string_generica(valor):
    if not isinstance(valor, str):
        return valor

    val_limpo = valor.strip().lower()

    # Lista negra de termos exatos genéricos que detectamos no sistema
    termos_genericos = [
        'produto sem nome', 'marca desconhecida', 'sem marca', 'sem tamanho',
        'generico', 'genérico', 'tamanho desconhecido', 'nao informado'
    ]

    if val_limpo in termos_genericos:
        return None

    return valor

print("🚀 Iniciando limpeza de genéricos...")

try:
    with open(CAMINHO_JSON, 'r', encoding='utf-8') as f:
        produtos = json.load(f)
except Exception as e:
    print(f"❌ Erro ao ler o arquivo JSON original: {e}")
    exit(1)

contador_alteracoes = 0

for p in produtos:
    alterou = False

    desc_antiga = p.get('descricao')
    marca_antiga = p.get('marca')
    tamanho_antigo = p.get('tamanho')

    desc_nova = limpar_string_generica(desc_antiga)
    marca_nova = limpar_string_generica(marca_antiga)
    tamanho_novo = limpar_string_generica(tamanho_antigo)

    if desc_antiga != desc_nova:
        p['descricao'] = desc_nova
        alterou = True

    if marca_antiga != marca_nova:
        p['marca'] = marca_nova
        alterou = True

    if tamanho_antigo != tamanho_novo:
        p['tamanho'] = tamanho_novo
        alterou = True

    if alterou:
        contador_alteracoes += 1

try:
    with open(CAMINHO_JSON_FINAL, 'w', encoding='utf-8') as out:
        json.dump(produtos, out, ensure_ascii=False, indent=2)
    print(f"✅ Sucesso! {contador_alteracoes} produtos tiveram strings genéricas substituídas por null.")
    print(f"📁 Novo arquivo gerado: {CAMINHO_JSON_FINAL}")
except Exception as e:
    print(f"❌ Erro ao salvar o novo JSON: {e}")
