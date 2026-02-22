# Walkthrough: Trava de Segurança OCR-First Reativa

Corrigida a falha onde remover uma foto corrompida mantinha os campos de texto liberados para edição. A solução adotada remove o estado manual de fase e o torna uma consequência direta da presença da imagem.

## Mudanças Realizadas

### Componentes de UI

#### [FormularioProduto.tsx](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/components/FormularioProduto.tsx)
- **Estado Dinâmico:** Implementado `useMemo` para `faseFormulario`. Agora o app "sabe" que está na fase de foto sempre que a imagem é `undefined`.
- **Bloqueio Seletivo:** 
  - Campos **Produto**, **Marca** e **Tamanho** são bloqueados estritamente na ausência de foto.
  - Campo **Preço** permanece liberado para edição manual a qualquer momento.
- **Correção de Foco:** O sistema de foco automático ignora campos bloqueados e foca diretamente no preço se a foto ainda não tiver sido tirada.

## Testes Realizados

### Verificação de Fluxo
1. **Remoção de Foto:** Ao clicar na lixeira de uma foto já carregada, os inputs de texto tornaram-se opacos e desabilitados instantaneamente.
2. **Erro de Carregamento:** O evento `onError` da imagem (que dispara quando o link da API está quebrado) agora reseta a imagem e, por consequência, bloqueia os campos via estado derivado.
3. **Foco:** Sem foto, a página foca automaticamente no campo de preço após o carregamento inicial.

## Como Validar
1. Abra o cadastro de um novo produto (código desconhecido).
2. Tente digitar na "Descrição" antes de tirar foto -> **Deve estar bloqueado.**
3. Digite no campo "Preço" -> **Deve estar liberado.**
4. Tire uma foto -> **Campos de texto devem liberar.**
5. Remova a foto clicando no ícone de lixeira -> **Campos de texto devem bloquear novamente.**
