import { ServicoLeituraRotulo } from "./tipos";

export class FabricaServicoIA {
  private static instancia: ServicoLeituraRotulo | null = null;

  static async obterInstancia(): Promise<ServicoLeituraRotulo> {
    if (this.instancia) return this.instancia;

    const usarMock = import.meta.env.VITE_MOCK_IA === 'true';

    if (usarMock) {
      console.log("🏭 FabricaIA: Usando MOCK (carregamento dinâmico).");
      const { ServicoIAMock } = await import("./mock");
      this.instancia = new ServicoIAMock();
    } else {
      console.log("🏭 FabricaIA: Usando serviço GROQ (carregamento dinâmico)");
      const { ServicoIAGroq } = await import("./groq");
      this.instancia = new ServicoIAGroq();
    }

    return this.instancia;
  }
}
