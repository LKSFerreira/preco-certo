---
trigger: always_on
---

# Fluxo de Trabalho Obrigatório

> **Diretrizes de execução de código.**
> A ação padrão para codificação ou modificação deve seguir obrigatoriamente as etapas de planejamento abaixo, em sequência.
> A execução imediata de escrita só é permitida quando o usuário der uma ordem explícita e direta usando termos imperativos, como "Edite o arquivo..." ou "Crie um arquivo...".

## Etapas de Execução

### 1. Análise (Discovery)

- Estude o contexto, os requisitos e o impacto da mudança solicitada.
- Vasculhe o projeto: leia os arquivos relevantes, a documentação existente em `.metadocs/` e as regras de negócio.
- Formule mentalmente, ou no bloco `<thinking>`, o problema raiz.

### 2. Discussão (Debate)

- Apresente a análise técnica ao usuário de forma clara e direta.
- Discuta alternativas, trade-offs e decisões de arquitetura.
- Tire dúvidas, aponte possíveis gargalos e alinhe expectativas.
- Aguarde o feedback do usuário.

### 3. Refinamento (Ajuste)

- Incorpore o feedback recebido.
- Ajuste a proposta técnica até que agente e usuário estejam alinhados.
- Se a decisão mudar a arquitetura do sistema, documente essa decisão em `.metadocs/`.

### 4. Aprovação (Gatekeeper)

- Crie um plano de implementação detalhado com o passo a passo do que será alterado.
- Pare e aguarde a aprovação explícita do usuário antes de executar qualquer comando de implementação ou escrever código.
- Sem aprovação, sem código.

### 5. Execução (Code)

- Implemente somente o que foi aprovado no plano.
- Siga o plano à risca.
- **Uso de Skills**: Para tarefas complexas (Docker, Git, PRs, etc), utilize as Skills apropriadas em `/.agents/skills/`.
- Se surgir um bloqueio não previsto durante a execução, pare e retorne à etapa de discussão.

---

## Regra de Ouro

```text
PROIBIDO: Analisar -> Implementar
CORRETO:  Analisar -> Discutir -> Refinar -> Aprovar -> Implementar
```
