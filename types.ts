// Modelo de dados padronizado com API Cosmos (Inglês)
export interface Produto {
  gtin: string;          // Antigo: codigo_barras
  description: string;   // Antigo: nome
  brand: string;        // Antigo: marca
  size: string;         // Antigo: tamanho_massa
  price: number;        // Antigo: preco_unitario
  thumbnail?: string;    // Antigo: foto_base64
}

// Extensão do produto para o carrinho (adiciona quantidade)
export interface ItemCarrinho extends Produto {
  quantity: number;      // Antigo: quantidade
  uuid: string;         // Antigo: id_unico
}

// Estados possíveis da tela da aplicação
export type TelaApp = 'DASHBOARD' | 'SCANNER' | 'CADASTRO' | 'CARRINHO';

// Configurações do App
export interface ConfiguracaoApp {
  mostrarFotos: boolean;
}

// Histórico de Compras
export interface Compra {
  id: string;
  data: string; // ISO String
  items: ItemCarrinho[]; // Antigo: itens
  total: number;
}