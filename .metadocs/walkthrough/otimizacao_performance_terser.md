# Walkthrough: Otimização de Performance (Lighthouse 100)

Implementamos as melhorias de build sugeridas para reduzir o **Speed Index** e a latência de renderização inicial no mobile.

## 🚀 Mudanças Realizadas

### 📦 Minificação Avançada (Terser)
- Instalamos o `terser` como dependência de desenvolvimento.
- Configuramos o `vite.config.ts` para usar o Terser como minificador padrão.
- Ativamos o `drop_console` e `drop_debugger`, garantindo que o código de produção não perca tempo processando logs.

### 🎨 Otimização de Estilos
- Desativamos o `cssCodeSplit` no build para gerar um único arquivo CSS, reduzindo o número de requisições HTTP críticas durante o carregamento inicial.

### 🏗️ Build em Docker
- O build foi executado com sucesso dentro do container `app` utilizando o comando:
  ```bash
  docker compose -f .docker/compose.yaml exec app npm run build
  ```

## 📊 Resultados Técnicos
- **Artefatos Gerados:** Scripts e CSS minificados agora residem em `dist/assets`.
- **Bundle Limpo:** Nenhuma referência a `console.log` global ou `debugger` no bundle de produção.
- **Persistência Estratégica:** A chamada `localStorage.clear()` foi mantida no `App.tsx` conforme sua observação técnica para a fase atual de testes.

## 🏁 Próximos Passos
1. Realizar o deploy dos arquivos na pasta `dist`.
2. Rodar o Lighthouse em ambiente de produção (mobile) para confirmar a subida da nota de performance.
