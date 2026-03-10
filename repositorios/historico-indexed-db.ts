import type { Compra } from '../types';
import type { RepositorioHistorico } from './tipos-repositorio';

const NOME_BANCO = 'SemSustoHistoricoDB';
const VERSAO_BANCO = 1;
const STORE_HISTORICO = 'historico_compras';

function sanitizarCompraParaPersistencia(compra: Compra): Compra {
  return {
    ...compra,
    itens: compra.itens.map((itemAtual) => ({
      ...itemAtual,
      imagem:
        typeof itemAtual.imagem === 'string' && itemAtual.imagem.startsWith('blob:')
          ? undefined
          : itemAtual.imagem
    }))
  };
}

export class RepositorioHistoricoIndexedDB implements RepositorioHistorico {
  private bancoDB: IDBDatabase | null = null;

  private async abrirBanco(): Promise<IDBDatabase> {
    if (this.bancoDB) {
      return this.bancoDB;
    }

    return new Promise((resolve, reject) => {
      const requisicao = indexedDB.open(NOME_BANCO, VERSAO_BANCO);

      requisicao.onupgradeneeded = (evento) => {
        const banco = (evento.target as IDBOpenDBRequest).result;

        if (!banco.objectStoreNames.contains(STORE_HISTORICO)) {
          banco.createObjectStore(STORE_HISTORICO, { keyPath: 'id' });
          console.log('📚 [IndexedDB] Store "historico_compras" criado com sucesso.');
        }
      };

      requisicao.onsuccess = (evento) => {
        this.bancoDB = (evento.target as IDBOpenDBRequest).result;
        console.log('✅ [IndexedDB] Banco de histórico aberto com sucesso.');
        resolve(this.bancoDB);
      };

      requisicao.onerror = () => {
        console.error('❌ [IndexedDB] Erro ao abrir banco de histórico:', requisicao.error);
        reject(new Error('Falha ao abrir o banco local de histórico.'));
      };
    });
  }

  async salvar(compra: Compra): Promise<void> {
    const banco = await this.abrirBanco();
    const compraSanitizada = sanitizarCompraParaPersistencia(compra);

    return new Promise((resolve, reject) => {
      const transacao = banco.transaction(STORE_HISTORICO, 'readwrite');
      const store = transacao.objectStore(STORE_HISTORICO);
      const requisicao = store.put(compraSanitizada);

      requisicao.onsuccess = () => resolve();
      requisicao.onerror = () => {
        console.error('❌ [IndexedDB] Erro ao salvar histórico:', requisicao.error);
        reject(new Error('Falha ao salvar histórico no banco local.'));
      };
    });
  }

  async listarTodas(): Promise<Compra[]> {
    const banco = await this.abrirBanco();

    return new Promise((resolve, reject) => {
      const transacao = banco.transaction(STORE_HISTORICO, 'readonly');
      const store = transacao.objectStore(STORE_HISTORICO);
      const requisicao = store.getAll();

      requisicao.onsuccess = () => {
        const compras = (requisicao.result as Compra[]).sort((compraAtual, proximaCompra) =>
          proximaCompra.data.localeCompare(compraAtual.data)
        );
        resolve(compras);
      };

      requisicao.onerror = () => {
        console.error('❌ [IndexedDB] Erro ao listar histórico:', requisicao.error);
        reject(new Error('Falha ao listar histórico do banco local.'));
      };
    });
  }
}
