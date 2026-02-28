/**
 * ServiÃ§o de integraÃ§Ã£o com API Bluesoft Cosmos.
 *
 * DocumentaÃ§Ã£o: https://cosmos.bluesoft.com.br/api
 */

import { Produto } from '../types';
import { padronizarDadosProduto } from './ia';
import { formatarTitulo, extrairTamanho, normalizarTamanho } from './utilitarios';
import { CosmosAdapter } from './adapters/cosmos.adapter';

/**
 * Em desenvolvimento e produÃ§Ã£o, SEMPRE usa o proxy serverless.
 * O token Cosmos fica no servidor â€” o frontend NUNCA tem acesso.
 */
const URL_API_COSMOS = '/api/cosmos/gtin';

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
 * Busca informaÃ§Ãµes de um produto pelo cÃ³digo de barras (GTIN) na API Cosmos.
 *
 * :param gtin: CÃ³digo de barras do produto
 * :returns: Dados do produto formatados para o nosso app ou null se nÃ£o encontrado
 */
export async function buscarProdutoCosmos(gtin: string): Promise<Produto | null> {
  try {
    if (import.meta.env.VITE_USAR_API_COSMOS === 'false') {
      console.warn('ðŸš« [Cosmos] Uso da API Cosmos DESATIVADO pelo desenvolvedor.');
      return null;
    }

    // Sempre via proxy â€” token fica no servidor
    const url = `${URL_API_COSMOS}/${gtin}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 segundos

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      // Produto nÃ£o encontrado na base
      return null;
    }

    if (!response.ok) {
      console.warn(`[Cosmos] Erro HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const dados: ProdutoCosmosResponse = await response.json();
    console.log('[Cosmos] Resposta Bruta:', dados);

    // Adapter converte para o modelo de domÃ­nio (pt-BR)
    const produto = CosmosAdapter.paraDominio(dados);

    // 2. PadronizaÃ§Ã£o via IA (Melhoria de Qualidade de Dados)
    if (produto.descricao) {
      // Monta um contexto rico para a IA (igual ao OpenFoodFacts)
      const contexto = `Produto: ${produto.descricao}. Marca: ${produto.marca || '?'}. Tamanho: ${produto.tamanho || '?'}`;

      try {
        const dadosPadronizados = await padronizarDadosProduto(contexto);

        if (dadosPadronizados) {
          // Atualiza/Limpa os dados com o retorno da IA
          if (dadosPadronizados.descricao) produto.descricao = dadosPadronizados.descricao;
          if (dadosPadronizados.marca && dadosPadronizados.marca !== 'GenÃ©rica') produto.marca = dadosPadronizados.marca;
          // Padroniza tamanho conforme SI (kg, g, mg, L, ml, m, cm, mm)
          if (dadosPadronizados.tamanho) {
            produto.tamanho = normalizarTamanho(extrairTamanho(dadosPadronizados.tamanho) || dadosPadronizados.tamanho);
          }
        }
      } catch (err) {
        console.warn('[Cosmos] Falha na padronizaÃ§Ã£o IA (usando dados originais):', err);
      }
    }

    return produto;
  } catch (erro: any) {
    // Trata erros de rede/CORS sem quebrar a app
    if (erro.name === 'AbortError') {
      console.warn('[Cosmos] â±ï¸ Timeout de 7s atingido. API Cosmos demorou muito para responder.');
    } else if (erro instanceof TypeError && erro.message.includes('fetch')) {
      console.warn('[Cosmos] Falha de conexÃ£o ou CORS (Verifique Proxy):', erro.message);
    } else {
      console.error('[Cosmos] Erro na requisiÃ§Ã£o:', erro);
    }
    return null;
  }
}
