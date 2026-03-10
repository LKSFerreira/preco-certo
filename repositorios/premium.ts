export interface EstadoPremiumCacheado {
  ativo: boolean;
  plano: string | null;
  diasRestantes: number;
  expiraEm: string | null;
  ultimaValidacaoEm: number | null;
}

export interface IRepositorioPremium {
  /**
   * Salva o Hash do Token Premium com base na string limpa retornada da API.
   * Gera o SHA-256 no client side e persiste apenas o resultado.
   */
  salvarTokenHash(tokenString: string): Promise<void>;

  /**
   * Recupera o Hash do token premium armazenado.
   */
  obterTokenHash(): string | null;

  /**
   * Armazena os dias restantes de validade Premium.
   */
  salvarDiasRestantes(dias: number): void;

  /**
   * Recupera os dias restantes do cache local.
   */
  obterDiasRestantes(): number | null;

  /**
   * Persiste o estado premium derivado da fonte de verdade do backend.
   */
  salvarEstadoPremium(estado: EstadoPremiumCacheado): void;

  /**
   * Recupera o estado premium cacheado.
   */
  obterEstadoPremium(): EstadoPremiumCacheado;

  /**
   * Remove credenciais e cache local do premium.
   */
  limparAcesso(): void;
}

const ESTADO_PREMIUM_PADRAO: EstadoPremiumCacheado = {
  ativo: false,
  plano: null,
  diasRestantes: 0,
  expiraEm: null,
  ultimaValidacaoEm: null
};

async function hashearSHA256(texto: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byteAtual) => byteAtual.toString(16).padStart(2, '0')).join('');
}

export class RepositorioPremiumLocalStorage implements IRepositorioPremium {
  private readonly CHAVE_TOKEN = 'sem_susto_premium_hash';
  private readonly CHAVE_DIAS = 'sem_susto_premium_dias';
  private readonly CHAVE_ESTADO = 'sem_susto_premium_estado_v1';

  async salvarTokenHash(tokenString: string): Promise<void> {
    try {
      const hash = await hashearSHA256(tokenString);
      localStorage.setItem(this.CHAVE_TOKEN, hash);
    } catch (erro) {
      console.error('🚨 [Premium] Erro ao criptografar token localmente:', erro);
    }
  }

  obterTokenHash(): string | null {
    return localStorage.getItem(this.CHAVE_TOKEN);
  }

  salvarDiasRestantes(dias: number): void {
    localStorage.setItem(this.CHAVE_DIAS, dias.toString());
  }

  obterDiasRestantes(): number | null {
    const dias = localStorage.getItem(this.CHAVE_DIAS);
    return dias ? Number.parseInt(dias, 10) : null;
  }

  salvarEstadoPremium(estado: EstadoPremiumCacheado): void {
    this.salvarDiasRestantes(estado.diasRestantes);
    localStorage.setItem(this.CHAVE_ESTADO, JSON.stringify(estado));
  }

  obterEstadoPremium(): EstadoPremiumCacheado {
    const estadoBruto = localStorage.getItem(this.CHAVE_ESTADO);

    if (!estadoBruto) {
      return {
        ...ESTADO_PREMIUM_PADRAO,
        diasRestantes: this.obterDiasRestantes() || 0
      };
    }

    try {
      const estadoParseado = JSON.parse(estadoBruto) as Partial<EstadoPremiumCacheado>;
      return {
        ativo: estadoParseado.ativo === true,
        plano: typeof estadoParseado.plano === 'string' ? estadoParseado.plano : null,
        diasRestantes:
          typeof estadoParseado.diasRestantes === 'number'
            ? estadoParseado.diasRestantes
            : this.obterDiasRestantes() || 0,
        expiraEm: typeof estadoParseado.expiraEm === 'string' ? estadoParseado.expiraEm : null,
        ultimaValidacaoEm:
          typeof estadoParseado.ultimaValidacaoEm === 'number'
            ? estadoParseado.ultimaValidacaoEm
            : null
      };
    } catch (erro) {
      console.error('🚨 [Premium] Erro ao ler estado premium local:', erro);
      return {
        ...ESTADO_PREMIUM_PADRAO,
        diasRestantes: this.obterDiasRestantes() || 0
      };
    }
  }

  limparAcesso(): void {
    localStorage.removeItem(this.CHAVE_TOKEN);
    localStorage.removeItem(this.CHAVE_DIAS);
    localStorage.removeItem(this.CHAVE_ESTADO);
  }
}
