# Walkthrough: Otimização de Performance com Lazy Loading

O objetivo desta etapa foi reduzir o tamanho do bundle inicial do Sem Susto, aplicando técnicas de code-splitting através do `React.lazy` e `Suspense`.

## Mudanças Realizadas

### Componentes de UI
- Convertidos 9 componentes de modal para o padrão `export default`. 
- Isso permite que o `React.lazy` identifique corretamente o componente a ser carregado dinamicamente.
- Componentes afetados:
    - [ModalScannerBarras.tsx](../../components/ModalScannerBarras.tsx)
    - [ModalFormularioProduto.tsx](../../components/ModalFormularioProduto.tsx)
    - [ModalLoadingCarrinho.tsx](../../components/ModalLoadingCarrinho.tsx)
    - [ModalAtivarToken.tsx](../../components/ModalAtivarToken.tsx)
    - [ModalConfirmacao.tsx](../../components/ModalConfirmacao.tsx)
    - [ModalDoacao.tsx](../../components/ModalDoacao.tsx)
    - [ModalContato.tsx](../../components/ModalContato.tsx)
    - [ModalTutorialUso.tsx](../../components/ModalTutorialUso.tsx)
    - [DebugConsole.tsx](../../components/DebugConsole.tsx)

### App.tsx
- [App.tsx](../../App.tsx)
- Substituídas as importações estáticas por importações dinâmicas via `lazy`.
- Envolvida toda a lógica de renderização de modais com um componente `<Suspense>`.
- Definido um fallback visual usando o `ModalLoadingCarrinho` para que o usuário saiba que o componente está sendo baixado.
- Corrigida a referência do componente de scanner de `ModalScannerBarras` (JSX) para `ScannerCodigo` (constant lazy).

## Resultado Final

- **Bundle Inicial Menor**: O navegador agora baixa apenas o essencial para mostrar o dashboard.
- **Carregamento sob Demanda**: Códigos complexos como o do Scanner de Barras ou o Modal de Token Premium só são baixados se o usuário clicar para usá-los.
- **Experiência Fluida**: O uso do `Suspense` garante que não ocorram erros de "componente indefinido" durante a transição.

## Padronização de Cores e Acessibilidade

Para atingir a nota máxima em Acessibilidade (SEO/Lighthouse), substituímos o verde principal da aplicação:

- **De:** `verde-600` (`#16a34a` - Contraste borderline em branco)
- **Para:** `verde-700` (`#15803d` - Contraste superior a 4.5:1, aprovado para texto normal)

Esta mudança foi aplicada de forma global em botões, textos e gradientes em todos os componentes de UI.

## Como Verificar
1. Abra as Ferramentas de Desenvolvedor (F12) na aba **Network**.
2. Filtre por **JS**.
3. Ao carregar a página pela primeira vez, observe os arquivos carregados.
4. Clique no botão de "Ler Código". Você verá um novo arquivo `.js` (chunk) sendo baixado dinamicamente no momento do clique.
5. Verifique se o botão "Ler Código" e os botões de ação nos modais agora exibem um tom de verde mais denso e legível.
