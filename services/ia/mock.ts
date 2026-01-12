import { ServicoLeituraRotulo, DadosProdutoExtraidos } from "./tipos";

/**
 * Mock para testes ou uso gratuito/offline.
 * Retorna dados fictícios ou aleatórios baseados no tamanho da string da imagem.
 */
export class ServicoIAMock implements ServicoLeituraRotulo {
  async extrairDados(imagemBase64: string): Promise<DadosProdutoExtraidos | null> {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.info("MOCK IA: Analisando imagem (simulação)...");

    // Retorna dados fixos para teste
    return {
      description: "Produto Teste Mockado",
      brand: "Marca Genérica",
      size: "1kg"
    };
  }

  async extrairDadosDeTexto(descricao: string): Promise<DadosProdutoExtraidos | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      description: descricao,
      brand: "Marca Mockada Texto",
      size: "500g"
    };
  }
}
