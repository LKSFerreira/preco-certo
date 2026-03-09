export type AmbienteOperacional = 'local' | 'producao';

export function normalizarAmbiente(
  ambienteBruto?: string | null,
  ambientePadrao: AmbienteOperacional = 'local'
): AmbienteOperacional {
  const ambienteNormalizado = ambienteBruto?.trim().toLowerCase();

  if (ambienteNormalizado === 'local' || ambienteNormalizado === 'producao') {
    return ambienteNormalizado;
  }

  return ambientePadrao;
}

export function resolverFlagBooleana(valorBruto: string | undefined, padrao: boolean): boolean {
  const valorNormalizado = valorBruto?.trim().toLowerCase();

  if (valorNormalizado === 'true') {
    return true;
  }

  if (valorNormalizado === 'false') {
    return false;
  }

  return padrao;
}
