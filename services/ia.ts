import { FabricaServicoIA } from "./ia/fabrica";

/**
 * Entidade para abstrair o uso da IA no sistema.
 * Atualmente suporta: Groq (Meta Llama), Mock.
 * Configuração: chave GROQ_TOKEN fica no servidor (api/ia/analisar.ts).
 */
export const extrairDadosDoRotulo = async (imagemBase64: string) => {
  if (import.meta.env.VITE_USAR_API_GROQ === 'false') {
    console.warn('🚫 [IA] Uso da API Groq DESATIVADO pelo desenvolvedor.');
    return null;
  }
  const servico = await FabricaServicoIA.obterInstancia();
  return await servico.extrairDados(imagemBase64);
};

export const padronizarDadosProduto = async (texto: string) => {
  if (import.meta.env.VITE_USAR_API_GROQ === 'false') {
    console.warn('🚫 [IA] Uso da API Groq DESATIVADO pelo desenvolvedor.');
    return null;
  }
  const servico = await FabricaServicoIA.obterInstancia();
  return await servico.extrairDadosDeTexto(texto);
};