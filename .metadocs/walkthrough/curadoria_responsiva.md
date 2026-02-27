# Walkthrough: Curadoria Responsiva (Produção)

## Contexto
Foi executada uma rodada de ajustes de responsividade com base no `report_curadoria.md`, focando apenas em:

- tamanho;
- padding/margem;
- limites de altura/largura;
- overflow/rolagem;
- área clicável e foco de inputs.

Não foram alterados core de negócio, identidade visual, brilho ou efeitos.

## Escopo Ajustado

### 1) Tela principal com rodapé sempre visível
Arquivo: `App.tsx`

- Estrutura principal convertida para `100dvh` para estabilizar viewport mobile.
- Rolagem isolada no `main` (`overflow-y-auto`) para evitar que o rodapé “suma”.
- Rodapé passou a ser bloco fixo no fluxo vertical do layout (`shrink-0`) com `safe-area`.

Resultado: `Total Geral` e botão `Ler Código` permanecem visíveis mesmo com listas longas.

### 2) ModalScanner com teclado e telas curtas
Arquivo: `components/ModalScannerBarras.tsx`

- Modal ancorada em `justify-end` em telas pequenas para reduzir corte por teclado.
- Altura máxima baseada em `100dvh` + `safe-area`.
- Ajuste de `min-h` e espaçamentos para preservar campo manual e botão `OK`.

Resultado: redução de corte de CTA e melhor acesso ao formulário manual com teclado aberto.

### 3) ModalPlano (botão X e recorte de conteúdo)
Arquivo: `components/ModalPlano.tsx`

- Overlay com `overflow-y-auto` para conteúdo longo.
- Card com `max-h` calculado por viewport.
- Elementos decorativos marcados com `pointer-events-none`.
- Botão de fechar priorizado com `z-20`.

Resultado: botão `X` volta a responder de forma consistente e modal não corta conteúdo em telas baixas.

### 4) Tutoriais sem ícone do topo
Arquivos:
- `components/ModalTutorialUso.tsx`
- `components/ModalTutorialFoto.tsx`

- Removidos os blocos de ícone/emoji/SVG do topo.
- Container passou a permitir rolagem vertical quando necessário.

Resultado: cumprimento da curadoria e menor risco de corte em alturas reduzidas.

### 5) Formulário de produto (teclado + foco após preço)
Arquivo: `components/ModalFormularioProduto.tsx`

- Área interna ganhou folga inferior adicional em telas compactas.
- Adicionado `scrollIntoView` ao focar preço para manter o botão salvar visível.
- Fluxo de foco após Enter no preço:
  - tenta `Auto Preencher` quando pertinente;
  - senão, avança para próximo campo faltante;
  - fallback em botão `Salvar`.
- CTA `Auto Preencher` recebeu foco por teclado (`tabIndex` + Enter/Espaço).

Resultado: melhora no preenchimento sequencial e menor chance de botão `Salvar` coberto.

### 6) ModalContato com teclado aberto
Arquivo: `components/ModalContato.tsx`

- Modal ancorada no fundo em telas pequenas.
- `max-h` por viewport e `overflow-hidden` no card.
- Formulário interno com rolagem própria (`overflow-y-auto`) e `safe-area`.

Resultado: campos permanecem acessíveis mesmo com teclado virtual.

## Validação

Build validado no fluxo Docker oficial do projeto:

```bash
docker compose -f .docker/compose.yaml run --rm app npm run build
```

Status: sucesso (`vite build` concluído sem erros).

## Observações

- Não houve alteração de efeitos visuais existentes, apenas ajustes estruturais de responsividade.
- `report_curadoria.md` foi mantido como insumo de referência (não modificado).
