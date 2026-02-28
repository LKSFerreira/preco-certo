# Walkthrough: Normalização de Unidades e Tamanho

## Objetivo
Implementar uma camada única de normalização de `tamanho` antes da validação, aceitando entradas inconsistentes de usuário/API e mantendo a regex central como fonte de verdade.

## Escopo aplicado
- Criação da função `normalizarTamanho` em `services/utilitarios.ts`.
- Reuso de `UNIT_MAP` para canônicos de SI e comerciais.
- Normalização aplicada no formulário antes de validar e antes de salvar.
- Normalização aplicada nos fluxos de OFF/Cosmos/IA.
- Remoção de transformações conflitantes (`toUpperCase`) no fluxo de tamanho.
- Correção da mensagem de erro com exemplos válidos.

## Regras canônicas implementadas
- Formato final: `numero + espaço + unidade`.
- SI: `L`, `mL`, `g`, `kg`, `mg`.
- Comerciais: `uni`, `cx`, `pct`, `pç`.
- Entrada estruturalmente inválida permanece sem transformação e falha apenas na validação.

## Arquivos alterados
- `services/utilitarios.ts`
- `constants.ts`
- `components/ModalFormularioProduto.tsx`
- `services/adapters/openfoodfacts.adapter.ts`
- `services/openfoodfacts.ts`
- `services/cosmos.ts`
- `services/ia/groq.ts`

## Decisões técnicas
- `REGEX_UNIDADE` permanece derivada de `UNIT_MAP` (sem duplicação de regra).
- O formulário normaliza no `blur` e no `submit`.
- Campos de payload externo (OFF/Cosmos) foram mantidos em inglês por refletirem contrato de API.
- Identificadores internos com bom ganho de legibilidade foram traduzidos para pt-BR (`normalizarTamanho`, `precoInput`, `URL_API_OFF`, `URL_API_COSMOS`).

## Resultado prático
- Entradas como `1L`, `250ML`, `10UNI`, `1CX`, `3PC` são aceitas e padronizadas para `1 L`, `250 mL`, `10 uni`, `1 cx`, `3 pç`.
- A validação deixa de reprovar apenas por formatação.
