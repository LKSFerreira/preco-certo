# Walkthrough: Sistema de Warm-up (Despertador) de APIs

Implementamos um mecanismo reativo para mitigar o problema de "sono" (Cold Start) das funções serverless na Vercel, garantindo que a primeira requisição do usuário seja rápida.

## 🛠️ Mudanças Realizadas

### services/warmup.ts
Criamos um serviço centralizado que:
- Dispara requisições `HEAD` (ultra-leves) para o Proxy de IA e o Proxy do Cosmos.
- Utiliza um **Throttle de 10 minutos** via `localStorage` para evitar desperdício de banda.
- Respeita a variável de ambiente `VITE_COLD_START_API`.

### App.tsx
Integramos o despertador no momento exato:
- Quando o usuário clica em **"Ler Código"**, o ping é enviado.
- Enquanto o scanner inicializa e o usuário foca o produto, a Vercel "acorda" o servidor em paralelo.

---

## ✅ Verificação de Funcionamento

1. **Gatilho Silencioso:** Ao clicar no botão, você verá no console (em dev) a mensagem:
   `⏰ [WARMUP] Acordando APIs serverless para evitar Cold Start...`
2. **Throttle Inteligente:** Se você fechar o scanner e clicar de novo rapidamente, a mensagem não aparecerá, pois o sistema sabe que a API ainda está "quente".
3. **Controle Remoto:** Para desativar, basta configurar `VITE_COLD_START_API=false` no seu ambiente.

---

## 🚀 Próximos Passos
- Realize o deploy para a Vercel.
- Monitore se as primeiras requisições de GTINs novos após longos períodos de inatividade agora respondem de primeira sem erros de timeout.
