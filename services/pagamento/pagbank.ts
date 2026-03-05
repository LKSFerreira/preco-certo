import { GatewayPagamento, RespostaCriacaoPagamento, StatusPagamento, PlanoID } from './tipos'

export class GatewayPagBank implements GatewayPagamento {
    // O front end NUNCA conversa diretamente com o gateway de pagamento
    private base_url = '/api/pagamentos'; // Proxy Vercel para segurança

    async gerarPix(plano_id: PlanoID): Promise<RespostaCriacaoPagamento> {
        const resposta = await fetch(`${this.base_url}/pix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plano_id }),
        });

        if (!resposta.ok) throw new Error("Falha ao gerar pagamento PIX");

        const dados = await resposta.json();

        return {
            pagamento_id: dados.id,
            qr_code_base64: dados.qr_code_base64,
            qr_code_copia_e_cola: dados.qr_code,
            status: this.mapearStatus(dados.status)
        };
    }

    async consultarStatus(pagamento_id: string): Promise<StatusPagamento> {
        const resposta = await fetch(`${this.base_url}/status?id=${pagamento_id}`);
        if (!resposta.ok) return 'pendente';

        const dados = await resposta.json();
        return this.mapearStatus(dados.status);
    }

    private mapearStatus(status_pagbank: string): StatusPagamento {
        const mapa: Record<string, StatusPagamento> = {
            'PAID': 'aprovado',
            'AUTHORIZED': 'pendente',
            'IN_ANALYSIS': 'pendente',
            'WAITING': 'pendente',
            'DECLINED': 'falha',
            'CANCELED': 'falha'
        };
        return mapa[status_pagbank] || 'pendente';

    }

}
