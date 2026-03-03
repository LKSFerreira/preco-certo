import { ServicoLeituraRotulo, DadosProdutoExtraidos } from "./tipos";
import { logger } from "../logger";
import { formatarTitulo, normalizarTamanho } from "../utilitarios";
import { RepositorioPremiumLocalStorage } from "../../repositorios/premium";

/**
 * Serviço de IA via proxy serverless.
 *
 * A chave Groq fica no servidor (api/ia/analisar.ts).
 * O frontend NUNCA tem acesso à chave — apenas envia
 * a imagem/texto para o proxy, que chama a Groq.
 */
export class ServicoIAGroq implements ServicoLeituraRotulo {
  // Modelos ficam no servidor (api/ia/analisar.ts)
  // O frontend não precisa saber qual modelo é usado

  constructor() {
    logger.info("⚡ Inicializando serviço IA (via proxy serverless)");
  }

  async extrairDados(imagemBase64: string): Promise<DadosProdutoExtraidos | null> {
    try {
      logger.info("📤 Enviando imagem para proxy IA...");

      const premium = new RepositorioPremiumLocalStorage();
      const tokenHash = premium.obterTokenHash();

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tokenHash) headers['X-Premium-Token'] = tokenHash;

      const resposta = await fetch('/api/ia/analisar', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tipo: 'imagem',
          conteudo: imagemBase64,
        }),
      });

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        logger.error("❌ Erro no proxy IA", erro);
        throw new Error(erro.erro || `Erro ${resposta.status}`);
      }

      const dados = await resposta.json() as DadosProdutoExtraidos;

      // Padronização Title Case (segurança extra, caso o servidor não faça)
      if (dados.descricao) dados.descricao = formatarTitulo(dados.descricao);
      if (dados.marca) dados.marca = formatarTitulo(dados.marca);
      if (dados.tamanho) dados.tamanho = normalizarTamanho(dados.tamanho);

      return dados;

    } catch (error: any) {
      logger.error("❌ Erro Groq Vision", error);
      throw error;
    }
  }

  async extrairDadosDeTexto(textoEntrada: string): Promise<DadosProdutoExtraidos | null> {
    try {
      logger.info("📝 Padronizando dados via proxy IA...");

      const premium = new RepositorioPremiumLocalStorage();
      const tokenHash = premium.obterTokenHash();

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tokenHash) headers['X-Premium-Token'] = tokenHash;

      const resposta = await fetch('/api/ia/analisar', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tipo: 'texto',
          conteudo: textoEntrada,
        }),
      });

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        console.warn("Erro ao padronizar texto:", erro);
        return null;
      }

      const dados = await resposta.json() as DadosProdutoExtraidos;

      // Padronização final via código (segurança)
      if (dados.descricao) dados.descricao = formatarTitulo(dados.descricao);
      if (dados.marca) dados.marca = formatarTitulo(dados.marca);
      if (dados.tamanho) dados.tamanho = normalizarTamanho(dados.tamanho);

      return dados;

    } catch (error) {
      console.warn("Erro ao padronizar texto Groq:", error);
      return null;
    }
  }
}
