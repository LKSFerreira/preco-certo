import { RepositorioProdutos } from './tipos-repositorio';
import { Produto } from '../types';

/**
 * Implementação do Repositório de Produtos via HTTP (API Própria).
 * Consome os endpoints /api/produtos/:codigo
 */
export class RepositorioProdutosHttp implements RepositorioProdutos {

    async buscarPorGTIN(gtin: string): Promise<Produto | null> {
        try {
            const response = await fetch(`/api/produtos/${gtin}`);

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
        } catch (erro) {
            console.error('[RepositorioHttp] Erro ao buscar:', erro);
            return null; // Fallback seguro
        }
    }

    async listarTodos(): Promise<Produto[]> {
        // Não implementado via API por questões de performance/paginação
        // O app usa listarTodos apenas para debug local ou cache warmup
        console.warn('[RepositorioHttp] listarTodos não é suportado via API completa.');
        return [];
    }

    async salvar(produto: Produto): Promise<void> {
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

            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.erro || 'Erro ao salvar na API');
            }
        } catch (erro) {
            console.error('[RepositorioHttp] Erro ao salvar:', erro);
            throw erro; // Propaga erro para a UI tratar (ex: retry)
        }
    }

    async remover(gtin: string): Promise<void> {
        // API v0.5 não suporta DELETE ainda
        console.warn('[RepositorioHttp] remover não implementado.');
        return Promise.resolve();
    }
}
