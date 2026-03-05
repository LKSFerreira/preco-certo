import { RespostaCriacaoPagamento, StatusPagamento, PlanoID } from './pagamento/tipos';

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
 * Consulta no backend o status atual de uma cobrança (Gateway ou Mock).
 */
export const apiConsultarStatus = async (pagamento_id: string): Promise<StatusPagamento> => {
    // Note: Utilizando URLSearchParams para garantir que o ID não fuja da padronização de URL
    const params = new URLSearchParams({ id: pagamento_id });
    const resposta = await fetch(`/api/pagamentos/status?${params.toString()}`);

    if (!resposta.ok) {
        throw new Error(`Erro ao consultar status PIX. Resposta da API: ${resposta.status}`);
    }

    const json = await resposta.json();
    return json.status as StatusPagamento;
};
