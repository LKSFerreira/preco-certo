# Walkthrough: Monetização e Pagamentos Premium 💎

Implementação do sistema de contribuição voluntária com planos premium, utilizando o Mercado Pago (PIX) e o padrão arquitetural Strategy.

## 🚀 O que mudou?

### 🧠 Arquitetura Core (Strategy Pattern)
- **Interface Universal:** Criada em `services/pagamento/tipos.ts`, permitindo a troca de gateway de pagamento sem alterar o frontend.
- **Provider Mercado Pago:** Implementado em `services/pagamento/mercado-pago.ts` com mapeamento de status genérico.
- **Segurança de Preços:** Vercel Function em `api/pagamentos/pix.ts` atua como fonte da verdade, validando preços no servidor.
- **Proteção de Segredos:** Removido o prefixo `VITE_` da `MP_ACCESS_TOKEN`, garantindo que chaves privadas fiquem restritas ao servidor.

### 🔌 Servidor Local (Adapter)
- **Mapeamento de Endpoints:** O `scripts/server.ts` agora reconhece e roteia chamadas para `/api/pagamentos/pix` e `/api/pagamentos/status`, permitindo testar o fluxo de pagamento completo em ambiente Docker/Desenvolvimento.
- **ModalPlano:** Substitui a antiga `ModalDoacao`. Oferece uma tabela comparativa e cards interativos para os planos Café, Lanche e Apoiador.
- **ModalPagamento:** Exibe o QR Code PIX com sistema de **Polling Seguro**:
  - **Cleanup:** Interrompe requisições se a modal for fechada.
  - **Hard Timeout:** Encerra o polling após 15 minutos (tempo de expiração do PIX).
- **Feedback em Tempo Real:** Detecta automaticamente a aprovação do banco.

### 🧪 Mock de Desenvolvimento
- **ProvedorMock:** Criado para permitir testes de fluxo completo (Plano -> PIX -> Sucesso) sem chaves reais.
- **Aprovação Automática:** Simula o sucesso do pagamento após 3 ciclos de polling (aprox. 15 segundos), ideal para validar a UI de transição.
- **Toggle:** Ativável via `VITE_USAR_MOCK_PAGAMENTO=true` no `.env`.

### 🛠️ Script de Automação (`premium.sh`)
- **Wrapper Inteligente:** Criado o script `./premium.sh` que encapsula a execução do gerador Python no container `processor`.
- **Auto-correção:** O script detecta automaticamente se as tabelas do banco de dados estão ausentes e roda o `init_db.py` antes de falhar.
- **UX Dev:** Gera um link direto de ativação clicável (ex: `http://localhost:5173/ativar/TOKEN`) para agilizar testes.

### 🎨 Refinamento de UI e Responsividade
- **ModalPlano Adaptativo:** Refatorado para usar `media queries` de altura (`max-height: 720px`), garantindo que o conteúdo seja legível e não escape da tela em dispositivos pequenos ou com teclado aberto.
- **Aesthetics Premium:** Adicionadas animações de "brilho de ouro" e fluxo de gradiente nos planos de destaque, elevando a percepção de valor.

---

## 🛠️ Detalhes Técnicos Implementados

### Polling Robusto
```typescript
// Implementado em ModalPagamento.tsx
const interval_id = setInterval(async () => {
    if (Date.now() > timeout_limite) {
        clearInterval(interval_id);
        setStatus('expirado');
        return;
    }
    // ... consulta status genérico ...
}, 5000);
```

### Validação no Backend
```typescript
// Implementado em api/pagamentos/pix.ts
const TABELA_PRECOS = {
  plano_cafe: { valor: 4.90, descricao: 'Plano Café - 15 dias' },
  // ...
};
```

---

## ✅ Verificação Realizada

1. **Abstração:** Verificado que `App.tsx` não menciona termos do Mercado Pago (usa apenas o Strategy).
2. **Persistence:** `ModalDoacao.tsx` foi preservado no sistema para usos futuros.
3. **UX State:** Botões de planos agora possuem estado de "Carregando" durante a geração do pedido.
4. **Responsividade:** Validado comportamento da `ModalPlano` em simulação de tela mobile reduzida.
5. **Automação:** Testado o fluxo `./premium.sh` com banco de dados limpo (verificado que a migração é aplicada automaticamente).
