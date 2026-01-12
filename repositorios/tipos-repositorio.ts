/**
 * Interfaces que definem o contrato dos repositórios de dados.
 * 
 * Usando o Repository Pattern, podemos trocar a implementação de
 * localStorage para PostgreSQL (ou qualquer outro storage) sem
 * alterar os componentes que consomem esses dados.
 */

import { Produto, ItemCarrinho, Compra } from '../types';

/**
 * Contrato para operações de persistência de produtos.
 * 
 * O catálogo de produtos é indexado pelo GTIN (código de barras),
 * garantindo unicidade e busca rápida.
 */
export interface RepositorioProdutos {
  /**
   * Busca um produto pelo GTIN.
   * 
   * :param gtin: Código de barras do produto (ex: "7891000100103")
   * :returns: Produto encontrado ou null se não existir
   */
  buscarPorGTIN(gtin: string): Promise<Produto | null>; // Antigo: buscarPorCodigo

  /**
   * Lista todos os produtos cadastrados.
   * 
   * :returns: Array com todos os produtos do catálogo
   */
  listarTodos(): Promise<Produto[]>;

  /**
   * Salva ou atualiza um produto no catálogo.
   * 
   * Se o produto já existir (mesmo GTIN), será atualizado.
   * 
   * :param produto: Dados do produto a salvar
   */
  salvar(produto: Produto): Promise<void>;

  /**
   * Remove um produto do catálogo.
   * 
   * :param gtin: GTIN do produto a remover
   */
  remover(gtin: string): Promise<void>; // Antigo: remover(codigo)
}

/**
 * Contrato para operações de persistência do carrinho de compras.
 * 
 * O carrinho armazena itens temporários da compra atual,
 * com controle de quantidade por produto.
 */
export interface RepositorioCarrinho {
  /**
   * Obtém todos os itens do carrinho atual.
   * 
   * :returns: Array com itens do carrinho
   */
  obterItens(): Promise<ItemCarrinho[]>;

  /**
   * Adiciona um item ao carrinho.
   * 
   * Se o produto já estiver no carrinho, a implementação pode
   * optar por incrementar a quantidade ou retornar erro.
   * 
   * :param item: Item a adicionar
   */
  adicionarItem(item: ItemCarrinho): Promise<void>;

  /**
   * Atualiza a quantidade de um item no carrinho.
   * 
   * :param gtin: GTIN do produto
   * :param quantity: Nova quantidade (deve ser > 0)
   */
  atualizarQuantidade(gtin: string, quantity: number): Promise<void>; // Antigo: codigo, quantidade

  /**
   * Remove um item do carrinho.
   * 
   * :param gtin: GTIN do produto a remover
   */
  removerItem(gtin: string): Promise<void>; // Antigo: removerItem(codigo)

  /**
   * Limpa todo o carrinho.
   * 
   * Útil após finalizar uma compra.
   */
  limpar(): Promise<void>;

  /**
   * Salva o estado completo do carrinho.
   * 
   * Útil para persistir múltiplas alterações de uma vez.
   * 
   * :param itens: Array completo de itens para salvar
   */
  salvarTodos(itens: ItemCarrinho[]): Promise<void>;
}

/**
 * Contrato para persistência do histórico de compras.
 */
export interface RepositorioHistorico {
  /**
   * Salva uma nova compra no histórico.
   * 
   * @param compra Objeto da compra finalizada
   */
  salvar(compra: Compra): Promise<void>;

  /**
   * Lista todas as compras realizadas.
   * 
   * @returns Lista de compras ordenadas (geralmente por data)
   */
  listarTodas(): Promise<Compra[]>;
}

/**
 * Agregador de todos os repositórios disponíveis.
 * 
 * Facilita a injeção de dependências via contexto React.
 */
export interface Repositorios {
  produtos: RepositorioProdutos;
  carrinho: RepositorioCarrinho;
  historico: RepositorioHistorico;
}
