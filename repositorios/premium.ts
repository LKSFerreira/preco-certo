export interface IRepositorioPremium {
    /**
     * Salva o Hash do Token Premium com base na string limpa retornada da API.
     * Gera o SHA-256 no client side e persiste apenas o resultado.
     * @param tokenString Código puro gerado (ex: SEM-SUSTO-123)
     */
    salvarTokenHash(tokenString: string): Promise<void>;

    /**
     * Recupera o Token Hash armazenado para envio nos Headers da API.
     */
    obterTokenHash(): string | null;

    /**
     * Armazena os dias restantes de validade Premium (cache UI)
     */
    salvarDiasRestantes(dias: number): void;

    /**
     * Obtém os dias restantes de validade (cache UI)
     */
    obterDiasRestantes(): number | null;

    /**
     * Remove o token em caso de expiração ou logout manual
     */
    limparAcesso(): void;
}

/**
 * Cria um Hash SHA-256 simples no Client-Side via Web Crypto API nativa.
 */
async function hashearSHA256(texto: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class RepositorioPremiumLocalStorage implements IRepositorioPremium {
    private readonly CHAVE_TOKEN = 'sem_susto_premium_hash';
    private readonly CHAVE_DIAS = 'sem_susto_premium_dias';

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
        return dias ? parseInt(dias, 10) : null;
    }

    limparAcesso(): void {
        localStorage.removeItem(this.CHAVE_TOKEN);
        localStorage.removeItem(this.CHAVE_DIAS);
    }
}
