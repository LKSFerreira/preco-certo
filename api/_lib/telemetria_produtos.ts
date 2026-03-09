import type { PoolClient } from 'pg';

type EventoTelemetriaProduto = 'produto_encontrado' | 'produto_nao_encontrado';

type ParametrosRegistrarEventoProduto = {
    client: PoolClient;
    evento: EventoTelemetriaProduto;
    origem: string;
    codigo_barras: string;
    usuario_id: string;
    ip_hash: string;
    metadata?: Record<string, unknown>;
};

export async function registrarEventoProduto(parametros: ParametrosRegistrarEventoProduto) {
    const { client, evento, origem, codigo_barras, usuario_id, ip_hash, metadata } = parametros;

    await client.query(
        `
        INSERT INTO telemetria_produtos (
            data_referencia,
            evento,
            origem,
            codigo_barras,
            usuario_id,
            ip_hash,
            quantidade,
            metadata
        )
        VALUES (
            CURRENT_DATE,
            $1,
            $2,
            $3,
            $4,
            $5,
            1,
            $6
        )
        ON CONFLICT (data_referencia, evento, origem, codigo_barras, usuario_id, ip_hash)
        DO UPDATE SET
            quantidade = telemetria_produtos.quantidade + 1,
            ultimo_evento_em = CURRENT_TIMESTAMP,
            metadata = COALESCE(EXCLUDED.metadata, telemetria_produtos.metadata)
        `,
        [
            evento,
            origem,
            codigo_barras,
            usuario_id,
            ip_hash,
            metadata ? JSON.stringify(metadata) : null,
        ]
    );
}
