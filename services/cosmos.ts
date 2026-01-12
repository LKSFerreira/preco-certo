/**
 * Serviço de integração com API Bluesoft Cosmos.
 * 
 * Documentação: https://cosmos.bluesoft.com.br/api
 */

import { Produto } from '../types';
import { servicoIA } from './ia/fabrica';
import { formatarTitulo } from './utilitarios';

// Em desenvolvimento, usa o proxy configurado no vite.config.ts para evitar CORS.
// Em produção, tenta acesso direto (sujeito a regras de CORS do backend).
const IS_DEV = import.meta.env.DEV;
const COSMOS_API_URL = IS_DEV ? '/api-cosmos' : 'https://api.cosmos.bluesoft.com.br';
const COSMOS_TOKEN = 'zOBQAGX-tS4BoV-_J2L7Pw';

/**
 * Interface exata dos dados retornados pela API Cosmos.
 */
export interface ProdutoCosmosResponse {
  gtin: number;
  description: string;
  avg_price: number;
  max_price: number;
  price: string;
  thumbnail: string;
  brand: {
    name: string;
    picture: string;
  };
  gpc: {
    code: string;
    description: string;
  };
  ncm: {
    code: string;
    description: string;
    full_description: string;
  };
  gross_weight: number;
  net_weight: number;
  width: number;
  height: number;
  length: number;
}

/**
 * Busca informações de um produto pelo código de barras (GTIN) na API Cosmos.
 * 
 * :param gtin: Código de barras do produto
 * :returns: Dados do produto formatados para o nosso app ou null se não encontrado
 */
export async function buscarProdutoCosmos(gtin: string): Promise<Produto | null> {
  try {
    const response = await fetch(`${COSMOS_API_URL}/gtins/${gtin}.json`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Cosmos-API-Request',
        'Content-Type': 'application/json',
        'X-Cosmos-Token': COSMOS_TOKEN
      }
    });

    if (response.status === 404) {
      // Produto não encontrado na base
      return null;
    }

    if (!response.ok) {
      console.warn(`[Cosmos] Erro HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const dados: ProdutoCosmosResponse = await response.json();
    
    // Mapeamento inicial
    const description = formatarTitulo(dados.description);
    let brand = formatarTitulo(dados.brand?.name || '');
    let size = extrairTamanho(dados.description) || '';

    // Enriquecimento Inteligente (Melhoria UX #1)
    // Se não tiver marca mas tiver descrição, usa IA de texto para inferir
    if (!brand && description) {
      console.log('[Cosmos] Marca ausente. Tentando inferir via IA...');
      try {
        const dadosIA = await servicoIA.extrairDadosDeTexto(description);
        if (dadosIA) {
          if (dadosIA.brand) brand = dadosIA.brand;
          // Se a IA também achou tamanho e não tínhamos extraído via regex, usa da IA
          if (dadosIA.size && !size) size = dadosIA.size;
        }
      } catch (err) {
        console.warn('[Cosmos] Falha ao inferir marca via IA:', err);
      }
    }

    return {
      gtin: String(dados.gtin),
      description,
      brand,
      size,
      price: dados.avg_price || 0, // Usa preço médio como sugestão
      thumbnail: dados.thumbnail || undefined
    };

  } catch (erro: any) {
    // Trata erros de rede/CORS sem quebrar a app
    if (erro instanceof TypeError && erro.message.includes('fetch')) {
      console.warn('[Cosmos] Falha de conexão ou CORS (Verifique Proxy):', erro.message);
    } else {
      console.error('[Cosmos] Erro na requisição:', erro);
    }
    return null;
  }
}

/**
 * Tenta extrair o tamanho/peso da string de descrição.
 * Ex: "... 1KG" -> "1KG"
 */
function extrairTamanho(descricao: string): string | null {
  const regex = /\b(\d+(?:[.,]\d+)?\s*(?:KG|G|L|ML|MM|M))\b/i;
  const match = descricao.match(regex);
  return match ? match[1].toUpperCase() : null;
}
