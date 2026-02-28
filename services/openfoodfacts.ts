import { Produto } from '../types';
import { OpenFoodFactsAdapter, ProdutoOFFResponse } from './adapters/openfoodfacts.adapter';
import { padronizarDadosProduto } from './ia';
import { extrairTamanho, normalizarTamanho } from './utilitarios';
import { NOMES_INVALIDOS } from '../constants';

const URL_API_OFF = 'https://world.openfoodfacts.org/api/v2/product';

// OFF = OpenFoodFacts
export async function buscarProdutoOFF(gtin: string): Promise<Produto | null> {
    try {
        if (import.meta.env.VITE_USAR_API_OPEN_FOOD_FACTS === 'false') {
            console.warn('ðŸš« [OFF] Uso da API OpenFoodFacts DESATIVADO pelo desenvolvedor.');
            return null;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

        const response = await fetch(`${URL_API_OFF}/${gtin}.json`, {
            method: 'GET',
            headers: {
                'User-Agent': 'SemSusto/1.0', // User-Agent Ã© obrigatÃ³rio/recomendado pela OFF
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            console.warn(`[OFF] Erro HTTP ${response.status}: ${response.statusText}`);
            return null;
        }

        const dados: ProdutoOFFResponse = await response.json();

        if (dados.status !== 1 || !dados.product) {
            return null; // Produto nÃ£o encontrado ou status invÃ¡lido
        }

        // 1. Converte para DomÃ­nio (Formato Bruto/Original)
        const produto = OpenFoodFactsAdapter.paraDominio(dados);

        // 2. PadronizaÃ§Ã£o via IA (Melhoria de Qualidade de Dados)
        if (produto.descricao && NOMES_INVALIDOS.has(produto.descricao.toLowerCase().trim())) {
            console.warn(`[OFF] Nome invÃ¡lido detectado: "${produto.descricao}". Limpando campo.`);
            produto.descricao = ''; // ForÃ§a o app a tratar como campo vazio
        }

        if (produto.descricao) {
            // Monta um contexto rico para a IA
            const contexto = `Produto: ${produto.descricao}. Marca: ${produto.marca || '?'}. Tamanho: ${produto.tamanho || '?'}`;

            try {
                // Chama o serviÃ§o de IA para limpar/padronizar os textos
                const dadosPadronizados = await padronizarDadosProduto(contexto);

                if (dadosPadronizados) {
                    if (dadosPadronizados.descricao) produto.descricao = dadosPadronizados.descricao;
                    // SÃ³ substitui a marca se a IA retornou algo Ãºtil e nÃ£o "GenÃ©rica"
                    if (dadosPadronizados.marca && !NOMES_INVALIDOS.has(dadosPadronizados.marca.toLowerCase().trim())) {
                        produto.marca = dadosPadronizados.marca;
                    }
                    // Padroniza tamanho conforme SI (kg, g, mg, L, ml, m, cm, mm)
                    if (dadosPadronizados.tamanho) {
                        const tamanhoLimpo = dadosPadronizados.tamanho.trim();
                        if (!NOMES_INVALIDOS.has(tamanhoLimpo.toLowerCase())) {
                            produto.tamanho = normalizarTamanho(extrairTamanho(tamanhoLimpo) || tamanhoLimpo);
                        } else {
                            produto.tamanho = '';
                        }
                    }
                }
            } catch (err) {
                console.warn('[OFF] Falha na padronizaÃ§Ã£o IA (usando dados originais):', err);
            }
        }

        // ValidaÃ§Ã£o Final (PÃ³s IA ou PÃ³s Adapter)
        // Garante que se o adapter ou a IA retornaram lixo, limpamos.
        if (produto.marca && NOMES_INVALIDOS.has(produto.marca.toLowerCase().trim())) produto.marca = '';
        if (produto.tamanho && NOMES_INVALIDOS.has(produto.tamanho.toLowerCase().trim())) produto.tamanho = '';

        return produto;

    } catch (erro: any) {
        if (erro.name === 'AbortError') {
            console.warn('[OFF] â±ï¸ Timeout de 7s atingido. API OpenFoodFacts demorou muito para responder.');
        } else {
            console.error('[OFF] Erro na requisiÃ§Ã£o:', erro);
        }
        return null;
    }
}
