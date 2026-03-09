export type AmbienteOperacional = 'local' | 'producao';

function normalizarAmbiente(ambienteBruto?: string | null): AmbienteOperacional | null {
    if (!ambienteBruto) {
        return null;
    }

    const ambienteNormalizado = ambienteBruto.trim().toLowerCase();

    if (ambienteNormalizado === 'local' || ambienteNormalizado === 'producao') {
        return ambienteNormalizado;
    }

    return null;
}

export function obterAmbienteOperacionalServidor(): AmbienteOperacional {
    const ambienteExplicito = normalizarAmbiente(process.env.APP_ENV);

    if (ambienteExplicito) {
        return ambienteExplicito;
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
