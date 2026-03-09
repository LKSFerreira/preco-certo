import { createHash } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z as zod } from 'zod';
import pool from '../_lib/banco.js';
import { registrarEventoProduto } from '../_lib/telemetria_produtos.js';

const schemaProduto = zod.object({
    descricao: zod.string().min(3).max(200).transform((descricao) => descricao.trim()),
    marca: zod.string().min(1).max(100).transform((marca) => marca.trim()),
    tamanho: zod.string().min(1).max(50).transform((tamanho) => tamanho.trim()),
    preco_estimado: zod.number().min(0).optional(),
    imagem: zod.string().url().optional().or(zod.literal('')),
});

function hashIp(ip: string) {
    return createHash('sha256').update(ip).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { codigo } = req.query;
    const codigoFinal = codigo || (req as any).params?.codigo;

    if (!codigoFinal || Array.isArray(codigoFinal)) {
        return res.status(400).json({ erro: 'Código de barras inválido' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const ipHash = hashIp(clientIp);
    const usuarioId = 'anonimo';

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
                    usuario_id: usuarioId,
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
            console.error('[API Produtos] Erro ao buscar produto:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar produto' });
        }
    }

    if (req.method === 'POST') {
        const limite = await pool.query(
            `SELECT COUNT(*) as total FROM rate_limit_aposta
             WHERE ip_hash = $1 AND endpoint = '/api/produtos'
             AND criado_em > NOW() - INTERVAL '1 minute'`,
            [ipHash]
        );

        if (parseInt(limite.rows[0].total, 10) > 10) {
            return res.status(429).json({ erro: 'Calma. Muitas requisições. Tente novamente em 1 minuto.' });
        }

        await pool.query(
            `INSERT INTO rate_limit_aposta (ip_hash, endpoint) VALUES ($1, '/api/produtos')`,
            [ipHash]
        );

        const validacao = schemaProduto.safeParse(req.body);

        if (!validacao.success) {
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: validacao.error.format() });
        }

        const { descricao, marca, tamanho, preco_estimado, imagem } = validacao.data;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            await client.query(`SELECT set_config('app.current_user_token', $1, true)`, [usuarioId]);
            await client.query(`SELECT set_config('app.client_ip', $1, true)`, [ipHash]);

            const query = `
                INSERT INTO produtos_adicionados_pelo_usuario (
                    codigo_barras,
                    descricao,
                    marca,
                    tamanho,
                    preco_informado,
                    imagem,
                    origem,
                    status_curadoria,
                    usuario_id,
                    ip_hash,
                    atualizado_em
                )
                VALUES ($1, $2, $3, $4, $5, $6, 'catalogo_local_usuario', 'pendente', $7, $8, NOW())
                ON CONFLICT (codigo_barras, usuario_id, ip_hash)
                DO UPDATE SET
                    descricao = EXCLUDED.descricao,
                    marca = EXCLUDED.marca,
                    tamanho = EXCLUDED.tamanho,
                    preco_informado = COALESCE(EXCLUDED.preco_informado, produtos_adicionados_pelo_usuario.preco_informado),
                    imagem = COALESCE(EXCLUDED.imagem, produtos_adicionados_pelo_usuario.imagem),
                    origem = EXCLUDED.origem,
                    status_curadoria = 'pendente',
                    atualizado_em = NOW()
                RETURNING id, codigo_barras, status_curadoria, criado_em, atualizado_em;
            `;

            const resultado = await client.query(query, [
                codigoFinal,
                descricao,
                marca,
                tamanho,
                preco_estimado ?? null,
                imagem || null,
                usuarioId,
                ipHash,
            ]);

            await client.query('COMMIT');

            return res.status(202).json({
                status: 'enviado_para_curadoria',
                destino: 'produtos_adicionados_pelo_usuario',
                registro: resultado.rows[0],
            });
        } catch (erro) {
            await client.query('ROLLBACK');
            console.error('[API Produtos] Erro ao registrar staging de produto:', erro);
            return res.status(500).json({ erro: 'Erro ao registrar produto para curadoria' });
        } finally {
            client.release();
        }
    }

    return res.status(405).json({ erro: 'Método não permitido' });
}
