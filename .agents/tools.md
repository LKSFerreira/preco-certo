# Referência de Ferramentas e Capacidades do Agente (Superpoderes)

Este documento mapeia todas as ferramentas nativas (tools/funções) disponíveis para o agente IA. Ele serve como o núcleo de autoconhecimento do agente, permitindo que ele tome decisões arquiteturais e operacionais com clareza absoluta sobre seus limites, parâmetros e contratos de interface.

> **Regra de Ouro (Instrução Crítica):**
> O agente sempre deve priorizar a ferramenta mais específica possível para a tarefa.
>
> - **NUNCA** usar `cat`, `echo` ou redirecionamentos bash (`>`) dentro do `run_command` para criar ou editar arquivos. Use `write_to_file`, `replace_file_content` ou `multi_replace_file_content`.
> - **SEMPRE** usar `grep_search` em vez de rodar `grep` via bash, a menos que testes muito específicos exijam.
> - **NÃO** usar `ls` para listar, `cat` para ler, `grep` para buscar ou `sed` para substituir via terminal. Existem ferramentas nativas otimizadas para isso.

---

## 1. Organização do Trabalho e Fluxo

### `task_boundary`

Indica o início de uma tarefa ou atualiza seu status. É o "sistema de log em tempo real" do agente, refletindo itens do `task.md`.

- **Parâmetros Principais:**
  - `TaskName` (String): Nome da tarefa atual (ex: "Criando serviço de autenticação"). Deve ser legível e granular.
  - `Mode` (String): O foco atual da inteligência. Valores permitidos: `PLANNING` (Pesquisa e Planejamento), `EXECUTION` (Escrever/modificar código), `VERIFICATION` (Testes e auditoria).
  - `TaskSummary` (String): Resumo descritivo do que já foi alcançado durante a tarefa toda. Não deve falar de coisas futuras.
  - `TaskStatus` (String): Status super conciso do que o agente _vai fazer a seguir_. (ex: "Criando arquivo routes.ts", "Buscando rotas de login").
  - `PredictedTaskSize` (Integer): Estimativa do agente sobre quantas chamadas de ferramenta faltam para concluir a tarefa com sucesso.

- **Exemplo de Uso:**
  Ao iniciar um refactor longo, o agente chama essa ferramenta com Mode="PLANNING", indicando "Lendo a base de código antiga".

### `notify_user`

A única forma permitida para o agente interagir com o usuário quando ele está ativamente dentro de uma "tarefa" (após chamar `task_boundary`). Fora do modo de tarefa, o agente fala naturalmente pela interface padrão.

- **Parâmetros Principais:**
  - `Message` (String): Mensagem direta e concisa. Listas numeradas devem ser usadas se houver múltiplas perguntas.
  - `BlockedOnUser` (Boolean): Se o agente está travado precisando de decisão humana (ex: para aprovar um design doc em `.metadocs/`).
  - `PathsToReview` (Array de Strings): Caminhos absolutos de arquivos/artefatos que o usuário precisa olhar para aprovar.
  - `ShouldAutoProceed` (Boolean): Se o agente acredita que o fluxo é tão seguro ou óbvio que o usuário pode deixar passar, marcando verdadeiro.

---

## 2. Manipulação de Arquivos e Edição de Código

### `write_to_file`

Cria novos arquivos ou sobrescreve arquivos inteiros no disco. Esta ferramenta garante a integridade de diretórios pai caso eles não existam.

- **Parâmetros Principais:**
  - `TargetFile` (String): Caminho absoluto do alvo.
  - `CodeContent` (String): O conteúdo na íntegra a ser escrito.
  - `Overwrite` (Boolean): Segurança contra perdas acidentais. Se `false`, falha se o arquivo já existir. Apenas use `true` se a intenção for apagar tudo.
  - `Description` (String) e `Complexity` (Integer, 1-10): Explicam o "peso" da modificação para feedback do usuário. Notas 7-10 indicam mudanças que exigem leitura humana atenta.
  - `IsArtifact` / `ArtifactMetadata`: Sinaliza a gravação em um repositório interno de artefatos do agente (brain memory).

### `replace_file_content` (Edição em Bloco Único)

Muda um trecho de código contínuo dentro de um arquivo existente, mantendo o resto intacto. Muito mais leve do que usar `write_to_file` em arquivos imensos.

- **Parâmetros Principais:**
  - `TargetFile` (String)
  - `StartLine` e `EndLine` (Integer): O intervalo alvo 1-indexed. O trecho só é buscado dentro desse limite para evitar problemas de escopo.
  - `TargetContent` (String): O trecho existente, _exatamente como ele é, incluindo formatação e recuo_. Deve ser único.
  - `ReplacementContent` (String): O novo conteúdo de substituição total.
  - `AllowMultiple` (Boolean): Se true, substitui em todas as ocorrências encontradas no escopo em vez de falhar.

### `multi_replace_file_content` (Multi-Edições)

Quando ocorrem mudanças não-contíguas (ex: adicionar um import no topo da classe e adicionar um uso da propriedade no fundo da classe).

- **Atenção**: Recebe uma lista (`ReplacementChunks`), onde cada chunk opera como o `replace_file_content`, impedindo leituras múltiplas e garantindo atomicidade na edição do arquivo.

---

## 3. Exploração, Leitura e Diagnóstico Rápido

### `view_file` e `view_file_outline`

A dupla dinâmica para descoberta.

- **`view_file_outline`**: Sempre usar primeiro quando encontrar um arquivo desconhecido. Retorna assinaturas das classes e funções e o número de linhas sem travar a memória.
- **`view_file`**: Lê o conteúdo num limite de paginação (800 linhas max). Suporta paginação via `StartLine` e `EndLine`. Para arquivos binários como imagens, lê inteiro de uma vez por padrão.

### `list_dir`, `find_by_name`, `grep_search`

As ferramentas de varredura do projeto superam as comandos de bash para evitar formatação indesejável do console e vazamento de outputs massivos.

- **`find_by_name`**: Buscas super otimizadas de caminhos (usa o motor `fd`). Suporta glob (`Pattern`), limitadores `MaxDepth`, exclusões ignorando `.gitignore` por padrão e filtro de `Extensions` diretos (Múltiplo match).
- **`grep_search`**: Uso embutido do utilitário de alta performance `ripgrep`. Retorna JSON estruturado de Arquivo->Linha->Conteúdo para mapear até 50 blocos de uma ocorrência. Suporta globbing customizado para filtrar o alvo de uma busca profunda via parâmetro `Includes` (ex: `*.go`).

### `view_code_item`

O "IntelliSense" do agente. Em vez de ler arquivos, o agente passa o caminho do nó (ex: `ClasseXPTO.minhaFuncao`) e o agente extrai _apenas_ a declaração dessa função, cortando o ruído local e economizando contexto.

---

## 4. O Sistema de Interface com o S.O.

### `run_command` e `send_command_input`

Roda via Bash no Windows Subsystem/ambiente do usuário operando em paginador configurado como `cat` (evitando ficar preso em prompts como `less/more` em logs gigantes tipo `git log`).

- **Parâmetros de execução e Async:**
  - `CommandLine` (String) e `Cwd` (Diretório origem).
  - `WaitMsBeforeAsync` (Integer, limite 10000ms): Controla quanto tempo o agente espia a execução de forma reversa (síncrona). Se o comando explodir erro ou der resposta dentro de X milissegundos, o agente vê na hora. Senão abandona a thread no "fundo do palco" e precisa chamar `command_status` depois lendo pelo `CommandId`.
  - `SafeToAutoRun` (Boolean): O mais tenso. É proibido se envolver manipulações de mutação não pedidas (como baixar libs, remover imagens, enviar dados externos) sem aprovação.
  - **Controle Dinâmico:** Se um processo iterativo travar como um REPL do Python ou Bash, `send_command_input` pode enviar aspas ou interrupção (`Terminate`) pela stdin usando aquele `CommandId`.

### `read_terminal` e `command_status`

Permite ler terminais que já existiam, rastreando pelo seu `ProcessID` ou status de uma background thread para coletar seu log final depois da finalização.

---

## 5. Capacidades Avançadas e Cognição Web

### `browser_subagent`

Spawna um agente filho com seu próprio contexto limpo focado em "visualizar conteúdo" na web. Extrai HTML, testa clicks dentro da dom, navega em botões, redimensiona componentes (Design check). O agente precisa passar um "Prompt muito claro" (`Task` param) e o resultado disso é salvo numa base WebP.

- **Uso Ideal:** Check visual se uma interface recém-compilada não quebrou de layout. O agente avalia a dom renderizada ou um screenshot para aprovar a própria entrega antes de enviar ao humano!

### `search_web` e `read_url_content`

Mecanismos stealth. `search_web` consulta referências no google, `read_url_content` é invisível ao usuário e devora uma documentação online estática em Markdown num piscar de olhos para absorver contexto que não está no repositório.

### `generate_image` (Design e Prototipação)

Poderosíssima em arquitetura inicial de features UI. O agente pode gerar mockups de interfaces conceituais baseadas numa solicitação visual para discutir layout com o desenvolvedor antes de implementar. Pode cruzar imagens nativas do sistema com imagens em seu banco de memórias.

---

## Fluxos Combinados de Alto Nível (O "Superpoderes")

1.  **Refatoração Profunda Perfeita**
    1. Usar `grep_search` para achar usos de um componente antigo em 12 arquivos (usando regex `IsRegex=true`).
    2. Filtrar os nomes. Chamar `view_code_item` apenas para recuperar as funções afetadas.
    3. Construir as substituições complexas com `multi_replace_file_content` via lógica `AllowMultiple`.

2.  **Autocorreção Pós-Construção (Self-Healing via Async)**
    1. Rodar CI bash via `run_command` com `WaitMsBeforeAsync` ajustado em 3 segundos.
    2. Se dar erro rápido (ex: fail npm run build), o agente lê o output nativamente pelo erro sincrono.
    3. Disparar uma query de correção em blocos de Replace ou leitura fina de um arquivo.

3.  **Desenvolvedor Frontend TDD Cego**
    1. Modifica o componente em `src/App.tsx`.
    2. Chama `browser_subagent` para gravar a si mesmo validando o visual num preview no localhost.
    3. Confirma se não sobrepôs nenhuma caixa DIV com erro de estilo antes de comitar a feature!
