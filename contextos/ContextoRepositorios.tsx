/**
 * Contexto React para injeção de repositórios.
 *
 * Este contexto permite que qualquer componente da árvore acesse
 * os repositórios de dados sem precisar passar props manualmente.
 */

import { ReactNode, createContext, useContext, useMemo } from 'react';
import { Repositorios, RepositorioProdutos } from '../repositorios/tipos-repositorio';
import {
  RepositorioCarrinhoLocalStorage,
  RepositorioHistoricoLocalStorage
} from '../repositorios/local-storage';
import { RepositorioProdutosIndexedDB } from '../repositorios/indexed-db';
import { RepositorioProdutosOfflineFirst } from '../repositorios/offline-first';
import { RepositorioProdutosPostgres } from '../repositorios/postgres';
import { RepositorioPremiumLocalStorage } from '../repositorios/premium';
import {
  obterAmbienteOperacionalCliente,
  resolverUsoBancoPostgres,
  resolverUsoLocalStorage
} from '../services/ambiente';

const ContextoRepositorios = createContext<Repositorios | null>(null);

interface PropsProvedorRepositorios {
  children: ReactNode;
  repositoriosCustomizados?: Repositorios;
}

export function ProvedorRepositorios({
  children,
  repositoriosCustomizados
}: PropsProvedorRepositorios) {
  const repositorios = useMemo<Repositorios>(() => {
    if (repositoriosCustomizados) {
      return repositoriosCustomizados;
    }

    const ambienteOperacional = obterAmbienteOperacionalCliente();
    const usarLocalStorage = resolverUsoLocalStorage();
    const usarBancoPostgres = resolverUsoBancoPostgres();

    let produtos: RepositorioProdutos;

    if (usarLocalStorage && usarBancoPostgres) {
      const repositorioLocal = new RepositorioProdutosIndexedDB();
      const repositorioRemoto = new RepositorioProdutosPostgres();
      produtos = new RepositorioProdutosOfflineFirst(repositorioLocal, repositorioRemoto);
    } else if (usarLocalStorage && !usarBancoPostgres) {
      console.warn('[Repositório] Banco PostgreSQL desativado. Usando apenas IndexedDB.');
      produtos = new RepositorioProdutosIndexedDB();
    } else if (!usarLocalStorage && usarBancoPostgres) {
      console.warn('[Repositório] Cache local desativado. Usando apenas PostgreSQL.');
      produtos = new RepositorioProdutosPostgres();
    } else {
      console.error('[Repositório] Ambos os storages desativados. Usando IndexedDB como fallback.');
      produtos = new RepositorioProdutosIndexedDB();
    }

    if (ambienteOperacional === 'producao' && !usarBancoPostgres) {
      console.info('[Ambiente] Produção sem PostgreSQL remoto ativo. Mantendo funcionamento local/offline até o cutover.');
    }

    return {
      produtos,
      carrinho: new RepositorioCarrinhoLocalStorage(),
      historico: new RepositorioHistoricoLocalStorage(),
      premium: new RepositorioPremiumLocalStorage(),
    };
  }, [repositoriosCustomizados]);

  return (
    <ContextoRepositorios.Provider value={repositorios}>
      {children}
    </ContextoRepositorios.Provider>
  );
}

export function useRepositorios(): Repositorios {
  const contexto = useContext(ContextoRepositorios);

  if (!contexto) {
    throw new Error(
      'useRepositorios deve ser usado dentro de um ProvedorRepositorios. ' +
      'Verifique se o componente está envolvido pelo provider no index.tsx.'
    );
  }

  return contexto;
}
