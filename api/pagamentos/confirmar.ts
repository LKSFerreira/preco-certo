import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_lib/banco.js';
import { gerarCodigoToken, calcularHash, obterDuracaoPorPlano } from '../_lib/tokens.js';

/**
 * Endpoint para confirmar pagamento e gerar token premium automaticamente.
 *
 * **Uso:** POST /api/pagamentos/confirmar
 * **Chamado pelo:** Frontend após polling detectar status "aprovado"
 *
 * Fluxo:
 * 1. Recebe pagamento_id + plano_id do frontend
 * 2. Verifica no Mercado Pago se o pagamento está realmente aprovado (segurança)
 * 3. Verifica idempotência (se já existe token para esse pagamento)
 * 4. Gera token e insere no banco
 * 5. Retorna token em texto puro para exibição na UI
 *
 * @param req.body.pagamento_id - ID do pagamento no gateway (Mercado Pago)
 * @param req.body.plano_id - Plano contratado: "plano_cafe", "plano_lanche", "plano_apoiador"
 */

/** Mapeamento de plano_id (frontend) para plano (banco) */
const MAPA_PLANO_FRONTEND_PARA_BANCO: Record<string, string> = {
    plano_cafe: 'cafe',
    plano_lanche: 'lanche',
    plano_apoiador: 'apoiador',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Método não permitido' });
    }

    const { pagamento_id, plano_id } = req.body || {};

    // --- Validação de entrada ---
    if (!pagamento_id || typeof pagamento_id !== 'string') {
        return res.status(400).json({ erro: 'Campo "pagamento_id" é obrigatório' });
    }

    if (!plano_id || typeof plano_id !== 'string') {
        return res.status(400).json({ erro: 'Campo "plano_id" é obrigatório' });
    }

    const planoBanco = MAPA_PLANO_FRONTEND_PARA_BANCO[plano_id];
    if (!planoBanco) {
        return res.status(400).json({ erro: 'Plano inválido. Aceitos: plano_cafe, plano_lanche, plano_apoiador' });
    }

    try {
        // --- Modo Mock: retorna token fake sem tocar no banco ---
        const usarMock = process.env.GATEWAY_PAGAMENTO_BACKEND === 'mockado';

        if (usarMock) {
            const duracaoDias = obterDuracaoPorPlano(planoBanco);
            console.log(`🧪 [Confirmar][MOCK] Token fake gerado para ${pagamento_id} | Plano: ${planoBanco}`);
            return res.status(201).json({
                token: 'SEM-SUSTO-MOCK123',
                plano: planoBanco,
                duracao_dias: duracaoDias,
            });
        }

        // --- Idempotência: verifica se já existe token para esse pagamento ---
        const tokenExistente = await pool.query(
            `SELECT token_hash, plano, duracao_dias FROM tokens WHERE pagamento_id = $1`,
            [pagamento_id]
        );

        if (tokenExistente.rows.length > 0) {
            const registro = tokenExistente.rows[0];
            console.log(`♻️ [Confirmar] Token já existente para pagamento ${pagamento_id}`);
            return res.status(200).json({
                token_ja_existente: true,
                plano: registro.plano,
                duracao_dias: registro.duracao_dias,
                mensagem: 'Token já foi gerado para este pagamento. Use a tela de ativação para recuperá-lo.',
            });
        }

        // --- Verificação server-side: pagamento realmente aprovado? ---
        const tokenMercadoPago = process.env.MP_ACCESS_TOKEN;

        if (!tokenMercadoPago) {
            console.error('🚨 [Confirmar] MP_ACCESS_TOKEN não configurado');
            return res.status(500).json({ erro: 'Configuração de gateway incompleta' });
        }

        const respostaMP = await fetch(`https://api.mercadopago.com/v1/payments/${pagamento_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenMercadoPago}`,
            },
        });

        if (!respostaMP.ok) {
            return res.status(400).json({ erro: 'Não foi possível verificar o pagamento no gateway' });
        }

        const dadosMP = await respostaMP.json();

        if (dadosMP.status !== 'approved') {
            return res.status(400).json({
                erro: 'Pagamento não está aprovado',
                status_atual: dadosMP.status,
            });
        }

        // --- Geração do token ---
        const tokenTextoPuro = gerarCodigoToken();
        const tokenHash = calcularHash(tokenTextoPuro);
        const duracaoDias = obterDuracaoPorPlano(planoBanco);

        await pool.query(
            `INSERT INTO tokens (token_hash, plano, duracao_dias, pagamento_id)
             VALUES ($1, $2, $3, $4)`,
            [tokenHash, planoBanco, duracaoDias, pagamento_id]
        );

        console.log(`✅ [Confirmar] Token gerado para pagamento ${pagamento_id} | Plano: ${planoBanco} | Duração: ${duracaoDias}d`);

        return res.status(201).json({
            token: tokenTextoPuro,
            plano: planoBanco,
            duracao_dias: duracaoDias,
        });
    } catch (erro: any) {
        // Erro de constraint UNIQUE no pagamento_id (race condition entre requests simultâneos)
        if (erro.code === '23505' && erro.constraint?.includes('pagamento_id')) {
            console.warn(`⚠️ [Confirmar] Tentativa duplicada para pagamento ${pagamento_id}`);
            return res.status(409).json({
                erro: 'Token já foi gerado para este pagamento',
                token_ja_existente: true,
            });
        }

        console.error('🚨 [Confirmar] Erro:', erro.message);
        return res.status(500).json({ erro: 'Erro interno ao confirmar pagamento' });
    }
}
