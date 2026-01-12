import OpenAI from 'openai';
import { ServicoLeituraRotulo, DadosProdutoExtraidos } from "./tipos";
import { logger } from "../logger";

export class ServicoIAOpenRouter implements ServicoLeituraRotulo {
  private client: OpenAI;
  // google/gemini-2.0-flash-exp:free 
  private readonly modelo: string = 'google/gemini-2.0-flash-exp:free';

  constructor(apiKey: string) {
    logger.info("🤖 Inicializando OpenRouter (Via OpenAI SDK)", { model: this.modelo });
    
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Necessário pois estamos chamando do front-end
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:5173', 
        'X-Title': 'Preço Certo App',
      },
    });
  }

  async extrairDados(imagemBase64: string): Promise<DadosProdutoExtraidos | null> {
    try {
      logger.info("📤 Enviando imagem para OpenRouter...");
      const dataUri = imagemBase64.startsWith('data:') 
        ? imagemBase64 
        : `data:image/jpeg;base64,${imagemBase64}`;

      const prompt = `Analise este rótulo de produto. Extraia Nome, Marca e Tamanho/Peso.
      Responda EXCLUSIVAMENTE um JSON puro, sem markdown, no formato:
      { "nome": "...", "marca": "...", "tamanho": "..." }`;

      logger.info("Payload preparado. Iniciando request...", { model: this.modelo });

      const completion = await this.client.chat.completions.create({
        model: this.modelo,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: dataUri
                }
              }
            ]
          },
        ],
      });

      const respostaTexto = completion.choices[0]?.message?.content;
      logger.info("📥 Resposta recebida!", { raw: respostaTexto?.substring(0, 100) + '...' });

      if (respostaTexto) {
        const jsonLimpo = respostaTexto.replace(/```json/g, '').replace(/```/g, '').trim();
        const dados = JSON.parse(jsonLimpo) as DadosProdutoExtraidos;
        logger.success("✅ Dados extraídos com sucesso", dados);
        return dados;
      }

      return null;

    } catch (error: any) {
      logger.error("❌ Erro OpenRouter", error);
      
      let msgErro = "Falha ao analisar rótulo com OpenRouter.";
      
      // Tratamento de erros específicos do SDK OpenAI
      if (error instanceof OpenAI.APIError) {
        msgErro = `Erro ${error.status}: ${error.message}`;
      } else if (error?.message) {
        msgErro += ` Detalhes: ${error.message}`;
      }

      throw new Error(msgErro);
    }
  }
}
