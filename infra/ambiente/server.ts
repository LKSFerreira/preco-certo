import { AmbienteOperacional, normalizarAmbiente } from './_comum.js';

export type { AmbienteOperacional } from './_comum.js';

export function obterAmbienteOperacionalServidor(): AmbienteOperacional {
  if (process.env.APP_ENV) {
    return normalizarAmbiente(process.env.APP_ENV, 'local');
  }

  if (process.env.NODE_ENV === 'development') {
    return 'local';
  }

  return 'producao';
}

export function obterDatabaseUrlConfigurada(): string | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  return databaseUrl ? databaseUrl : null;
}
