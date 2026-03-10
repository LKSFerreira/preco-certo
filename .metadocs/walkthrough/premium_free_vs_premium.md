# Walkthrough: Free vs Premium Local First

> **Última atualização:** 2026-03-09
> **Status:** Concluído / Implementado
> **Tipo:** Produto, UX e segurança custo-benefício
> **Origem:** Debate derivado de `.metadocs/monetizacao.md`

---

## 1. Contexto

O projeto já possui:

- fluxo de monetização com pagamento e geração de token;
- ativação de token premium;
- backend capaz de validar se um token está ativo ou expirado;
- UI de planos premium;
- armazenamento local para catálogo, carrinho e histórico.

O problema original era que a diferenciação real entre usuário gratuito e usuário premium não estava refletida no comportamento do código de forma consistente.

---

## 2. Estado Atual Real

### O que já existe

- `tokens`, `dispositivos` e `tentativas_ativacao` no backend;
- endpoint de ativação de token;
- endpoint de consulta de status do token;
- validação server-side de acesso premium em rotas sensíveis;
- hash do token armazenado no cliente;
- `dias_restantes` armazenado localmente para UX;
- histórico local já implementado no cliente;
- carrinho local já implementado no cliente.

### O que foi implementado de forma consistente

- o limite free de carrinho é agora aplicado na regra de negócio do cliente;
- o histórico foi tratado como feature premium de forma explícita e migrado para `IndexedDB`;
- o estado premium foi centralizado como uma entitlement clara no frontend via `useEntitlementPremium`;
- a UI bloqueia funcionalidades (`ModalBloqueio`) e adapta CTAs usando o gating visual derivado da entitlement.

---

## 3. Decisão Arquitetural

### Decisão Executada

As seguintes features premium de baixo custo e alto impacto foram implementadas:

1. limite restrito de 15 itens distintos no carrinho gratuito;
2. acesso visual ao histórico de compras bloqueado apenas para usuário premium.

### Princípio de segurança adotado

O backend será a **fonte de verdade** para determinar se o usuário está premium ou não.

O frontend poderá manter cache derivado desse estado para melhorar UX e suportar uso local, mas não deve considerar como suficiente apenas:

- a presença do hash no `localStorage`;
- a presença de dias restantes no cliente;
- estado visual isolado da UI.

### O que esta decisão explicitamente não promete

- não torna a aplicação inviolável contra DevTools;
- não transforma uma feature local em uma feature impossível de adulterar;
- não exige Supabase ou banco remoto para começar a entregar valor premium real.

O objetivo aqui é **custo-benefício**, não segurança absoluta.

---

## 4. Regras de Negócio Aprovadas

### 4.1 Carrinho gratuito

Usuário gratuito pode ter no máximo **15 itens distintos** no carrinho.

#### Definição de item distinto

Conta como item distinto cada `codigo_barras` único presente no carrinho.

#### Exemplo

Se o carrinho tiver:

- Banana `quantidade=1`
- Detergente `quantidade=5`
- Copo de vidro `quantidade=10`

isso representa **3 itens distintos**, não 16 unidades.

#### Regra operacional

- se o produto já estiver no carrinho, o usuário gratuito pode alterar a quantidade normalmente;
- se o produto ainda não estiver no carrinho e a inclusão criar o 16º item distinto, a ação deve ser bloqueada;
- usuário premium não possui esse limite.

### 4.2 Histórico de compras

O histórico continuará sendo salvo localmente, mas a visualização será tratada como feature premium.

#### Decisão de storage

O histórico deve ser persistido em **IndexedDB**, e não em `localStorage`.

#### Regra de produto

- o registro da compra pode continuar existindo localmente;
- o benefício premium é o acesso à tela/listagem do histórico;
- usuário gratuito não acessa a experiência de histórico;
- usuário premium acessa o histórico completo armazenado localmente.

### 4.3 CTA Premium no header

O botão de coração que abre a `ModalPlano` deve ficar oculto enquanto o usuário estiver com premium ativo e validado.

#### Regra de visibilidade

O botão:

- aparece para usuário gratuito;
- aparece quando não existe premium válido;
- aparece novamente quando o premium expira ou perde validade;
- fica oculto quando o estado premium validado estiver ativo.

---

## 5. Modelo de Entitlement Premium

### Fonte de verdade

O backend já possui os dados necessários para responder:

- se o token existe;
- se está ativo;
- se expirou;
- quantos dias restam;
- se o dispositivo está vinculado corretamente.

Portanto, a entitlement premium no app deve derivar prioritariamente do backend.

### Estratégia recomendada

O frontend deve manter um estado centralizado de entitlement premium com os seguintes dados mínimos:

- `status`
- `plano`
- `diasRestantes`
- `expiraEm`
- `ultimaValidacaoEm`

### Revalidação custo-benefício

Não usar polling agressivo.

Revalidar:

- no boot da aplicação;
- quando o app voltar para foreground;
- quando o usuário tentar usar uma feature premium;
- quando o cache local estiver vencido.

### TTL recomendado

Usar um TTL curto a moderado para o cache local do estado premium.

Valor sugerido para esta fase:

- **5 minutos**

### Comportamento offline

Se houver uma última validação bem-sucedida e o token ainda estiver dentro da janela válida, o frontend pode respeitar temporariamente esse estado premium offline.

Ao voltar a ficar online, a aplicação deve revalidar.

---

## 6. Estratégia Adotada e Implementada

### 6.1 Limite de carrinho

A regra será aplicada no cliente porque o carrinho é local-only.

#### Consequência

Isso é uma proteção de produto e UX, não uma blindagem absoluta.

#### Valor prático

Mesmo sendo client-side, já cria diferença real entre:

- usuário free;
- usuário premium ativo.

### 6.2 Histórico premium

O histórico deve ser migrado para IndexedDB e consumido por uma tela premium.

#### Motivo da escolha

- maior capacidade;
- melhor aderência à estratégia local-first;
- menor exposição casual do que `localStorage`;
- base melhor para evolução futura.

### 6.3 UI premium

A UI deve reagir ao estado centralizado de premium, e não a heurísticas espalhadas.

Isso inclui:

- ocultar o botão do coração enquanto premium ativo;
- bloquear o 16º item distinto para usuário free;
- liberar histórico apenas para usuário premium;
- exibir CTA claro quando o usuário gratuito tentar usar uma feature premium.

---

## 7. Alternativas Avaliadas

### Alternativa A - Premium decidido só pelo cliente

**Exemplos**

- apenas `localStorage`;
- apenas hash local;
- apenas esconder botões.

**Vantagens**

- implementação rápida.

**Desvantagens**

- frágil;
- inconsistente;
- fácil de burlar;
- não aproveita a fonte de verdade já existente no backend.

**Decisão:** descartada.

### Alternativa B - Premium decidido sempre por backend sem cache local

**Vantagens**

- modelo mais rígido;
- maior coerência de entitlement.

**Desvantagens**

- piora UX local-first;
- gera tráfego desnecessário;
- aumenta acoplamento síncrono com rede para ações simples.

**Decisão:** descartada para esta fase.

### Alternativa C - Backend como fonte de verdade + cache local derivado

**Vantagens**

- melhor custo-benefício;
- mantém consistência;
- aproveita a arquitetura já existente;
- suporta UX local-first com revalidação inteligente.

**Desvantagens**

- ainda não elimina adulteração local por usuário avançado;
- exige uma pequena camada nova de estado premium no frontend.

**Decisão:** aprovada.

---

## 8. Escopo da Fase

### Dentro do escopo

- consolidar entitlement premium no frontend;
- aplicar limite de 15 itens distintos no carrinho para free;
- migrar histórico de compras para IndexedDB;
- criar acesso premium ao histórico;
- ocultar CTA premium no header enquanto premium válido;
- definir a lógica de revalidação custo-benefício do estado premium.

### Fora do escopo

- tornar o cliente inviolável;
- sincronizar histórico com backend ou Supabase;
- mudar carrinho para backend;
- autenticação por conta de usuário;
- proteção criptográfica do histórico local;
- nova engine complexa de permissões.

---

## 9. Riscos e Observações

### Risco técnico

Como o carrinho e o histórico são locais, ainda existirão superfícies de manipulação no navegador.

### Risco de produto

Se a UI prometer mais do que o comportamento real entrega, o premium vira uma frustração de usuário.

### Observação importante

O foco desta entrega deve ser:

- entregar valor real para o premium;
- reduzir inconsistência entre documento e código;
- testar fluxo free e premium de forma crível;
- sem inflar escopo antes da etapa de Supabase/PostgreSQL remoto.

---

## 10. Validação de Sucesso

- [x] O usuário gratuito não consegue adicionar o 16º item distinto no carrinho, exibindo o `ModalBloqueio`;
- [x] O usuário gratuito continua podendo alterar quantidade de itens já existentes;
- [x] O histórico acessa diretamente o storage no `IndexedDB`;
- [x] O usuário premium consegue acessar e ler o histórico local normalmente;
- [x] O botão do coração oculta para um premium validado;
- [x] O estado premium do app é coerentemente revalidado em background de forma controlada (`TTL = 5 min`, respeitando visibilidade de abas).

---

## 11. Referências

- [monetizacao.md](../monetizacao.md)
- [roadmap.md](../roadmap.md)
- [ux_premium_feedback.md](../walkthrough/ux_premium_feedback.md)
- [monetizacao_premium_final.md](../walkthrough/monetizacao_premium_final.md)
- [premium.ts](/c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/repositorios/premium.ts)
- [local-storage.ts](/c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/repositorios/local-storage.ts)
- [App.tsx](/c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/App.tsx)

---

## 12. Guia para Futuras Features Premium

Esta seção existe para evitar rediscussão completa toda vez que uma nova feature premium surgir.

### 14.1 Princípio fixo

Toda nova feature premium deve responder a três perguntas:

1. a fonte de verdade da entitlement depende do backend ou apenas da UI;
2. a feature é local-only ou exige regra server-side;
3. o bloqueio é de produto, de UX ou de segurança real.

### 14.2 Convenção adotada

- backend continua como fonte de verdade do estado premium;
- frontend mantém apenas cache derivado para UX;
- bloqueios locais são aceitáveis quando a feature é local-only;
- tudo que protege recurso sensível de servidor deve ser validado no backend;
- evitar soluções “criptográficas” cosméticas no cliente quando a chave também vive no cliente.

### 14.3 Regra de classificação

#### Feature premium local-only

Exemplos:

- telas exclusivas;
- histórico local;
- limites de UI;
- experiências de conveniência.

Implementação padrão:

- usar entitlement premium centralizada no cliente;
- aplicar gating de UI;
- armazenar dados locais em storage adequado;
- aceitar que o objetivo é custo-benefício, não inviolabilidade.

#### Feature premium com custo de backend

Exemplos:

- IA;
- exportações geradas no servidor;
- consultas protegidas;
- operações que usam banco remoto ou terceiros.

Implementação padrão:

- validar premium no backend;
- não confiar apenas em flags do cliente;
- usar cliente apenas como cache de UX.

### 14.4 Checklist antes de aprovar nova feature premium

- a diferença entre free e premium é real e perceptível;
- a implementação é proporcional ao valor da feature;
- o bloqueio escolhido faz sentido para o tipo da feature;
- a UX do usuário gratuito continua útil e honesta;
- a solução não depende de reanalisar monetização inteira do zero.

### 14.5 Regra de ouro

Não adicionar feature premium nova apenas porque “parece premium”.

A feature precisa cumprir pelo menos um destes objetivos:

- aumentar valor percebido real;
- reduzir custo operacional do free tier;
- reforçar retenção de usuário premium;
- ser simples o suficiente para manter coerência com a arquitetura atual.
