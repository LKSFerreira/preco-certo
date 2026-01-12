import { ServicoLeituraRotulo } from "./tipos";
import { ServicoIAGemini } from "./gemini";
import { ServicoIAOpenRouter } from "./openrouter";
import { ServicoIAMock } from "./mock";

export class FabricaServicoIA {
  static criar(): ServicoLeituraRotulo {
    // Prioriza a nova variável genérica
    const apiKey = import.meta.env.VITE_OPENROUTER_TOKEN || import.meta.env.VITE_GOOGLE_TOKEN;
    
    // Se não tiver chave válida, usa Mock
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      console.log("🏭 FabricaIA: Sem chave válida, usando MOCK.");
      return new ServicoIAMock();
    }

    // Como o usuário definiu OpenRouter como padrão principal:
    console.log("🏭 FabricaIA: Usando serviço OPENROUTER");
    return new ServicoIAOpenRouter(apiKey);
    
    // Futuro: Se quiser lógica de decisão dinâmica:
    // if (provider === 'gemini') return new ServicoIAGemini(apiKey);
  }
}

// Instância singleton para uso no app
export const servicoIA = FabricaServicoIA.criar();
