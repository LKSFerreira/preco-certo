import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PoolClient } from 'pg';
import { criarPoolDatabase, encerrarPoolDatabase, obterClienteComRetry } from './_comum';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIRETORIO_MIGRATIONS = path.resolve(__dirname, '../../database/migrations');

interface ResumoMigrations {
  migrationsAplicadas: number;
  migrationsPuladas: number;
}

async function garantirTabelaMigrations(cliente: PoolClient): Promise<void> {
  await cliente.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_id VARCHAR(255) PRIMARY KEY,
      aplicada_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function listarArquivosMigrations(): Promise<string[]> {
  const entradas = await readdir(DIRETORIO_MIGRATIONS, { withFileTypes: true });

  return entradas
    .filter((entrada) => entrada.isFile() && entrada.name.endsWith('.sql'))
    .map((entrada) => entrada.name)
    .sort((arquivoAtual, proximoArquivo) => arquivoAtual.localeCompare(proximoArquivo));
}

async function migrationJaAplicada(cliente: PoolClient, migrationId: string): Promise<boolean> {
  const resultado = await cliente.query('SELECT 1 FROM schema_migrations WHERE migration_id = $1', [
    migrationId
  ]);

  return resultado.rowCount > 0;
}

async function registrarMigration(cliente: PoolClient, migrationId: string): Promise<void> {
  await cliente.query('INSERT INTO schema_migrations (migration_id) VALUES ($1)', [migrationId]);
}

function erroRepresentaObjetoExistente(erro: unknown): boolean {
  if (!(erro instanceof Error)) {
    return false;
  }

  return erro.message.toLowerCase().includes('already exists');
}

export async function aplicarMigrations(): Promise<ResumoMigrations> {
  const pool = criarPoolDatabase();
  const cliente = await obterClienteComRetry(pool);

  try {
    console.info('🚀 Iniciando migrations...\n');
    await garantirTabelaMigrations(cliente);

    const arquivosMigrations = await listarArquivosMigrations();

    if (arquivosMigrations.length === 0) {
      console.info('ℹ️  Nenhuma migration encontrada.');
      return { migrationsAplicadas: 0, migrationsPuladas: 0 };
    }

    let migrationsAplicadas = 0;
    let migrationsPuladas = 0;

    for (const nomeArquivo of arquivosMigrations) {
      const migrationFoiAplicada = await migrationJaAplicada(cliente, nomeArquivo);

      if (migrationFoiAplicada) {
        console.info(`  ⏭️  Já aplicada: ${nomeArquivo}`);
        migrationsPuladas += 1;
        continue;
      }

      const caminhoArquivo = path.join(DIRETORIO_MIGRATIONS, nomeArquivo);
      const sqlMigration = await readFile(caminhoArquivo, 'utf-8');

      console.info(`  📄 Aplicando: ${nomeArquivo}`);

      try {
        await cliente.query('BEGIN');
        await cliente.query(sqlMigration);
        await registrarMigration(cliente, nomeArquivo);
        await cliente.query('COMMIT');
        migrationsAplicadas += 1;
      } catch (erro) {
        await cliente.query('ROLLBACK');

        if (erroRepresentaObjetoExistente(erro)) {
          console.warn(`\n⚠️  Objeto já existe, registrando migration: ${nomeArquivo}`);
          await registrarMigration(cliente, nomeArquivo);
          migrationsPuladas += 1;
          continue;
        }

        throw new Error(`Falha na migration ${nomeArquivo}`, { cause: erro });
      }
    }

    console.info(
      `\n✅ Migrations concluídas. Aplicadas: ${migrationsAplicadas}, Puladas: ${migrationsPuladas}`
    );

    return { migrationsAplicadas, migrationsPuladas };
  } finally {
    cliente.release();
    await encerrarPoolDatabase(pool);
  }
}

async function main(): Promise<void> {
  await aplicarMigrations();
}

if (process.argv[1] === __filename) {
  main().catch((erro) => {
    console.error('❌ Erro ao aplicar migrations:', erro);
    process.exit(1);
  });
}
