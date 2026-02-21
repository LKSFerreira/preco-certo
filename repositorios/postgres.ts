import { RepositorioProdutos } from './tipos-repositorio';
import { Produto } from '../types';

/**
 * Implementação do Repositório de Produtos via HTTP (API Própria).
 * Consome os endpoints /api/produtos/:codigo
 */
export class RepositorioProdutosPostgres implements RepositorioProdutos {

    async buscarPorGTIN(gtin: string): Promise<Produto | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 segundos

            const response = await fetch(`/api/produtos/${gtin}`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }

            const dados = await response.json();

            // Converte datas strings para Date
            return {
                ...dados,
                preco_estimado: Number(dados.preco_estimado),
                criado_em: dados.criado_em ? new Date(dados.criado_em) : undefined,
                atualizado_em: dados.atualizado_em ? new Date(dados.atualizado_em) : undefined,
            };
        } catch (erro: any) {
            if (erro.name === 'AbortError') {
                console.warn('[Database Postgres] ⏱️ Timeout de 7s atingido. Banco de dados remoto (PostgreSQL) demorou muito para responder.');
                console.error('[Database Postgres] Erro ao buscar:', erro);
                return null; // Fallback seguro
            }
        }

    async listarTodos(): Promise < Produto[] > {
            // Não implementado via API por questões de performance/paginação
            console.warn('[Database Postgres] listarTodos não é suportado via API completa.');
        }

    async salvar(produto: Produto): Promise < void> {
            try {
                const response = await fetch(`/api/produtos/${produto.codigo_barras}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        descricao: produto.descricao,
                        marca: produto.marca,
                        tamanho: produto.tamanho,
                        preco_estimado: produto.preco_estimado,
                        imagem: produto.imagem
                    }),
                });

                if(!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || 'Erro ao salvar na API');
        }
        console.error('[Database Postgres] Erro ao salvar:', erro);
    }
}

    async remover(gtin: string): Promise < void> {
    console.warn('[Database Postgres] remover não implementado.');
    return Promise.resolve();
}
}
