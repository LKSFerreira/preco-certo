# Postmortem: Falha de Memória no Fluxo de Foto/Recorte em Produção 📉

> **Data do incidente:** 2026-03-03  
> **Ambiente:** Produção (`https://www.semsusto.app`)  
> **Contexto real:** Demonstração para potencial investidor (dispositivo Android)  
> **Impacto:** Fluxo de cadastro por foto interrompido; impossibilidade de concluir demonstração  
> **Severidade:** 🔴 Crítica

---

## 1. O Que Aconteceu

Durante a etapa de cadastro manual com foto, após capturar/selecionar a imagem, o app falhou no fluxo de recorte e não avançou para edição dos dados.  
No dispositivo, apareceu a mensagem:

> "Devido à insuficiência de memória, não foi possível concluir a operação anterior"

Resultado: a jornada principal de valor (foto → recorte → OCR → edição → salvar) foi quebrada em produção.

---

## 2. Causa Raiz

### Cadeia técnica do problema

```text
Foto da câmera (alta resolução, vários MB)
  → FileReader.readAsDataURL(arquivo) no frontend (conversão imediata para Base64 gigante)
    → Render no Cropper + decodificação de imagem
      → getCroppedCanvas() + toDataURL() (novo pico de memória)
        → compressão com novo canvas (mais alocação)
          → pressão de memória no browser Android
            → falha da operação com mensagem de insuficiência de memória
```

### Ponto crítico

O gargalo principal foi usar **Base64 antes do recorte** (`readAsDataURL`) para imagens grandes.  
Esse caminho duplica/expande uso de memória no pior momento do fluxo (captura + crop + compressão).

---

## 3. Fatores Agravantes

1. Ausência de limpeza explícita de URLs temporárias entre ciclos de foto/recorte.
2. Tratamento de erro limitado no modal de recorte (falha sem recuperação orientada).
3. `localStorage.clear()` rodando em toda carga do app (debug legado), aumentando risco de perda de contexto em cenários de reload pós-falha.

---

## 4. Correções Implementadas

### 4.1 Redução de pico de memória no pré-recorte
- Troca de `FileReader.readAsDataURL` por `URL.createObjectURL(file)` no fluxo de seleção de imagem.
- Benefício: evita criação de Base64 bruto gigante antes do recorte.

### 4.2 Higiene de memória de recursos temporários
- Adicionada rotina de limpeza com `URL.revokeObjectURL(...)` para a imagem temporária:
  - ao confirmar recorte;
  - ao cancelar recorte;
  - no unmount do formulário.

### 4.3 Robustez no Modal de Recorte
- `try/catch/finally` no processamento (`getCroppedCanvas` + compressão).
- Mensagem de erro amigável no próprio modal em caso de falha de processamento.

### 4.4 Blindagem de retorno da IA
- Ajuste defensivo para evitar quebra quando OCR retorna `null`.

### 4.5 Ajuste solicitado para debug de reset
- `localStorage.clear()` mantido (necessidade de simulação), porém com **throttle de 5 minutos** via timestamp em storage.

---

## 5. Evidência de Correção no Código

- `App.tsx`:
  - throttle do reset debug (`sem_susto_debug_ultima_limpeza_localstorage`).
- `components/ModalFormularioProduto.tsx`:
  - fluxo com `URL.createObjectURL`;
  - limpeza com `URL.revokeObjectURL`;
  - cancelamento de recorte com limpeza;
  - proteção de retorno `null` da IA.
- `components/ModalRecorte.tsx`:
  - processamento protegido com `try/catch`;
  - feedback de erro no modal.

---

## 6. Plano de Prevenção

1. **Teste obrigatório em Android real** para fluxo de foto em alta resolução antes de demo/release.
2. **Teste de estresse de recorte**: 5-10 capturas sequenciais na mesma sessão.
3. **Feature flag de debug reset** para evitar comportamento destrutivo não intencional em produção.
4. **Telemetria de falhas de recorte/OCR** (contador por sessão) para detectar regressão cedo.

---

## 7. Status

✅ Incidente analisado  
✅ Causa raiz identificada  
✅ Correções aplicadas no código  
⚠️ Validação final depende de teste em dispositivo Android real em produção (ou espelho idêntico de ambiente)

