# Walkthrough de Otimização do Bundle Size

Implementamos uma série de melhorias técnicas para reduzir o bundle size do JavaScript em aproximadamente 115 KiB, focando no isolamento de bibliotecas pesadas e remoção de recursos não utilizados.

## Alterações Realizadas

### 📦 Limpeza de Dependências
- **Remoção da `openai`**: Removida do `package.json`, pois o projeto utiliza `fetch` direto para a API Groq.
- **Organização de Dependências**: Movidas bibliotecas de "Node/Backend" (`pg`, `path`, `url`) para `devDependencies`, garantindo que não vazem para o bundle do frontend.

### 🤖 Isolamento Dinâmico da IA
Refatoramos a fábrica de IA para utilizar importações dinâmicas (`await import()`). Isso garante que as implementações pesadas da IA só sejam baixadas se e quando o usuário realmente precisar processar um rótulo.

```typescript
// services/ia/fabrica.ts
static async obterInstancia(): Promise<ServicoLeituraRotulo> {
  const { ServicoIAGroq } = await import("./groq"); // Carregamento sob demanda
  return new ServicoIAGroq();
}
```

### 🌐 Otimização do Vite
- **Remoção do `manualChunks` estático**: Eliminamos o agrupamento forçado em `vendor-libs`. Agora o Vite gerencia os chunks automaticamente, permitindo que os modais carregados via `lazy` (`ModalScannerBarras` e `ModalFormularioProduto`) fiquem em arquivos separados e só sejam baixados no clique.

## Resultados Esperados
- **Bundle Principal mais leve**: Redução imediata no carregamento inicial.
- **Isolamento de Bibliotecas**: `html5-qrcode` e `react-cropper` agora são "pagos" apenas pelo uso, não no carregamento do app.

## Como Verificar
1. Abra a aba **Network** do navegador.
2. Atualize a página e veja que o bundle principal está menor.
3. Clique em "Ler Código" e observe o download dinâmico do chunk do scanner.
