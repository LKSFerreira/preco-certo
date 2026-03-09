import { Produto } from '../types';
import { RepositorioProdutos } from './tipos-repositorio';

/**
 * Repositório Offline First.
 *
 * Estratégia:
 * - Leitura: Local -> catálogo oficial remoto -> fallback null
 * - Escrita: Local imediato + envio assíncrono para staging remoto
 */
export class RepositorioProdutosOfflineFirst implements RepositorioProdutos {
    constructor(
        private local: RepositorioProdutos,
        private remoto: RepositorioProdutos
    ) { }

    async buscarPorGTIN(gtin: string, aoMudarStatus?: (status: string) => void): Promise<Produto | null> {
        aoMudarStatus?.('Buscando no banco local (IndexedDB)...');
        const produtoLocal = await this.local.buscarPorGTIN(gtin);

        if (produtoLocal) {
            return produtoLocal;
        }

        try {
            aoMudarStatus?.('Buscando no catálogo oficial remoto...');
            const produtoRemoto = await this.remoto.buscarPorGTIN(gtin);

            if (produtoRemoto) {
                await this.local.salvar(produtoRemoto);
                return produtoRemoto;
            }
        } catch (erro) {
            console.warn('[OfflineFirst] Falha ao buscar no catálogo oficial remoto:', erro);
        }

        return null;
    }

    async listarTodos(): Promise<Produto[]> {
        return this.local.listarTodos();
    }

    async salvar(produto: Produto): Promise<void> {
        await this.local.salvar(produto);

        try {
            await this.remoto.salvar(produto);
            console.log(`☁️ [OfflineFirst] Produto enviado para staging remoto: ${produto.codigo_barras}`);
        } catch (erro) {
            console.error('[OfflineFirst] Erro ao sincronizar staging remoto:', erro);
            // TODO: Adicionar fila de retry futura
        }
    }

    async remover(gtin: string): Promise<void> {
        await this.local.remover(gtin);

        try {
            await this.remoto.remover(gtin);
        } catch (erro) {
            console.warn('[OfflineFirst] Falha ao remover no remoto:', erro);
        }
    }
}
