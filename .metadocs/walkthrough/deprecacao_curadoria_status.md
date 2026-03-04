# Depreciação de ModalDoacao e Atualização de Curadoria

## Contexto

Auditoria de consistência entre `status_curadoria.md` e o código real revelou dois desalinhamentos:

1. `ModalPagamento` já havia sido refatorada com efeitos premium (Núcleo Quântico, partículas, som) mas continuava classificada como 🔴 "UX Simples".
2. `ModalDoacao` estava marcada como 🔴 "Design Antigo" mas já era **código morto** — nenhum `setMostrarDoacao(true)` existia no fluxo ativo. O botão ❤️ do header já apontava para `ModalPlano`.

## Alterações Realizadas

### `ModalDoacao.tsx` → `components/_deprecated/ModalDoacao.tsx`

- Criada pasta `components/_deprecated/` como padrão de depreciação do projeto.
- Arquivo movido (não excluído) para preservar referência histórica.
- Header `@deprecated` adicionado com data (04/03/2026), motivo e instruções de restauração.

### `App.tsx`

- Removida importação lazy: `const ModalDoacao = lazy(...)`.
- Removido estado: `const [mostrarDoacao, setMostrarDoacao] = useState(false)`.
- Removido bloco de renderização condicional (`{mostrarDoacao && ...}`).

### `.metadocs/status_curadoria.md`

- `ModalPagamento` promovida para 🟢 **Padrão Ouro** (9 componentes no total).
- `ModalDoacao` removida da seção 🔴 e movida para nova seção ⚫ **Deprecados**.
- Próximos passos ajustados: foco em `ModalConfirmacao` (próximo componente legado).

## Validação

- Confirmado que `mostrarDoacao` não possui nenhum setter ativo no `App.tsx`.
- Nenhum outro arquivo do projeto importa `ModalDoacao`.
- Todos os lint errors reportados pela IDE são pré-existentes (ausência de `node_modules` local — projeto roda em Docker).
