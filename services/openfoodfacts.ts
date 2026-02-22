import { Produto } from '../types';
import { OpenFoodFactsAdapter, ProdutoOFFResponse } from './adapters/openfoodfacts.adapter';
import { padronizarDadosProduto } from './ia';
import { extrairTamanho } from './utilitarios';
import { NOMES_INVALIDOS } from '../constants';

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v2/product';

// OFF = OpenFoodFacts
export async function buscarProdutoOFF(gtin: string): Promise<Produto | null> {
    try {
        if (import.meta.env.VITE_USAR_API_OPEN_FOOD_FACTS === 'false') {
            console.warn('🚫 [OFF] Uso da API OpenFoodFacts DESATIVADO pelo desenvolvedor.');
            return null;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

        const response = await fetch(`${OFF_API_URL}/${gtin}.json`, {
            method: 'GET',
            headers: {
                'User-Agent': 'SemSusto/1.0', // User-Agent é obrigatório/recomendado pela OFF
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
            return null; // Produto não encontrado ou status inválido
        }

        // 1. Converte para Domínio (Formato Bruto/Original)
        const produto = OpenFoodFactsAdapter.paraDominio(dados);

        // 2. Padronização via IA (Melhoria de Qualidade de Dados)
        if (produto.descricao && NOMES_INVALIDOS.has(produto.descricao.toLowerCase().trim())) {
            console.warn(`[OFF] Nome inválido detectado: "${produto.descricao}". Limpando campo.`);
            produto.descricao = ''; // Força o app a tratar como campo vazio
        }

        if (produto.descricao) {
            // Monta um contexto rico para a IA
            const contexto = `Produto: ${produto.descricao}. Marca: ${produto.marca || '?'}. Tamanho: ${produto.tamanho || '?'}`;

            try {
                // Chama o serviço de IA para limpar/padronizar os textos
                const dadosPadronizados = await padronizarDadosProduto(contexto);

                if (dadosPadronizados) {
                    if (dadosPadronizados.descricao) produto.descricao = dadosPadronizados.descricao;
                    // Só substitui a marca se a IA retornou algo útil e não "Genérica"
                    if (dadosPadronizados.marca && !NOMES_INVALIDOS.has(dadosPadronizados.marca.toLowerCase().trim())) {
                        produto.marca = dadosPadronizados.marca;
                    }
                    // Padroniza tamanho conforme SI (kg, g, mg, L, ml, m, cm, mm)
                    if (dadosPadronizados.tamanho) {
                        const tamanhoLimpo = dadosPadronizados.tamanho.trim();
                        if (!NOMES_INVALIDOS.has(tamanhoLimpo.toLowerCase())) {
                            produto.tamanho = extrairTamanho(tamanhoLimpo) || tamanhoLimpo;
                        } else {
                            produto.tamanho = '';
                        }
                    }
                }
            } catch (err) {
                console.warn('[OFF] Falha na padronização IA (usando dados originais):', err);
            }
        }

        // Validação Final (Pós IA ou Pós Adapter)
        // Garante que se o adapter ou a IA retornaram lixo, limpamos.
        if (produto.marca && NOMES_INVALIDOS.has(produto.marca.toLowerCase().trim())) produto.marca = '';
        if (produto.tamanho && NOMES_INVALIDOS.has(produto.tamanho.toLowerCase().trim())) produto.tamanho = '';

        return produto;

    } catch (erro: any) {
        if (erro.name === 'AbortError') {
            console.warn('[OFF] ⏱️ Timeout de 7s atingido. API OpenFoodFacts demorou muito para responder.');
        } else {
            console.error('[OFF] Erro na requisição:', erro);
        }
        return null;
    }
}
