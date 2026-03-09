import { fileURLToPath } from 'node:url';
import { criarPoolDatabase, encerrarPoolDatabase, exigirAmbienteLocal, obterClienteComRetry } from './_comum';

const __filename = fileURLToPath(import.meta.url);

interface ResumoResetBancoLocal {
  tabelasRemovidas: number;
}

function escaparIdentificador(nomeIdentificador: string): string {
  return `"${nomeIdentificador.replace(/"/g, '""')}"`;
}

export async function resetarBancoLocal(): Promise<ResumoResetBancoLocal> {
  exigirAmbienteLocal();

  const pool = criarPoolDatabase();
  const cliente = await obterClienteComRetry(pool);

  try {
    console.info('🗑️ Iniciando reset do banco local...');

    const resultadoTabelas = await cliente.query<{ tablename: string }>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    if (resultadoTabelas.rowCount === 0) {
      console.info('ℹ️ Nenhuma tabela encontrada para remoção.');
      return { tabelasRemovidas: 0 };
    }

    await cliente.query('BEGIN');

    for (const { tablename } of resultadoTabelas.rows) {
      console.info(`  🗑️ Dropando: ${tablename}`);
      await cliente.query(`DROP TABLE IF EXISTS ${escaparIdentificador(tablename)} CASCADE`);
    }

    await cliente.query('COMMIT');
    console.info(`✅ Reset concluído. ${resultadoTabelas.rowCount} tabela(s) removida(s).`);

    return { tabelasRemovidas: resultadoTabelas.rowCount };
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw new Error('Falha ao resetar o banco local.', { cause: erro });
  } finally {
    cliente.release();
    await encerrarPoolDatabase(pool);
  }
}

async function main(): Promise<void> {
  await resetarBancoLocal();
}

if (process.argv[1] === __filename) {
  main().catch((erro) => {
    console.error('❌ Erro ao resetar banco local:', erro);
    process.exit(1);
  });
}
