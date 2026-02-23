# Walkthrough - Acessibilidade e Tutorial 🎨

Atualizei o contraste em todos os componentes para conformidade **WCAG AA** e reconfigurei o gatilho do tutorial para disparo manual.

## 🚀 Mudanças de Acessibilidade
- **Dashboard**: `gray-600` → `gray-700` (Melhor legibilidade).
- **Botões**: `green-500` → `green-600` (Ratio de contraste 4.5:1 atingido).
- **Modais**: Padronização de textos e labels em tons mais escuros para conforto visual.

## 💡 Novo Fluxo do Tutorial
O tutorial de uso não é mais invasivo e não inicia sozinho.
- **Gatilho Inteligente**: Ao clicar em **"Ler Código"**, se for o primeiro acesso, o tutorial aparece. Após clicar em "Entendi", o app abre a câmera automaticamente (continuidade de fluxo).
- **Descoberta**: Clicar em áreas vazias do dashboard também abre o tutorial.
- **Design Limpo**: Áreas neutras não indicam clique (sem cursor pointer), evitando ruído visual.

## 🛠 Validar
1. Rode `npm run dev`.
2. Verifique se o tutorial **não** abre sozinho no primeiro carregamento.
3. Clique em "Ler Código" e confirme que o tutorial abre e, ao fechar, a câmera inicia.
4. Verifique o contraste dos textos usando ferramentas de acessibilidade (Lighthouse/Axe).
