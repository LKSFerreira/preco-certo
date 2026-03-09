import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z as zod } from 'zod';
import { createHash } from 'crypto';
import pool from '../_lib/banco.js';
import { registrarEventoProduto } from '../_lib/telemetria_produtos.js';

// Schema de Validação (Blindagem contra lixo)
const schemaProduto = zod.object({
    descricao: zod.string().min(3).max(200).transform(s => s.trim()), // Sanitização básica
    marca: zod.string().min(1).max(100).transform(s => s.trim()),
    tamanho: zod.string().min(1).max(50).transform(s => s.trim()),
    preco_estimado: zod.number().min(0).optional(),
    imagem: zod.string().url().optional().or(zod.literal('')), // URL válida ou vazia
});

// Helper para Hash de IP (Privacidade)
const hashIp = (ip: string) => createHash('sha256').update(ip).digest('hex');

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { codigo } = req.query;
    const codigoFinal = codigo || (req as any).params?.codigo;

    if (!codigoFinal || Array.isArray(codigoFinal)) {
        return res.status(400).json({ erro: 'Código de barras inválido' });
    }

    // Identifica Cliente (IP Header Padrão Vercel vs Local)
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const ipHash = hashIp(clientIp);

    // --- GET: Consulta + Telemetria de Comportamento ---
    if (req.method === 'GET') {
        try {
            const client = await pool.connect();
            try {
                const resultado = await client.query(
                    'SELECT * FROM produtos WHERE codigo_barras = $1',
                    [codigoFinal]
                );

                await registrarEventoProduto({
                    client,
                    evento: resultado.rows.length === 0 ? 'produto_nao_encontrado' : 'produto_encontrado',
                    origem: 'api_produtos_get',
                    codigo_barras: codigoFinal,
                    usuario_id: 'anonimo',
                    ip_hash: ipHash,
                });

                if (resultado.rows.length === 0) {
                    return res.status(404).json({ erro: 'Produto não encontrado' });
                }

                return res.status(200).json(resultado.rows[0]);
            } finally {
                client.release();
            }
        } catch (erro) {
            console.error('🚨 [API Produtos]', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar produto' });
        }
    }

    // --- POST: Salvar/Atualizar (Auditada via Trigger) ---
    if (req.method === 'POST') {
        // 1. Rate Limiting (Flood Protection)
        const limite = await pool.query(
            `SELECT COUNT(*) as total FROM rate_limit_aposta 
       WHERE ip_hash = $1 AND endpoint = '/api/produtos' 
       AND criado_em > NOW() - INTERVAL '1 minute'`,
            [ipHash]
        );

        if (parseInt(limite.rows[0].total) > 10) {
            return res.status(429).json({ erro: 'Calma! Muitas requisições. Tente em 1 minuto.' });
        }

        // Registra tentativa (mesmo se falhar validação Zod depois, já contou)
        await pool.query(
            `INSERT INTO rate_limit_aposta (ip_hash, endpoint) VALUES ($1, '/api/produtos')`,
            [ipHash]
        );

        // 2. Validação Zod
        const validacao = schemaProduto.safeParse(req.body);
        if (!validacao.success) {
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: validacao.error.format() });
        }

        const { descricao, marca, tamanho, preco_estimado, imagem } = validacao.data;

        // 3. Transação com Contexto (Para o Trigger pegar o IP)
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Injeta Variáveis de Sessão (Usando set_config para suportar parametros)
            await client.query(`SELECT set_config('app.current_user_token', 'anonimo', true)`);
            await client.query(`SELECT set_config('app.client_ip', $1, true)`, [ipHash]);

            // Upsert (Insert ou Update)
            const query = `
        INSERT INTO produtos (codigo_barras, descricao, marca, tamanho, preco_estimado, imagem, atualizado_em)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (codigo_barras) 
        DO UPDATE SET 
          descricao = EXCLUDED.descricao,
          marca = EXCLUDED.marca,
          tamanho = EXCLUDED.tamanho,
          preco_estimado = COALESCE(EXCLUDED.preco_estimado, produtos.preco_estimado),
          imagem = COALESCE(EXCLUDED.imagem, produtos.imagem),
          atualizado_em = NOW()
        RETURNING *;
      `;

            const resultado = await client.query(query, [
                codigoFinal, descricao, marca, tamanho, preco_estimado || 0, imagem || null
            ]);

            await client.query('COMMIT');
            return res.status(200).json(resultado.rows[0]);

        } catch (erro) {
            await client.query('ROLLBACK');
            console.error('🚨 [API Produtos] ERRO DETALHADO:', erro);
            return res.status(500).json({ erro: 'Erro ao salvar produto' });
        } finally {
            client.release();
        }
    }

    return res.status(405).json({ erro: 'Método não permitido' });
}
