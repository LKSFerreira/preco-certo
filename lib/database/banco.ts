import { Pool } from 'pg';
import { obterAmbienteOperacionalServidor, obterDatabaseUrlConfigurada } from '../../infra/ambiente/server.js';

/**
 * Pool de conexões PostgreSQL para os endpoints serverless.
 *
 * O pool é inicializado sob demanda para não derrubar o servidor local
 * inteiro quando o banco remoto ainda não estiver ativo no ambiente.
 */
let poolCompartilhado: Pool | null = null;

function criarPool(): Pool {
    const databaseUrl = obterDatabaseUrlConfigurada();
    const ambiente = obterAmbienteOperacionalServidor();

    if (!databaseUrl) {
        throw new Error(
            `[Banco] DATABASE_URL não definida para /data=${ambiente}. ` +
            'Mantenha o fluxo PostgreSQL desativado neste ambiente até o cutover.'
        );
    }

    return new Pool({
        connectionString: databaseUrl,

        // Serverless: limita conexões para não esgotar o pool do banco
        max: 5,

        // Fecha conexões ociosas após 30 segundos
        idleTimeoutMillis: 30000,

        // Timeout de 10 segundos para estabelecer conexão
        connectionTimeoutMillis: 10000,
    });
}

function obterPool(): Pool {
    if (!poolCompartilhado) {
        poolCompartilhado = criarPool();
    }

    return poolCompartilhado;
}

const pool = new Proxy({} as Pool, {
    get(_, propriedade) {
        const instancia = obterPool();
        const valor = Reflect.get(instancia, propriedade);

        if (typeof valor === 'function') {
            return valor.bind(instancia);
        }

        return valor;
    },
});

export default pool;
