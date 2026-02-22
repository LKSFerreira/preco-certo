/**
 * Implementação do repositório de produtos usando IndexedDB.
 *
 * Substitui o RepositorioProdutosLocalStorage para suportar
 * armazenamento de imagens como Blob (binário), eliminando
 * o limite de ~5MB do localStorage.
 *
 * **Motivo da migração:**
 * O localStorage estourava com ~7 produtos com foto Base64.
 * O IndexedDB suporta GBs de dados, incluindo Blobs binários.
 * Ref: .metadocs/postmortem_estouro_localstorage.md
 *
 * **Arquitetura:**
 * - Store único "produtos" com keyPath "codigo_barras"
 * - Campo `imagem` aceita Blob (foto manual) ou string (URL)
 * - Na ESCRITA: Base64 string é convertida para Blob automaticamente
 * - Na LEITURA: Blob é convertido para objectURL (funciona em <img src>)
 * - O restante do app não precisa saber que usa IndexedDB
 */

import { Produto } from '../types';
import { RepositorioProdutos } from './tipos-repositorio';

// ─── Configurações do Banco ─────────────────────────────────────────────────

const NOME_BANCO = 'SemSustoDB';
const VERSAO_BANCO = 1;
const STORE_PRODUTOS = 'produtos';

// ─── Funções Auxiliares (internas) ──────────────────────────────────────────

/**
 * Converte uma string Base64 (data:image/...) para Blob (binário puro).
 *
 * O Blob ocupa ~2.7x menos espaço que a string Base64 equivalente,
 * pois não tem o overhead de encoding para texto.
 *
 * :param base64: String Base64 completa (ex: "data:image/jpeg;base64,/9j/...")
 * :returns: Blob binário equivalente
 */
function base64ParaBlob(base64: string): Blob {
    const partes = base64.split(',');
    const tipoMatch = partes[0].match(/:(.*?);/);
    const tipo = tipoMatch ? tipoMatch[1] : 'image/jpeg';
    const binario = atob(partes[1]);
    const array = new Uint8Array(binario.length);

    for (let i = 0; i < binario.length; i++) {
        array[i] = binario.charCodeAt(i);
    }

    return new Blob([array], { type: tipo });
}

/**
 * Verifica se um valor é uma string de imagem em Base64.
 * Usado para decidir se precisa converter para Blob antes de salvar.
 */
function ehImagemBase64(valor: unknown): valor is string {
    return typeof valor === 'string' && valor.startsWith('data:image');
}

/**
 * Verifica se um valor é um Blob.
 * Usado para decidir se precisa converter para objectURL ao ler.
 */
function ehBlob(valor: unknown): valor is Blob {
    return valor instanceof Blob;
}

// ─── Repositório ────────────────────────────────────────────────────────────

export class RepositorioProdutosIndexedDB implements RepositorioProdutos {
    /**
     * Referência ao banco aberto.
     * Reutilizada entre chamadas para evitar reabrir a cada operação.
     */
    private bancoDB: IDBDatabase | null = null;

    /**
     * Abre (ou cria) o banco IndexedDB.
     *
     * Na primeira execução do app, o evento `onupgradeneeded` dispara
     * e cria o store "produtos". Nas próximas, apenas abre a conexão.
     *
     * Equivalente conceitual a: CREATE DATABASE IF NOT EXISTS + CREATE TABLE
     */
    private async abrirBanco(): Promise<IDBDatabase> {
        // Se já tem conexão aberta, reutiliza
        if (this.bancoDB) return this.bancoDB;

        return new Promise((resolve, reject) => {
            const requisicao = indexedDB.open(NOME_BANCO, VERSAO_BANCO);

            // Evento disparado SOMENTE na primeira abertura ou ao incrementar VERSAO_BANCO
            requisicao.onupgradeneeded = (evento) => {
                const banco = (evento.target as IDBOpenDBRequest).result;

                // Cria o store se não existir (como CREATE TABLE IF NOT EXISTS)
                if (!banco.objectStoreNames.contains(STORE_PRODUTOS)) {
                    banco.createObjectStore(STORE_PRODUTOS, { keyPath: 'codigo_barras' });
                    console.log('📦 [IndexedDB] Store "produtos" criado com sucesso.');
                }
            };

            requisicao.onsuccess = (evento) => {
                this.bancoDB = (evento.target as IDBOpenDBRequest).result;
                console.log('✅ [IndexedDB] Banco aberto com sucesso.');
                resolve(this.bancoDB);
            };

            requisicao.onerror = () => {
                console.error('❌ [IndexedDB] Erro ao abrir banco:', requisicao.error);
                reject(new Error('Falha ao abrir o banco de dados local (IndexedDB).'));
            };
        });
    }

    /**
     * Prepara um registro lido do IndexedDB para uso no app.
     *
     * Se o campo `imagem` for um Blob, converte para objectURL.
     * objectURL funciona diretamente em <img src="blob:https://...">.
     *
     * **Importante:** NÃO modifica o registro original — cria uma cópia.
     */
    private prepararParaLeitura(registro: Record<string, unknown>): Produto {
        const produto: Produto = {
            codigo_barras: registro.codigo_barras as string,
            descricao: registro.descricao as string,
            marca: registro.marca as string,
            tamanho: registro.tamanho as string,
            preco_estimado: registro.preco_estimado as number | undefined,
            imagem: registro.imagem as string | undefined,
        };

        // Se a imagem é um Blob (foto manual salva anteriormente),
        // cria uma URL temporária para uso em <img src>
        if (ehBlob(registro.imagem)) {
            produto.imagem = URL.createObjectURL(registro.imagem);
        }

        return produto;
    }

    /**
     * Prepara um produto para escrita no IndexedDB.
     *
     * Se o campo `imagem` for Base64 (foto tirada pelo usuário),
     * converte para Blob antes de salvar — economiza ~2.7x de espaço.
     *
     * Se for URL (vinda de API), mantém como string.
     *
     * **Importante:** NÃO modifica o objeto original — cria uma cópia.
     * Isso é crucial porque o OfflineFirst envia o mesmo objeto
     * para o repositório remoto (que precisa da string, não do Blob).
     */
    private prepararParaEscrita(produto: Produto): Record<string, unknown> {
        const registro: Record<string, unknown> = { ...produto };

        if (ehImagemBase64(produto.imagem)) {
            // Converte "data:image/jpeg;base64,/9j/..." para Blob binário
            registro.imagem = base64ParaBlob(produto.imagem);

            const tamanhoOriginalKB = Math.round(produto.imagem.length / 1024);
            const tamanhoBlobKB = Math.round((registro.imagem as Blob).size / 1024);
            console.log(
                `📷 [IndexedDB] Imagem convertida: ${tamanhoOriginalKB}KB (Base64) → ${tamanhoBlobKB}KB (Blob)`
            );
        }

        return registro;
    }

    // ─── Métodos da Interface RepositorioProdutos ─────────────────────────────

    async buscarPorGTIN(gtin: string, _aoMudarStatus?: (status: string) => void): Promise<Produto | null> {
        const banco = await this.abrirBanco();

        return new Promise((resolve, reject) => {
            // Toda operação no IndexedDB ocorre dentro de uma transação
            // (como BEGIN TRANSACTION no SQL)
            const transacao = banco.transaction(STORE_PRODUTOS, 'readonly');
            const store = transacao.objectStore(STORE_PRODUTOS);
            const requisicao = store.get(gtin);

            requisicao.onsuccess = () => {
                if (requisicao.result) {
                    resolve(this.prepararParaLeitura(requisicao.result));
                } else {
                    resolve(null);
                }
            };

            requisicao.onerror = () => {
                console.error('❌ [IndexedDB] Erro ao buscar produto:', requisicao.error);
                reject(new Error('Falha ao buscar produto no banco local.'));
            };
        });
    }

    async listarTodos(): Promise<Produto[]> {
        const banco = await this.abrirBanco();

        return new Promise((resolve, reject) => {
            const transacao = banco.transaction(STORE_PRODUTOS, 'readonly');
            const store = transacao.objectStore(STORE_PRODUTOS);
            // getAll() equivale a SELECT * FROM produtos
            const requisicao = store.getAll();

            requisicao.onsuccess = () => {
                const produtos = (requisicao.result || []).map(
                    (registro: Record<string, unknown>) => this.prepararParaLeitura(registro)
                );
                resolve(produtos);
            };

            requisicao.onerror = () => {
                console.error('❌ [IndexedDB] Erro ao listar produtos:', requisicao.error);
                reject(new Error('Falha ao listar produtos do banco local.'));
            };
        });
    }

    async salvar(produto: Produto): Promise<void> {
        const banco = await this.abrirBanco();
        const registro = this.prepararParaEscrita(produto);

        return new Promise((resolve, reject) => {
            const transacao = banco.transaction(STORE_PRODUTOS, 'readwrite');
            const store = transacao.objectStore(STORE_PRODUTOS);
            // put() faz INSERT OR UPDATE (upsert) baseado no keyPath
            const requisicao = store.put(registro);

            requisicao.onsuccess = () => {
                console.log(`💾 [IndexedDB] Produto salvo: ${produto.codigo_barras}`);
                resolve();
            };

            requisicao.onerror = () => {
                console.error('❌ [IndexedDB] Erro ao salvar produto:', requisicao.error);
                reject(new Error('Falha ao salvar produto no banco local.'));
            };
        });
    }

    async remover(gtin: string): Promise<void> {
        const banco = await this.abrirBanco();

        return new Promise((resolve, reject) => {
            const transacao = banco.transaction(STORE_PRODUTOS, 'readwrite');
            const store = transacao.objectStore(STORE_PRODUTOS);
            const requisicao = store.delete(gtin);

            requisicao.onsuccess = () => {
                console.log(`🗑️ [IndexedDB] Produto removido: ${gtin}`);
                resolve();
            };

            requisicao.onerror = () => {
                console.error('❌ [IndexedDB] Erro ao remover produto:', requisicao.error);
                reject(new Error('Falha ao remover produto do banco local.'));
            };
        });
    }
}
