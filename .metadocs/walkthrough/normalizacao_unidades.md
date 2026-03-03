# Walkthrough: Normalização Flexível de Unidades e Tamanho

## Objetivo
Este documento descreve a implementação da lógica de normalização de unidades de medida (peso, volume, quantidade) no projeto Sem Susto.

## Escopo aplicado
- A função `normalizarTamanho(entrada: string): string` foi criada para resolver inconsistências na entrada de dados do usuário e de APIs externas.
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
