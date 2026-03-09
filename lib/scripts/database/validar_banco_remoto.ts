import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PoolClient } from 'pg';
import { criarPoolDatabase, encerrarPoolDatabase } from './_comum';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIRETORIO_MIGRATIONS = path.resolve(__dirname, '../../database/migrations');
const CAMINHO_DATASET = path.resolve(__dirname, '../../database/data/produtos_higienizados.json');

const TABELAS_OBRIGATORIAS = [
  'schema_migrations',
  'produtos',
  'tokens',
  'produtos_adicionados_pelo_usuario'
] as const;

interface ProdutoCatalogoInicial {
  codigo_barras: string;
}

interface ResumoValidacao {
  migrationsEsperadas: number;
  migrationsAplicadas: number;
  totalProdutosEsperado: number;
  totalProdutosNoBanco: number;
  gtinValidado: string;
  escritaControladaValidada: boolean;
}

async function contarArquivosMigrations(): Promise<number> {
  const entradas = await readdir(DIRETORIO_MIGRATIONS, { withFileTypes: true });

  return entradas.filter((entrada) => entrada.isFile() && entrada.name.endsWith('.sql')).length;
}

async function contarRegistrosDataset(): Promise<number> {
  const datasetBruto = await readFile(CAMINHO_DATASET, 'utf-8');
  const produtos = JSON.parse(datasetBruto) as ProdutoCatalogoInicial[];
  return produtos.length;
}

async function obterContagemMigrations(cliente: PoolClient): Promise<number> {
  const resultado = await cliente.query<{ total: string }>('SELECT COUNT(*) AS total FROM schema_migrations');
  return Number(resultado.rows[0]?.total ?? 0);
}

async function validarTabelasObrigatorias(cliente: PoolClient): Promise<void> {
  for (const nomeTabela of TABELAS_OBRIGATORIAS) {
    const resultado = await cliente.query<{ existe: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = $1
        ) AS existe
      `,
      [nomeTabela]
    );

    if (!resultado.rows[0] || resultado.rows[0].existe !== true) {
      throw new Error(`Tabela obrigatória ausente: ${nomeTabela}`);
    }
  }
}

async function obterContagemProdutos(cliente: PoolClient): Promise<number> {
  const resultado = await cliente.query<{ total: string }>('SELECT COUNT(*) AS total FROM produtos');
  return Number(resultado.rows[0]?.total ?? 0);
}

async function obterGtinConhecido(cliente: PoolClient): Promise<string> {
  const resultado = await cliente.query<{ codigo_barras: string }>(
    'SELECT codigo_barras FROM produtos ORDER BY codigo_barras LIMIT 1'
  );

  const gtin = resultado.rows[0]?.codigo_barras;

  if (!gtin) {
    throw new Error('Nenhum GTIN conhecido encontrado na tabela produtos.');
  }

  return gtin;
}

async function validarLeituraPorGtin(cliente: PoolClient, gtin: string): Promise<void> {
  const resultado = await cliente.query<{ codigo_barras: string }>(
    'SELECT codigo_barras FROM produtos WHERE codigo_barras = $1',
    [gtin]
  );

  if (resultado.rowCount !== 1) {
    throw new Error(`Falha na leitura do GTIN conhecido: ${gtin}`);
  }
}

async function validarEscritaControlada(cliente: PoolClient): Promise<void> {
  const codigoBarrasValidacao = `VALIDACAO-${Date.now()}`;

  await cliente.query('BEGIN');

  try {
    await cliente.query("SET LOCAL app.current_user_token = '00000000-0000-0000-0000-000000000000'");
    await cliente.query("SET LOCAL app.client_ip = 'validacao-remota'");

    const resultado = await cliente.query(
      `
        INSERT INTO produtos_adicionados_pelo_usuario (
          codigo_barras,
          descricao,
          marca,
          tamanho,
          preco_informado,
          imagem,
          origem,
          status_curadoria,
          usuario_id,
          ip_hash
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        codigoBarrasValidacao,
        'Produto de validação operacional',
        'Sem Susto',
        'Unidade',
        0,
        null,
        'validacao_remota_cli',
        'pendente',
        'validacao_cli',
        'validacao_ip_hash'
      ]
    );

    if (resultado.rowCount !== 1) {
      throw new Error('A escrita controlada não retornou confirmação de inserção.');
    }
  } finally {
    await cliente.query('ROLLBACK');
  }
}

export async function validarBancoRemoto(): Promise<ResumoValidacao> {
  const pool = criarPoolDatabase();
  const cliente = await pool.connect();

  try {
    console.info('🔎 Iniciando validação operacional do banco...');

    const migrationsEsperadas = await contarArquivosMigrations();
    const totalProdutosEsperado = await contarRegistrosDataset();

    await validarTabelasObrigatorias(cliente);
    console.info('✅ Tabelas obrigatórias encontradas.');

    const migrationsAplicadas = await obterContagemMigrations(cliente);

    if (migrationsAplicadas !== migrationsEsperadas) {
      throw new Error(
        `Contagem de migrations divergente. Esperadas: ${migrationsEsperadas}, Aplicadas: ${migrationsAplicadas}`
      );
    }

    console.info(`✅ Schema validado. Migrations aplicadas: ${migrationsAplicadas}.`);

    const totalProdutosNoBanco = await obterContagemProdutos(cliente);

    if (totalProdutosNoBanco < totalProdutosEsperado) {
      throw new Error(
        `Catálogo incompleto. Esperado >= ${totalProdutosEsperado}, encontrado: ${totalProdutosNoBanco}`
      );
    }

    console.info(`✅ Volume do catálogo validado. Produtos no banco: ${totalProdutosNoBanco}.`);

    const gtinValidado = await obterGtinConhecido(cliente);
    await validarLeituraPorGtin(cliente, gtinValidado);
    console.info(`✅ Leitura por GTIN validada com ${gtinValidado}.`);

    await validarEscritaControlada(cliente);
    console.info('✅ Escrita controlada validada com rollback.');

    return {
      migrationsEsperadas,
      migrationsAplicadas,
      totalProdutosEsperado,
      totalProdutosNoBanco,
      gtinValidado,
      escritaControladaValidada: true
    };
  } finally {
    cliente.release();
    await encerrarPoolDatabase(pool);
  }
}

async function main(): Promise<void> {
  const resumo = await validarBancoRemoto();

  console.info(
    `🎯 Validação concluída. GTIN: ${resumo.gtinValidado}, Migrations: ${resumo.migrationsAplicadas}/${resumo.migrationsEsperadas}, Produtos: ${resumo.totalProdutosNoBanco}.`
  );
}

if (process.argv[1] === __filename) {
  main().catch((erro) => {
    console.error('❌ Erro na validação do banco:', erro);
    process.exit(1);
  });
}
