import { RepositorioProdutos } from './tipos-repositorio';
import { Produto } from '../types';

/**
 * Repositório Híbrido: Combina LocalStorage (Offline) + API (Online/Audit).
 * 
 * Estratégia:
 * - Leitura: Tenta Local -> Se falhar, tenta API -> Se achar na API, salva Local.
 * - Escrita: Salva Local (Síncrono/Rápido) + Salva API (Assíncrono/Audit).
 */
export class RepositorioProdutosHibrido implements RepositorioProdutos {
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

        // 2. API Remota (Fonte da Verdade)
        try {
            const produtoRemoto = await this.remoto.buscarPorGTIN(gtin);
            if (produtoRemoto) {
                // Hidratação do Cache Local
                await this.local.salvar(produtoRemoto);
                return produtoRemoto;
            }
        } catch (erro) {
            // Falha silenciosa na API não deve quebrar a busca (pode estar offline)
            console.warn('[Hibrido] Falha ao buscar remoto:', erro);
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
        } catch (erro) {
            console.error('[Hibrido] Erro na sincronização remota:', erro);
            // TODO: Adicionar em fila de retry (SyncQueue) futura
        }
    }

    async remover(gtin: string): Promise<void> {
        await this.local.remover(gtin);
        try {
            await this.remoto.remover(gtin);
        } catch (erro) {
            console.warn('[Hibrido] Falha ao remover remoto:', erro);
        }
    }
}
