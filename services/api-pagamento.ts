import {
    PlanoID,
    RequisicaoAprovacaoManual,
    RespostaAprovacaoManual,
    RespostaCriacaoPagamento,
    StatusPagamento,
} from './pagamento/tipos';

/**
 * Solicita ao backend a criação de uma cobrança PIX para um plano específico.
 */
export const apiGerarPix = async (plano_id: PlanoID): Promise<RespostaCriacaoPagamento> => {
    const resposta = await fetch('/api/pagamentos/pix', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plano_id }),
    });

    if (!resposta.ok) {
        const erroBody = await resposta.text();
        throw new Error(`Falha ao gerar PIX. Status: ${resposta.status}. Retorno: ${erroBody}`);
    }

    return await resposta.json();
};

/**
 * Consulta no backend o status atual de uma cobrança (gateway real ou mock).
 */
export const apiConsultarStatus = async (pagamento_id: string): Promise<StatusPagamento> => {
    const parametros = new URLSearchParams({ id: pagamento_id });
    const resposta = await fetch(`/api/pagamentos/status?${parametros.toString()}`);

    if (!resposta.ok) {
        throw new Error(`Erro ao consultar status PIX. Resposta da API: ${resposta.status}`);
    }

    const json = await resposta.json();
    return json.status as StatusPagamento;
};

/**
 * Registra solicitação de comprovante para fluxo manual de aprovação.
 */
export const apiSolicitarAprovacaoManual = async (
    payload: RequisicaoAprovacaoManual
): Promise<RespostaAprovacaoManual> => {
    const resposta = await fetch('/api/pagamentos/manual/solicitar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
        const erroBody = await resposta.text();
        throw new Error(`Falha ao solicitar aprovação manual. Status: ${resposta.status}. Retorno: ${erroBody}`);
    }

    const json = await resposta.json();
    return (json.solicitacao || json) as RespostaAprovacaoManual;
};
