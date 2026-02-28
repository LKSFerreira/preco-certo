# Walkthrough: Mock de Pagamento, Resiliência e Feedback Sonoro 🔊

Investigação e correção de inconsistência entre ambientes (DEV vs PROD), melhoria do fluxo de retentativa de pagamento e adição de feedback sonoro sincronizado.

## 🚀 O que mudou?

### 🔍 Diagnóstico de Inconsistência PROD vs DEV
- **Causa Raiz:** A variável `VITE_USAR_MOCK_PAGAMENTO` estava como `true` no `.env` local, mas ausente no painel da Vercel. Isso fazia o frontend em produção usar o `ProvedorMercadoPago` real, que falhava por falta da `MP_ACCESS_TOKEN`.
- **Cadeia de Erro:** `ModalPlano.tsx` → `fabrica.ts` (instancia provedor real) → `mercado-pago.ts` (chama API) → `api/pagamentos/pix.ts` (falha 500) → `catch` no `ModalPlano` → `alert('Erro ao iniciar pagamento')`.

### 🧪 Mock com Simulação de Falha Controlada
- **Primeira Tentativa Falha:** O `ProvedorMock` em `services/pagamento/mock.ts` agora força uma falha proposital na primeira geração de PIX (`contagemGeracoes === 1`). Isso permite testar o fluxo de erro completo na UI.
- **Segunda Tentativa Sucesso:** Ao clicar em "Tentar Novamente", o sistema gera um novo PIX que será aprovado automaticamente.
- **Controle Interno:** Adicionado campo `deveFalhar` no registro simulado e contador `contagemGeracoes` na classe.

### 🔄 Botão "Tentar Novamente" Resiliente
- **Antes:** O botão chamava `aoFechar()`, fechando a modal e obrigando o usuário a refazer todo o fluxo (escolher plano → gerar PIX).
- **Depois:** O botão agora chama `aoTentarNovamente()`, que regenera o PIX para o **mesmo plano** sem fechar a modal.
- **Estado Preservado:** Adicionado `planoSelecionado` no `App.tsx` para manter a referência do plano escolhido entre tentativas.
- **Feedback Visual:** Botão exibe spinner e texto "Gerando novo PIX..." durante o carregamento.

### 🎶 Efeito Sonoro de Confirmação (Web Audio API)
- **Implementação:** Adicionado `useEffect` no componente `NucleoQuantico` que sintetiza um acorde harmônico (Mi Maior) quando o status muda para `SUCESSO`.
- **Sincronização:** O som toca no **mesmo milissegundo** que as animações visuais (`OndaDeChoque` + `ExplosaoDeParticulas`) são ativadas.
- **Zero Dependências:** Usa a Web Audio API nativa do navegador, sem arquivos de áudio externos.
- **Notas:** E5 (659Hz) → G#5 (831Hz) → B5 (988Hz) → E6 (1319Hz, triangle wave), com fade-in/out suave.

---

## 🛠️ Detalhes Técnicos Implementados

### Lógica de Falha Controlada no Mock
```typescript
// services/pagamento/mock.ts
private contagemGeracoes = 0;

// Na geração do PIX:
this.statusSimulado[pagamento_id] = {
    status: 'pendente',
    tentativas: 0,
    deveFalhar: this.contagemGeracoes === 1 // 1ª vez falha
};

// No polling:
registro.status = registro.deveFalhar ? 'falha' : 'aprovado';
```

### Callback de Retentativa no App.tsx
```typescript
// App.tsx - Novo callback
aoTentarNovamente={async () => {
    if (!planoSelecionado) return;
    const servico = fabricaPagamento.obterProvedor();
    const dados = await servico.gerarPix(planoSelecionado);
    setDadosPagamento(dados);
}}
```

### Síntese Sonora via Web Audio API
```typescript
// ModalPagamento.tsx - NucleoQuantico
const ctx = new AudioContext();
playNote(659.25, 0.0, 0.3);     // E5
playNote(830.61, 0.1, 0.3);     // G#5
playNote(987.77, 0.2, 0.3);     // B5
playNote(1318.51, 0.3, 0.8, 'triangle'); // E6
```

---

## ✅ Verificação Realizada

1. **Consistência:** Mapeada a cadeia completa de erro PROD vs DEV e documentada a causa raiz.
2. **Fluxo de Erro:** Mock agora força falha na 1ª tentativa, validando o fluxo de recuperação do usuário.
3. **Retentativa:** Botão "Tentar Novamente" regenera PIX sem fechar a modal, mantendo o plano selecionado.
4. **Polling Seguro:** `useEffect` do polling agora ignora status terminais (`aprovado`, `falha`), evitando requisições desnecessárias.
5. **Áudio:** Som sintetizado toca sincronizado com animações visuais de sucesso, sem dependências externas.
