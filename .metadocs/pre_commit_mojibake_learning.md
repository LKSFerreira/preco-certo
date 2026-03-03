# Tutorial: Bloquear Mojibake no Pre-commit (Rigoroso via iconv)

Este guia configura um hook `pre-commit` que utiliza a ferramenta `iconv` para garantir a integridade estrutural de arquivos UTF-8, bloqueando commits de arquivos corrompidos ou com "double encoding" (mojibake).

## 1: Por que usar iconv em vez de Regex?

Embora o regex (`Ã|â|`) detecte sintomas comuns, o `iconv` valida se a sequência de bytes do arquivo é válida para o padrão UTF-8. 
- **Vantagem**: Detecta caracteres de controle inválidos e sequências de bytes impossíveis em UTF-8.
- **Segurança**: Evita falsos positivos em acentos legítimos, focando em erros de encoding reais.

## 2: Pré-requisitos

- Git instalado.
- **Git Bash** (onde o utilitário `iconv` já vem pré-instalado no Windows).

## 3: Criar o hook `pre-commit` (Git Bash)

Execute o comando abaixo no terminal Git Bash na raiz do projeto:

```bash
cat > .git/hooks/pre-commit <<'EOF'
#!/usr/bin/env bash

set -eo pipefail

# Extensões para validar (texto plano e código)
PADRAO_EXTENSOES='\.(md|ts|tsx|js|jsx|json|css|html)$'

# Lista de arquivos staged (Adicionados, Modificados, Renomeados)
ARQUIVOS_STAGED=$(git diff --cached --name-only --diff-filter=ACMR)

if [ -z "${ARQUIVOS_STAGED}" ]; then
  exit 0
fi

ENCONTRADOS=()

while IFS= read -r ARQUIVO; do
  [ -f "$ARQUIVO" ] || continue
  
  if [[ "$ARQUIVO" =~ $PADRAO_EXTENSOES ]]; then
    # Validação via iconv: tenta converter para UTF-8 e descarta o output
    # Se houver erro de bytes, iconv retorna status != 0
    if ! iconv -f UTF-8 -t UTF-8 "$ARQUIVO" >/dev/null 2>&1; then
      ENCONTRADOS+=("$ARQUIVO")
    fi
  fi
done <<< "$ARQUIVOS_STAGED"

if [ "${#ENCONTRADOS[@]}" -gt 0 ]; then
  echo -e "\033[0;31m"
  echo "ERRO: Problema de ENCODING (UTF-8 inválido) detectado nos arquivos:"
  for ARQ in "${ENCONTRADOS[@]}"; do
    echo "  - $ARQ"
  done
  echo -e "\033[0m"
  echo "Dica: Converta o arquivo para UTF-8 puro no VS Code ou via terminal antes de commitar."
  exit 1
fi

exit 0
EOF

chmod +x .git/hooks/pre-commit
```

## 4: Testar o bloqueio

1. Simule um arquivo corrompido (encoding ISO-8859-1 salvo como se fosse UTF-8).
2. Tente fazer o `git commit`.
  ```bash
  git add <arquivo_modificado>
  git commit -m "teste: valida hook de mojibake"
  ```
3. O script deve interromper o processo e listar o arquivo.

## 5: Manutenção

- Para ignorar arquivos específicos (como arquivos de teste de mojibake), você pode adicionar uma exceção no loop `while`.
- Para adicionar novos formatos, edite a variável `PADRAO_EXTENSOES`.

## 6: Boas práticas

- Verifique seu `.editorconfig`:
  ```ini
  [*]
  charset = utf-8
  end_of_line = lf
  ```
- No VS Code, certifique-se de que a barra de status inferior indica **UTF-8**.
