import { fileURLToPath } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import { criarPoolDatabase, encerrarPoolDatabase, obterClienteComRetry } from './_comum';

const __filename = fileURLToPath(import.meta.url);
const CHARSET_BASE30 = 'ABCDEFGHJKMNPQRSTUVWXYZ2345678';
const PREFIXO_TOKEN = 'SEM-SUSTO-';
const TAMANHO_CODIGO = 7;

const DURACAO_POR_PLANO = {
  cafe: 15,
  lanche: 30,
  apoiador: 60,
  trial: 7
} as const;

type PlanoToken = keyof typeof DURACAO_POR_PLANO;

interface ArgumentosCli {
  plano: PlanoToken;
  duracaoDias: number;
}

interface ResumoGeracaoToken {
  plano: PlanoToken;
  duracaoDias: number;
  tokenTextoPuro: string;
  tokenHash: string;
}

function gerarNumeroAleatorioSeguro(limiteExclusivo: number): number {
  const bytes = randomBytes(4);
  return bytes.readUInt32BE(0) % limiteExclusivo;
}

function gerarCodigoToken(): string {
  let codigo = '';

  for (let indiceAtual = 0; indiceAtual < TAMANHO_CODIGO; indiceAtual += 1) {
    codigo += CHARSET_BASE30[gerarNumeroAleatorioSeguro(CHARSET_BASE30.length)];
  }

  return `${PREFIXO_TOKEN}${codigo}`;
}

function calcularHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function extrairValorArgumento(nomeArgumento: string): string | undefined {
  const indiceArgumento = process.argv.findIndex((argumentoAtual) => argumentoAtual === nomeArgumento);

  if (indiceArgumento === -1) {
    return undefined;
  }

  return process.argv[indiceArgumento + 1];
}

function lerArgumentosCli(): ArgumentosCli {
  const planoInformado = extrairValorArgumento('--plano');
  const duracaoInformada = extrairValorArgumento('--duracao');
  const plano = (planoInformado as PlanoToken | undefined) || 'trial';

  if (!(plano in DURACAO_POR_PLANO)) {
    throw new Error(
      `Plano inválido: ${planoInformado}. Use um dos valores: ${Object.keys(DURACAO_POR_PLANO).join(', ')}.`
    );
  }

  const duracaoDias =
    duracaoInformada !== undefined ? Number.parseInt(duracaoInformada, 10) : DURACAO_POR_PLANO[plano];

  if (!Number.isInteger(duracaoDias) || duracaoDias <= 0) {
    throw new Error(`Duração inválida: ${duracaoInformada}. Informe um número inteiro positivo.`);
  }

  return { plano, duracaoDias };
}

export async function gerarTokenManual(): Promise<ResumoGeracaoToken> {
  const { plano, duracaoDias } = lerArgumentosCli();
  const tokenTextoPuro = gerarCodigoToken();
  const tokenHash = calcularHash(tokenTextoPuro);
  const pool = criarPoolDatabase();
  const cliente = await obterClienteComRetry(pool);

  try {
    console.info('\n🔑 Gerando token...');
    console.info(`   Plano: ${plano}`);
    console.info(`   Duração: ${duracaoDias} dias`);
    console.info(`   Token: ${tokenTextoPuro}`);
    console.info(`   Hash: ${tokenHash.slice(0, 16)}...`);

    await cliente.query(
      `
        INSERT INTO tokens (token_hash, plano, duracao_dias)
        VALUES ($1, $2, $3)
      `,
      [tokenHash, plano, duracaoDias]
    );

    console.info('\n✅ Token inserido no banco com sucesso!');
    console.info('📋 Para ativar, use:');
    console.info(`   https://semsusto.app/ativar/${tokenTextoPuro}`);

    return {
      plano,
      duracaoDias,
      tokenTextoPuro,
      tokenHash
    };
  } finally {
    cliente.release();
    await encerrarPoolDatabase(pool);
  }
}

async function main(): Promise<void> {
  await gerarTokenManual();
}

if (process.argv[1] === __filename) {
  main().catch((erro) => {
    console.error('\n❌ Erro ao gerar token manual:', erro);
    process.exit(1);
  });
}
