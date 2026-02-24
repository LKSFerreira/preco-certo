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
