import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ServicoLeituraRotulo, DadosProdutoExtraidos } from "./tipos";

export class ServicoIAGemini implements ServicoLeituraRotulo {
  private ai: GoogleGenAI | null = null;
  private readonly modelo: string = 'gemini-2.0-flash-exp';

  constructor(apiKey: string) {
    if (apiKey && apiKey !== 'PLACEHOLDER_API_KEY') {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.warn("Serviço Gemini inicializado sem chave de API válida.");
    }
  }

  async extrairDados(imagemBase64: string): Promise<DadosProdutoExtraidos | null> {
    if (!this.ai) {
      throw new Error("Chave de API do Gemini não configurada. Verifique suas variáveis de ambiente.");
    }

    try {
      // Remove cabeçalho data:image se existir, para garantir apenas o base64
      const dadosImagem = imagemBase64.includes(',') 
        ? imagemBase64.split(',')[1] 
        : imagemBase64;

      const esquemaProduto: Schema = {
        type: Type.OBJECT,
        properties: {
          nome: { type: Type.STRING, description: "Nome principal do produto." },
          marca: { type: Type.STRING, description: "Marca do fabricante." },
          tamanho: { type: Type.STRING, description: "Peso líquido ou volume (ex: 1kg, 500ml)." },
        },
        required: ["nome"],
      };

      const prompt = `Analise este rótulo de produto. Extraia Nome, Marca e Tamanho/Peso. Responda apenas JSON.`;

      const response = await this.ai.models.generateContent({
        model: this.modelo,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: dadosImagem } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: esquemaProduto,
          temperature: 0.1
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as DadosProdutoExtraidos;
      }
      return null;

    } catch (error) {
      console.error("Erro na análise Gemini:", error);
      throw new Error("Falha ao analisar rótulo com Gemini.");
    }
  }
}
