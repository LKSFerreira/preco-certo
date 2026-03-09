import { Pool } from 'pg';
import { obterAmbienteOperacionalServidor, obterDatabaseUrlConfigurada } from '@/infra/ambiente/server';

export function criarPoolDatabase(): Pool {
  const databaseUrl = obterDatabaseUrlConfigurada();
  const ambiente = obterAmbienteOperacionalServidor();

  if (!databaseUrl) {
    throw new Error(`DATABASE_URL não definida para APP_ENV=${ambiente}.`);
  }

  return new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
}

export async function encerrarPoolDatabase(pool: Pool): Promise<void> {
  await pool.end();
}
