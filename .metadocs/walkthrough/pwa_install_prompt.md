# Walkthrough: Infraestrutura PWA e Prompt de Instalação 📱

Implementação completa da infraestrutura de Progressive Web App (PWA) e um sistema customizado de convite para instalação ("Adicionar à Tela Inicial") com controle de frequência.

## 🚀 O que mudou?

### 🏗️ Infraestrutura PWA (Fase 1)
- **Manifesto Web:** Criado o arquivo [manifest.json](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/public/manifest.json) definindo cores, nome e ícones adaptativos (maskable).
- **Service Worker:** Implementado o [sw.js](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/public/sw.js) com estratégia *Network-first* (com fallback para cache offline). O SW é essencial para que o navegador considere o site instalável.
- **Registro Automático:** Adicionado script de registro no [index.html](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/index.html), garantindo que o SW seja ativado no carregamento da página.

### 🎨 Banner de Instalação Premium
- **Banner Customizado:** Criado o componente [BannerInstalarApp.tsx](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/BannerInstalarApp.tsx) com design em gradiente esmeralda, bordas arredondadas e ícone do app.
- **Lógica de Interceptação:** O componente escuta o evento `beforeinstallprompt` do navegador, impedindo o banner nativo genérico e exibindo a nossa versão personalizada.
- **Slide-up/down Animation:** Animações fluidas de entrada e saída para uma experiência premium.

### 🧠 Inteligência e Frequência
- **Controle Mensal:** Implementada lógica via `localStorage` que garante que o banner apareça no máximo **1 vez a cada 30 dias** se o usuário recusar.
- **Standalone Detection:** O app detecta automaticamente se já está instalado ou rodando via atalho e oculta o banner permanentemente nesses casos.
- **Mobile Only:** A exibição é restrita a dispositivos mobile (Android/iOS).

---

## 🛠️ Detalhes Técnicos Implementados

### Interceptação do Prompt Nativo
```typescript
// BannerInstalarApp.tsx
window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault(); // Impede o banner padrão
  eventoInstalacao.current = evento; // Salva para disparar depois
  setTimeout(() => setVisivel(true), 2500); // Exibe o nosso após delay
});
```

### Manifest Maskable Icon
O uso do `purpose: "any maskable"` no `manifest.json` garante que o ícone do Sem Susto se adapte perfeitamente aos diferentes formatos de ícones (círculo, quadrado, gota) de diversos fabricantes Android.

---

## ✅ Verificação Realizada

1. **Manifesto:** Validado que a cor do tema (`#22c55e`) e o nome estão corretos para o branding.
2. **Registro de SW:** Verificado no `index.html` que o registro ocorre de forma assíncrona após o carregamento da janela.
3. **Persistência:** Validada a chave `pwa_ultimo_prompt` no `localStorage` para controle de recorrência de 30 dias.
4. **UX:** O delay de 2.5s antes da exibição garante que o banner não "soque" a tela assim que o app carrega, melhorando a percepção de performance.
