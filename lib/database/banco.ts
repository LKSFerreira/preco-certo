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

    const configuracao: any = {
        connectionString: databaseUrl,
        // Serverless: limita conexões para não esgotar o pool do banco
        max: 5,
        // Fecha conexões ociosas após 30 segundos
        idleTimeoutMillis: 30000,
        // Timeout de 10 segundos para estabelecer conexão
        connectionTimeoutMillis: 10000,
    };

    // Supabase e outros provedores de nuvem exigem SSL para conexões externas
    // Ativamos apenas se não for ambiente local ou se a URL exigir explicitamente
    if (ambiente === 'producao' || databaseUrl.includes('supabase.com') || databaseUrl.includes('pooler.supabase.com')) {
        configuracao.ssl = {
            rejectUnauthorized: false, // Necessário para certificados auto-assinados de poolers
        };
    }

    return new Pool(configuracao);
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
