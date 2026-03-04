# Estratégia de Monetização - Sem Susto 💰

> **Última atualização:** 2026-02-10
> **Status:** ✅ Aprovado (regras de negócio alinhadas)

---

## 1. Filosofia

O Sem Susto é um ambiente **seguro, saudável e confiável**. A monetização respeita isso:

- ❌ Zero anúncios (banners, intersticiais, AdSense)
- ❌ Zero venda de dados pessoais
- ❌ Zero dark patterns
- ✅ Modelo baseado em **contribuição voluntária** com benefícios reais

> **Terminologia:** Usamos "contribuição" e não "doação" porque o usuário **recebe benefícios em troca**. Juridicamente, isso é uma venda de serviço, não uma doação. Chamar de "doação" poderia gerar problemas fiscais.

---

## 2. Planos de Contribuição

| Plano       | Valor   | Duração | Custo/dia |
| ----------- | ------- | ------- | --------- |
| ☕ Café     | R$ 2,90 | 15 dias | R$ 0,19   |
| 🥤 Lanche   | R$ 4,90 | 30 dias | R$ 0,16   |
| 🎁 Apoiador | R$ 9,90 | 60 dias | R$ 0,17   |

**Estratégia de precificação:** O plano "Lanche" oferece o melhor custo-benefício relativo (30 dias por apenas R$2 a mais que o Café), induzindo o usuário a escolhê-lo. Isso gera uma receita mensal previsível.

---

## 3. Funcionalidades: Gratuito vs Premium

| Funcionalidade              | Gratuito            | Premium      |
| --------------------------- | ------------------- | ------------ |
| Scanner de código de barras | ✅                  | ✅           |
| IA para leitura de rótulos  | ✅ (limite: 10/dia) | ✅ Ilimitado |
| Carrinho                    | ✅ (máx 15 itens)   | ✅ Ilimitado |
| Histórico de compras        | ❌                  | ✅           |
| Acompanhamento de preços    | ❌                  | ✅           |
| Exportar lista (PDF)        | ❌                  | ✅           |

---

## 4. Sistema de Tokens Anônimos

### 4.1 Especificação do Token

| Aspecto                  | Valor                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------- |
| **Formato**              | `SEM-SUSTO-XXXXXXX` (7 caracteres)                                                 |
| **Charset**              | Alfanumérico, sem ambíguos (excluídos: `0`, `O`, `1`, `I`, `L`)                    |
| **Base**                 | 30 caracteres (A-Z filtrado + 2-9)                                                 |
| **Combinações**          | ~21,8 bilhões                                                                      |
| **Caracteres especiais** | ❌ Proibidos (conflitam com URLs: `#` = fragment, `&` = separador, `%` = encoding) |
| **Exemplo**              | `SEM-SUSTO-A7X9K2B`                                                                |

> **Segurança:** O token só é gerado após confirmação de pagamento. Não existe no banco até esse momento — impossível adivinhar algo que não existe.

### 4.2 Ciclo de Vida

```
[INEXISTENTE] → Pagamento confirmado → [GERADO] → Usuário ativa → [ATIVO] → Tempo expira → [EXPIRADO]
```

- **GERADO:** Token existe no banco, aguardando primeira ativação. Sem data de expiração ainda.
- **ATIVO:** Contagem regressiva iniciada a partir da primeira ativação.
- **EXPIRADO:** Funcionalidades voltam ao modo gratuito automaticamente.

### 4.3 Limite de Dispositivos

| Regra                        | Valor                                                           |
| ---------------------------- | --------------------------------------------------------------- |
| **Máximo de dispositivos**   | 2 por token                                                     |
| **Cooldown entre ativações** | 24 horas entre dispositivos diferentes                          |
| **Fingerprint**              | Hash de: tela + user-agent + timezone + idioma                  |
| **3º dispositivo**           | ❌ Bloqueado com mensagem: `"Limite de dispositivos atingido."` |

### 4.4 Anti-Abuso e Métricas

**A cada tentativa de ativação, coletar:**

- Timestamp
- Hash do IP (não o IP em si — LGPD)
- Hash do User-Agent
- Fingerprint do dispositivo
- Resultado (sucesso/falha/motivo)

**Regras de proteção:**

- Máximo de **5 tentativas de ativação** por IP por hora
- Se >10 tentativas em tokens inexistentes → bloqueio temporário do IP (1h)
- Log de ativações para análise futura de padrões anômalos

---

## 5. URL de Ativação

**Formato:**

```
https://semsusto.app/ativar/SEM-SUSTO-A7X9K2B
```

Funciona via deep link: usuário clica → app abre → token pré-preenchido → um clique para ativar.

---

## 6. Fluxo de Pagamento (MVP)

### 6.1 Estratégia: Polling

O frontend consulta o status do pagamento a cada 5 segundos até confirmação. Zero backend necessário no MVP.

```
1. Usuário escolhe plano no app
2. App cria pagamento PIX via API Mercado Pago
3. App exibe QR Code + "Aguardando pagamento..."
4. App consulta status a cada 5s (polling)
5. Pagamento confirmado → Token gerado → Modal exibida
```

> **Evolução futura:** Realizar uma discussão sobre a melhor forma de receber pagamentos quando migrar para Supabase, usar Edge Function para receber webhook do Mercado Pago (mais robusto).

### 6.2 Gateway: Mercado Pago

| Aspecto     | Detalhe                  |
| ----------- | ------------------------ |
| **Custo**   | ~0,33% por transação PIX |
| **Webhook** | Disponível (futuro)      |
| **QR Code** | Gerado via API           |

### 6.3 Modal Pós-Pagamento

```
┌──────────────────────────────────────┐
│  ✅ Pagamento confirmado!           │
│                                      │
│  Seu token: SEM-SUSTO-A7X9K2B        │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  ⚡ Ativar agora            │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  💾 Salvar no meu WhatsApp  │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  🎁 Enviar para alguém      │    │
│  └──────────────────────────────┘    │
│                                      │
│  "Este código é seu acesso premium.  │
│   Guarde-o com cuidado."             │
└──────────────────────────────────────┘
```

**Frases assertivas por contexto:**

| Ação                   | Frase                                                 |
| ---------------------- | ----------------------------------------------------- |
| Token gerado           | `"Este código é seu acesso premium. Guarde-o."`       |
| Ativar agora           | `"Premium ativado! Válido por X dias."`               |
| Salvar WhatsApp        | `"Token enviado para seu WhatsApp."`                  |
| Enviar para alguém     | `"Quem receber poderá ativar o premium."`             |
| Token expirado         | `"Token expirado. Contribua novamente para renovar."` |
| Limite de dispositivos | `"Limite de 2 dispositivos atingido."`                |

**WhatsApp deep link (custo zero):**

```
https://wa.me/?text=🔑 Meu token Sem Susto: SEM-SUSTO-A7X9K2B — Ative em https://semsusto.app/ativar/SEM-SUSTO-A7X9K2B
```

---

## 7. Privacidade e LGPD

| Dado            | Armazenamos? | Observação                                                  |
| --------------- | ------------ | ----------------------------------------------------------- |
| Nome            | ❌           | Nunca                                                       |
| E-mail          | ❌           | Apenas futuro, se o usuário fornecer voluntariamente        |
| CPF             | ❌           | Nunca                                                       |
| Telefone        | ❌           | Usado apenas para gerar deep link WhatsApp (não armazenado) |
| Token           | ✅           | Hash do token, não o token em si                            |
| Dados de compra | ✅           | Vinculados ao token, não a uma pessoa                       |
| IP              | ❌           | Apenas hash para rate limiting (não o IP em si)             |

**Resultado:** LGPD-compliant by design. Sem dados pessoais, sem preocupação.

---

## 8. Envio de Token por E-mail (Futuro)

| Serviço      | Free Tier                      | Status                           |
| ------------ | ------------------------------ | -------------------------------- |
| **Resend**   | 3.000 e-mails/mês (100/dia)    | 📋 Documentado, não implementado |
| ~~SendGrid~~ | ~~Descontinuado em maio/2025~~ | ❌ Descartado                    |

> Reservado como canal alternativo caso necessário. Não faz parte do MVP.

---

## 9. Monetização Futura (Backlog)

- [ ] **Parcerias com estabelecimentos:** Indicar locais de economia real (afiliação, não propaganda)
- [ ] **Afiliados contextuais:** Sugerir alternativa mais barata em loja online parceira
- [ ] **Relatórios B2B:** Dados anonimizados de variação de preço por região
- [ ] **White Label:** Versão personalizada para pequenos mercados

---

## 10. O que EVITAR 🚫

- ❌ Banners de AdSense
- ❌ Vídeos intersticiais
- ❌ Vender dados pessoais
- ❌ Paywall agressivo (app deve ser útil mesmo sem pagar)
- ❌ Assinatura recorrente automática (contribuição sempre voluntária e consciente)
