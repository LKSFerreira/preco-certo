import { fileURLToPath } from 'node:url';
import { criarPoolDatabase, encerrarPoolDatabase, obterClienteComRetry } from './_comum';

const __filename = fileURLToPath(import.meta.url);
const PADRAO_PAGAMENTO_MOCKADO = 'PIX-MOCKADO_%_SEM-SUSTO';

interface ResumoRemocaoPagamentosMockados {
  quantidadeRemovida: number;
  pagamentosRemovidos: string[];
}

export async function removerPagamentosMockados(): Promise<ResumoRemocaoPagamentosMockados> {
  const pool = criarPoolDatabase();
  const cliente = await obterClienteComRetry(pool);

  try {
    const resultado = await cliente.query<{ pagamento_id: string }>(
      `
        DELETE FROM tokens
        WHERE pagamento_id LIKE $1
        RETURNING pagamento_id
      `,
      [PADRAO_PAGAMENTO_MOCKADO]
    );

    if (resultado.rowCount === 0) {
      console.info('ℹ️ Nenhum token mockado encontrado para remoção.');
      return {
        quantidadeRemovida: 0,
        pagamentosRemovidos: []
      };
    }

    const pagamentosRemovidos = resultado.rows.map((linha) => linha.pagamento_id);
    console.info(`✅ ${pagamentosRemovidos.length} token(s) mockado(s) removido(s) com sucesso!`);

    for (const pagamentoId of pagamentosRemovidos) {
      console.info(`   - ${pagamentoId}`);
    }

    return {
      quantidadeRemovida: pagamentosRemovidos.length,
      pagamentosRemovidos
    };
  } finally {
    cliente.release();
    await encerrarPoolDatabase(pool);
  }
}

async function main(): Promise<void> {
  await removerPagamentosMockados();
}

if (process.argv[1] === __filename) {
  main().catch((erro) => {
    console.error('❌ Erro ao remover tokens mockados:', erro);
    process.exit(1);
  });
}
