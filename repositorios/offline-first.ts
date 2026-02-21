import { RepositorioProdutos } from './tipos-repositorio';
import { Produto } from '../types';

/**
 * Repositório Offline First: Prioriza LocalStorage (Rápido) + Sincroniza API (Fonte da Verdade).
 * 
 * Estratégia:
 * - Leitura: Tenta Local -> Se falhar, tenta API -> Se achar na API, salva Local.
 * - Escrita: Salva Local (Síncrono/Rápido) + Salva API (Assíncrono/Audit).
 */
export class RepositorioProdutosOfflineFirst implements RepositorioProdutos {
    constructor(
        private local: RepositorioProdutos,
        private remoto: RepositorioProdutos
    ) { }

    async buscarPorGTIN(gtin: string): Promise<Produto | null> {
        // 1. Cache Local (Rápido)
        const produtoLocal = await this.local.buscarPorGTIN(gtin);
        if (produtoLocal) {
            return produtoLocal;
        }

        // 2. Banco Remoto (Postgres - Fonte da Verdade)
        try {
            const produtoRemoto = await this.remoto.buscarPorGTIN(gtin);
            if (produtoRemoto) {
                // Hidratação do Cache Local
                await this.local.salvar(produtoRemoto);
                return produtoRemoto;
            }
        } catch (erro) {
            // Falha silenciosa no Postgres não deve quebrar a busca (pode estar offline)
            console.warn('[OfflineFirst] Falha ao buscar no Postgres Remoto:', erro);
        }

        return null;
    }

    async listarTodos(): Promise<Produto[]> {
        // Lista apenas do local, pois API tem paginação/limites
        return this.local.listarTodos();
    }

    async salvar(produto: Produto): Promise<void> {
        // 1. Salva Localmente (Garante funcionamento offline)
        await this.local.salvar(produto);

        // 2. Sincroniza com API (Tenta persistir e auditar)
        try {
            await this.remoto.salvar(produto);
            console.log(`☁️ [OfflineFirst] Sincronizado com Postgres Remoto: ${produto.codigo_barras}`);
        } catch (erro) {
            console.error('[OfflineFirst] Erro na sincronização com Postgres Remoto:', erro);
            // TODO: Adicionar em fila de retry (SyncQueue) futura
        }
    }

    async remover(gtin: string): Promise<void> {
        await this.local.remover(gtin);
        try {
            await this.remoto.remover(gtin);
        } catch (erro) {
            console.warn('[OfflineFirst] Falha ao remover no Postgres Remoto:', erro);
        }
    }
}
