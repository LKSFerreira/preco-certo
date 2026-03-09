export type AmbienteOperacional = 'local' | 'producao';

function normalizarAmbiente(ambienteBruto?: string): AmbienteOperacional {
  return ambienteBruto?.trim().toLowerCase() === 'producao' ? 'producao' : 'local';
}

function resolverFlagBooleana(valorBruto: string | undefined, padrao: boolean): boolean {
  const valorNormalizado = valorBruto?.trim().toLowerCase();

  if (valorNormalizado === 'true') {
    return true;
  }

  if (valorNormalizado === 'false') {
    return false;
  }

  return padrao;
}

export function obterAmbienteOperacionalCliente(): AmbienteOperacional {
  return normalizarAmbiente(import.meta.env.VITE_APP_ENV);
}

export function resolverUsoLocalStorage(): boolean {
  return resolverFlagBooleana(import.meta.env.VITE_USAR_LOCALSTORAGE, true);
}

export function resolverUsoBancoPostgres(): boolean {
  const padrao = obterAmbienteOperacionalCliente() === 'local';
  return resolverFlagBooleana(import.meta.env.VITE_USAR_BANCO_POSTGRES, padrao);
}
