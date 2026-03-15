import { AmbienteOperacional, normalizarAmbiente, resolverFlagBooleana } from './_comum.js';

export type { AmbienteOperacional } from './_comum.js';

export function obterAmbienteOperacionalCliente(): AmbienteOperacional {
  return normalizarAmbiente(import.meta.env.VITE_APP_ENV, 'local');
}

export function resolverUsoLocalStorage(): boolean {
  return resolverFlagBooleana(import.meta.env.VITE_USAR_LOCALSTORAGE, true);
}

export function resolverUsoBancoPostgres(): boolean {
  const padrao = obterAmbienteOperacionalCliente() === 'local';
  return resolverFlagBooleana(import.meta.env.VITE_USAR_BANCO_POSTGRES, padrao);
}
