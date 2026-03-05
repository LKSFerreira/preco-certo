# [Plano] Refatoração do Fluxo de Pagamento (Frontend -> Backend)

## Visão Geral
- **Problema**: O frontend atualmente possui lógica mockada de pagamento ([GatewayMockado](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/services/pagamento/mockado.ts#7-58)), violando a responsabilidade de manter chaves ou regras de negócio apenas no backend.
- **Objetivo**: Limpar o frontend, removendo arquivos de "gateway" e "fábrica" desnecessários. O frontend fará um simples `fetch` para o backend ([api/pagamentos/pix.ts](file:///c:/Users/LKSFERREIRA/Documents/GitHub/sem-susto/api/pagamentos/pix.ts)), que tomará a decisão de qual gateway usar via sua própria fábrica.
- **Abordagem**:
  1. Deletar a pasta `services/pagamento/` (fábrica e mocks).
  2. Criar um serviço simples no frontend (`services/api-pagamento.ts`) contendo apenas os fetches.
  3. Atualizar o `App.tsx` e o `ModalPagamento.tsx` para usarem o `fetch` em vez da fábrica local.
  4. Finalizar o endpoint `api/pagamentos/pix.ts` para receber o `plano_id`, usar a `FabricaGatewayPagamento` do backend para gerar o PIX e devolver o JSON esperado pelo frontend.

## Alterações Propostas

### Frontend (Limpeza e Cliente API)
#### [NEW] `services/api-pagamento.ts`
Criaremos este arquivo para ser um "cliente" da nossa API, encapsulando o `fetch` para facilitar o uso no React.
```typescript
// Exemplo do que será feito:
export const apiGerarPix = async (plano_id: string): Promise<RespostaCriacaoPagamento> => {
    const res = await fetch('/api/pagamentos/pix', { method: 'POST', body: JSON.stringify({ plano_id }) });
    return res.json();
}
```

#### [DELETE] `services/pagamento/fabrica.ts`
Removemos a fábrica do frontend.

#### [DELETE] `services/pagamento/mockado.ts`
Removemos o mock do frontend.

#### [MODIFY] `App.tsx`
Substituir o uso de `fabricaPagamento.obterGateway().gerarPix` por uma chamada à nossa nova função `apiGerarPix`.

#### [MODIFY] `components/ModalPagamento.tsx`
Substituir o polling de status (`servico.consultarStatus`) por um `fetch` para uma futura rota `api/pagamentos/status?id=...`. Também ativaremos as props reais (`qr_code`, `copia_e_cola`) removendo os imports diretos do arquivo `.json` estático.

---

### Backend (Endpoints)
#### [MODIFY] `api/pagamentos/pix.ts`
Adaptar este endpoint para:
1. Receber `plano_id` no body.
2. Calcular o valor (ex: `plano_cafe` = R$ 5,00 = `500` centavos).
3. Instanciar o gateway usando `fabricaGatewayPagamento.obterGateway()`.
4. Chamar `gateway.criarPix(valor, descricao)`.
5. Retornar no formato padrão `{ pagamento_id, codigo_qr, codigo_copia_e_cola, status: 'pendente' }`.

## Verificação
1. **Frontend**: Garantir que o build React compila sem os arquivos deletados.
2. **Backend**: Subir o Vercel Dev (`bash dev.sh`).
3. **End-to-End**: Clicar em "Seja Premium", escolher um plano e verificar se o modal abre com o QR Code recebido do **Backend** (Mockado ou Real, dependendo do `.env`).

> [!IMPORTANT]
> A aprovação deste plano implica na **deleção** de arquivos locais no frontend que representam código morto a partir desta nova arquitetura.
