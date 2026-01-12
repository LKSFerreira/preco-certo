import OpenAI from 'openai';
import { ServicoLeituraRotulo, DadosProdutoExtraidos } from "./tipos";

import { logger } from "../logger";
import { formatarTitulo } from "../utilitarios";

export class ServicoIAGroq implements ServicoLeituraRotulo {
  private client: OpenAI;
  
  // Modelos Atualizados (Baseado na lista Free Tier)
  // Vision: Llama 4 Scout (Multimodal)
  private readonly modeloVision: string = 'meta-llama/llama-4-scout-17b-16e-instruct'; 
  
  // Texto: Llama 3.1 8B Instant (Alta velocidade, alto RPD)
  private readonly modeloTexto: string = 'llama-3.1-8b-instant'; 

  constructor(apiKey: string) {
    logger.info("⚡ Inicializando Groq (Via OpenAI SDK)", { visionModel: this.modeloVision, textModel: this.modeloTexto });
    
    this.client = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, 
    });
  }

  async extrairDados(imagemBase64: string): Promise<DadosProdutoExtraidos | null> {
    try {
      logger.info("📤 Enviando imagem para Groq Vision...", { model: this.modeloVision });
      
      const dataUri = imagemBase64.startsWith('data:') 
        ? imagemBase64 
        : `data:image/jpeg;base64,${imagemBase64}`;

      const prompt = `Analise este rótulo de produto. Extraia Nome, Marca e Tamanho/Peso.
      Responda EXCLUSIVAMENTE um JSON puro, sem markdown, no formato:
      { "description": "...", "brand": "...", "size": "..." }
      
      Regras:
      1. description: Nome completo e claro do produto.
      2. brand: Marca do fabricante (ex: Coca-Cola, Nestlé).
      3. size: Peso/Volume com unidade (ex: 350ml, 1kg).`;

      const completion = await this.client.chat.completions.create({
        model: this.modeloVision,
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
        temperature: 0.1,
        max_tokens: 1024,
      });

      const respostaTexto = completion.choices[0]?.message?.content;
      
      if (respostaTexto) {
        const jsonMatch = respostaTexto.match(/\{[\s\S]*\}/);
        const jsonLimpo = jsonMatch ? jsonMatch[0] : respostaTexto;
        const dados = JSON.parse(jsonLimpo) as DadosProdutoExtraidos;
        
        // Padronização Title Case
        if (dados.description) dados.description = formatarTitulo(dados.description);
        if (dados.brand) dados.brand = formatarTitulo(dados.brand);

        return dados;
      }

      return null;

    } catch (error: any) {
      logger.error("❌ Erro Groq Vision", error);
      throw error;
    }
  }

  async extrairDadosDeTexto(descricao: string): Promise<DadosProdutoExtraidos | null> {
    try {
      logger.info("📝 Extraindo dados de texto via Groq...", { model: this.modeloTexto });

      const prompt = `Analise a descrição: "${descricao}".
      Extraia Marca (brand) e Tamanho (size).
      Responda APENAS JSON: { "brand": "...", "size": "..." }`;

      const completion = await this.client.chat.completions.create({
        model: this.modeloTexto,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const respostaTexto = completion.choices[0]?.message?.content;
      
      if (respostaTexto) {
         const dados = JSON.parse(respostaTexto) as DadosProdutoExtraidos;
         if (dados.brand) dados.brand = formatarTitulo(dados.brand);
         return dados;
      }
      return null;

    } catch (error) {
      console.warn("Erro ao extrair texto Groq:", error);
      return null;
    }
  }
}
