# Walkthrough: Estabilidade de Memória no Fluxo de Foto e Recorte 📷

Correção crítica do fluxo de captura manual em produção, focada em reduzir picos de memória no Android e impedir quebra durante a etapa de recorte/OCR.

## 🚀 O que mudou?

### 🧠 Redução de Pico de Memória na Seleção de Foto
- **Antes:** `ModalFormularioProduto` usava `FileReader.readAsDataURL(file)` antes do recorte, gerando Base64 grande na RAM.
- **Depois:** fluxo passou a usar `URL.createObjectURL(file)` para abrir o `ModalRecorte` sem criar Base64 bruto antecipado.
- **Efeito:** menor pressão de memória no caminho mais crítico (câmera de alta resolução + recorte).

### 🧹 Higiene de Recursos Temporários (`blob:` URL)
- Adicionado ciclo de limpeza com `URL.revokeObjectURL`:
  - ao confirmar recorte;
  - ao cancelar recorte;
  - ao desmontar o modal/formulário.
- Evita acumular referências temporárias entre múltiplas tentativas de foto.

### 🛡️ Robustez no `ModalRecorte`
- `finalizarRecorte` agora roda com `try/catch/finally`.
- Em falha de `Canvas`/compressão, a UI exibe erro amigável e preserva o fluxo de recuperação do usuário.
- Ajuste de tipagem do callback `aoConfirmar` para string Base64 final do recorte.

### 🔒 Blindagem de OCR Pós-Recorte
- Ajuste defensivo no retorno da IA (`d?.descricao`, `d?.marca`, `d?.tamanho`) para evitar exceção quando OCR retorna `null`.

### ⏱️ Ajuste Temporário de Debug em Produção (Solicitação de Produto)
- `localStorage.clear()` foi mantido para simulação de usuário novo.
- Implementado **throttle de 5 minutos** com chave `sem_susto_debug_ultima_limpeza_localstorage`, evitando limpeza destrutiva a cada reload.

---

## 🛠️ Detalhes Técnicos Implementados

### Seleção de imagem sem Base64 bruto
```typescript
const urlBlobTemporaria = URL.createObjectURL(arquivoSelecionado);
setImagemParaRecorte(urlBlobTemporaria);
setMostraRecorte(true);
```

### Limpeza explícita de URL temporária
```typescript
const liberarUrlBlobRecorte = () => {
  const urlBlob = referenciaUrlBlobRecorte.current;
  if (urlBlob && urlBlob.startsWith('blob:')) {
    URL.revokeObjectURL(urlBlob);
  }
  referenciaUrlBlobRecorte.current = null;
};
```

### Recorte com proteção de erro
```typescript
try {
  const canvas = cropper.getCroppedCanvas({ maxWidth: 1024, maxHeight: 1024 });
  if (!canvas) throw new Error('Falha ao gerar canvas do recorte');
  const base64Bruto = canvas.toDataURL('image/jpeg', 0.9);
  const base64Comprimido = await comprimirImagemBase64(base64Bruto, 0.7, 400);
  aoConfirmar(base64Comprimido);
} catch {
  setErroRecorte('Nao foi possivel processar a foto neste dispositivo. Tente novamente com outra imagem.');
}
```

---

## ✅ Verificação Realizada

1. **Fluxo de Seleção:** removida a conversão Base64 pré-recorte no `ModalFormularioProduto`.
2. **Fluxo de Limpeza:** garantido `revokeObjectURL` em confirmação, cancelamento e unmount.
3. **Fluxo de Recorte:** tratamento de exceção com fallback visual no `ModalRecorte`.
4. **Fluxo de OCR:** protegido contra retorno nulo sem quebra de tela.
5. **Debug Reset:** `localStorage.clear()` mantido com janela mínima de 5 minutos.

---

## 📌 Observação

- Este ajuste corrige a causa principal de insuficiência de memória observada na demo em produção.
- O incidente completo foi registrado em: `./postmortem/postmortem_memoria_foto_recorte.md`.

