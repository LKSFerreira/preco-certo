import { ServicoLeituraRotulo, DadosProdutoExtraidos } from "./tipos";
import { logger } from "../logger";
import { formatarTitulo, normalizarTamanho } from "../utilitarios";
import { RepositorioPremiumLocalStorage } from "../../repositorios/premium";

/**
 * ServiÃ§o de IA via proxy serverless.
 *
 * A chave Groq fica no servidor (api/ia/analisar.ts).
 * O frontend NUNCA tem acesso Ã  chave â€” apenas envia
 * a imagem/texto para o proxy, que chama a Groq.
 */
export class ServicoIAGroq implements ServicoLeituraRotulo {
  // Modelos ficam no servidor (api/ia/analisar.ts)
  // O frontend nÃ£o precisa saber qual modelo Ã© usado

  constructor() {
    logger.info("âš¡ Inicializando serviÃ§o IA (via proxy serverless)");
  }

  async extrairDados(imagemBase64: string): Promise<DadosProdutoExtraidos | null> {
    try {
      logger.info("ðŸ“¤ Enviando imagem para proxy IA...");

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
        logger.error("âŒ Erro no proxy IA", erro);
        throw new Error(erro.erro || `Erro ${resposta.status}`);
      }

      const dados = await resposta.json() as DadosProdutoExtraidos;

      // PadronizaÃ§Ã£o Title Case (seguranÃ§a extra, caso o servidor nÃ£o faÃ§a)
      if (dados.descricao) dados.descricao = formatarTitulo(dados.descricao);
      if (dados.marca) dados.marca = formatarTitulo(dados.marca);
      if (dados.tamanho) dados.tamanho = normalizarTamanho(dados.tamanho);

      return dados;

    } catch (error: any) {
      logger.error("âŒ Erro Groq Vision", error);
      throw error;
    }
  }

  async extrairDadosDeTexto(textoEntrada: string): Promise<DadosProdutoExtraidos | null> {
    try {
      logger.info("ðŸ“ Padronizando dados via proxy IA...");

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

      // PadronizaÃ§Ã£o final via cÃ³digo (seguranÃ§a)
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
