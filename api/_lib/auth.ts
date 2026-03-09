import pool from '../../lib/database/banco.js';

/**
 * Valida se um Hash de Token possui status Premium ativo no banco de dados.
 * Protege contra acessos indevidos na API.
 *
 * @param tokenHash Hash SHA-256 do token fornecido pelo cliente
 * @returns true se o token existe e está ativo/não expirado
 */
export async function validarAcessoPremium(tokenHash: string): Promise<boolean> {
    if (!tokenHash) return false;

    try {
        const resultado = await pool.query(
            "SELECT status, expira_em FROM tokens WHERE token_hash = $1",
            [tokenHash]
        );

        if (resultado.rows.length === 0) {
            console.warn(`🚨 [Auth] Tentativa de acesso com Token falso gerado no cliente: ${tokenHash}`);
            return false;
        }

        const t = resultado.rows[0];
        if (t.status !== 'ativo' || (t.expira_em && new Date(t.expira_em) < new Date())) {
            console.warn(`🚨 [Auth] Tentativa de acesso com Token expirado: ${tokenHash}`);
            return false;
        }

        return true;
    } catch (dbErr) {
        console.error('🚨 [Auth] Erro ao validar banco:', dbErr);
        return false;
    }
}
