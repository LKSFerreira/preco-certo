import { setTimeout as aguardar } from 'node:timers/promises';
import { Pool, type PoolClient } from 'pg';
import { obterAmbienteOperacionalServidor, obterDatabaseUrlConfigurada } from '@/infra/ambiente/server';

export function criarPoolDatabase(): Pool {
  const databaseUrl = obterDatabaseUrlConfigurada();
  const ambiente = obterAmbienteOperacionalServidor();

  if (!databaseUrl) {
    throw new Error(`DATABASE_URL não definida para APP_ENV=${ambiente}.`);
  }

  const configuracao: any = {
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  };

  // SSL obrigatório para Supabase/Nuvem
  if (ambiente === 'producao' || databaseUrl.includes('supabase.com') || databaseUrl.includes('pooler.supabase.com')) {
    configuracao.ssl = {
      rejectUnauthorized: false
    };
  }

  return new Pool(configuracao);
}

export async function encerrarPoolDatabase(pool: Pool): Promise<void> {
  await pool.end();
}

export function normalizarBooleano(valorBruto: string | undefined, padrao: boolean): boolean {
  if (typeof valorBruto !== 'string') {
    return padrao;
  }

  const valorNormalizado = valorBruto.trim().toLowerCase();

  if (valorNormalizado === 'true') {
    return true;
  }

  if (valorNormalizado === 'false') {
    return false;
  }

  return padrao;
}

export function exigirAmbienteLocal(): void {
  const ambiente = obterAmbienteOperacionalServidor();

  if (ambiente !== 'local') {
    throw new Error(`Operação permitida apenas em APP_ENV=local. Ambiente atual: ${ambiente}.`);
  }
}

export async function obterClienteComRetry(
  pool: Pool,
  tentativas = 30,
  intervaloMs = 1000
): Promise<PoolClient> {
  let ultimaFalha: unknown;

  for (let tentativaAtual = 1; tentativaAtual <= tentativas; tentativaAtual += 1) {
    try {
      const cliente = await pool.connect();

      if (tentativaAtual > 1) {
        console.info(`✅ Conexão com PostgreSQL restabelecida na tentativa ${tentativaAtual}.`);
      }

      return cliente;
    } catch (erro) {
      ultimaFalha = erro;

      if (tentativaAtual === tentativas) {
        break;
      }

      console.info(`⏳ Aguardando banco... (${tentativaAtual}/${tentativas})`);
      await aguardar(intervaloMs);
    }
  }

  throw new Error('Timeout ao conectar no PostgreSQL.', { cause: ultimaFalha });
}
