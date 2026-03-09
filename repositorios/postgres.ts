import { Produto } from '../types';
import { RepositorioProdutos } from './tipos-repositorio';

/**
 * Implementação do repositório remoto via API própria.
 *
 * Regras atuais:
 * - GET lê do catálogo oficial (`produtos`)
 * - POST envia contribuição do usuário para staging (`produtos_adicionados_pelo_usuario`)
 */
export class RepositorioProdutosPostgres implements RepositorioProdutos {

    async buscarPorGTIN(gtin: string, _aoMudarStatus?: (status: string) => void): Promise<Produto | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);

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

            return {
                ...dados,
                preco_estimado: Number(dados.preco_estimado),
                criado_em: dados.criado_em ? new Date(dados.criado_em) : undefined,
                atualizado_em: dados.atualizado_em ? new Date(dados.atualizado_em) : undefined,
            };
        } catch (erro: any) {
            if (erro.name === 'AbortError') {
                console.warn('[Database Postgres] Timeout de 7s atingido ao consultar o catálogo oficial remoto.');
                console.error('[Database Postgres] Erro ao buscar:', erro);
                return null;
            }

            throw erro;
        }
    }

    async listarTodos(): Promise<Produto[]> {
        console.warn('[Database Postgres] listarTodos não é suportado via API completa.');
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
                throw new Error(erro.erro || 'Erro ao registrar staging na API');
            }
        } catch (erro: any) {
            console.error('[Database Postgres] Erro ao enviar produto para staging remoto:', erro);
            throw erro;
        }
    }

    async remover(gtin: string): Promise<void> {
        console.warn(`[Database Postgres] remover ainda não implementado para staging remoto (${gtin}).`);
        return Promise.resolve();
    }
}
