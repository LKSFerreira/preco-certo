import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PoolClient } from 'pg';
import { criarPoolDatabase, encerrarPoolDatabase } from './_comum';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAMINHO_DATASET = path.resolve(__dirname, '../../database/data/produtos_higienizados.json');
const TAMANHO_LOTE = 1000;

interface ProdutoCatalogoInicial {
  codigo_barras: string;
  descricao: string;
  marca?: string | null;
  tamanho?: string | null;
  imagem?: string | null;
  preco_estimado?: number | null;
}

interface ResumoCargaInicial {
  registrosLidos: number;
  registrosInseridos: number;
  lotesProcessados: number;
}

function normalizarProduto(produtoBruto: ProdutoCatalogoInicial) {
  return {
    codigoBarras: produtoBruto.codigo_barras,
    descricao: produtoBruto.descricao,
    marca: (produtoBruto.marca || 'Genérica').slice(0, 50),
    tamanho: (produtoBruto.tamanho || 'Unidade').slice(0, 50),
    imagem: produtoBruto.imagem ?? null,
    precoEstimado: produtoBruto.preco_estimado ?? 0
  };
}

function quebrarEmLotes<TipoRegistro>(registros: TipoRegistro[], tamanhoLote: number): TipoRegistro[][] {
  const lotes: TipoRegistro[][] = [];

  for (let indiceAtual = 0; indiceAtual < registros.length; indiceAtual += tamanhoLote) {
    lotes.push(registros.slice(indiceAtual, indiceAtual + tamanhoLote));
  }

  return lotes;
}

function montarInsertLote(quantidadeRegistros: number): string {
  const colunasPorRegistro = 6;
  const placeholders = Array.from({ length: quantidadeRegistros }, (_, indiceRegistro) => {
    const deslocamentoBase = indiceRegistro * colunasPorRegistro;

    return `($${deslocamentoBase + 1}, $${deslocamentoBase + 2}, $${deslocamentoBase + 3}, $${deslocamentoBase + 4}, $${deslocamentoBase + 5}, $${deslocamentoBase + 6})`;
  });

  return `
    INSERT INTO produtos (codigo_barras, descricao, marca, tamanho, imagem, preco_estimado)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (codigo_barras) DO NOTHING
  `;
}

async function configurarContextoSessao(cliente: PoolClient): Promise<void> {
  await cliente.query("SET LOCAL app.current_user_token = '00000000-0000-0000-0000-000000000000'");
  await cliente.query("SET LOCAL app.client_ip = 'localhost'");
}

async function inserirLote(cliente: PoolClient, lote: ReturnType<typeof normalizarProduto>[]): Promise<number> {
  const valores = lote.flatMap((produto) => [
    produto.codigoBarras,
    produto.descricao,
    produto.marca,
    produto.tamanho,
    produto.imagem,
    produto.precoEstimado
  ]);

  const resultado = await cliente.query(montarInsertLote(lote.length), valores);
  return resultado.rowCount ?? 0;
}

export async function carregarCatalogoInicial(): Promise<ResumoCargaInicial> {
  const pool = criarPoolDatabase();
  const cliente = await pool.connect();

  try {
    console.info('📦 Iniciando carga inicial do catálogo...');

    const datasetBruto = await readFile(CAMINHO_DATASET, 'utf-8');
    const produtosBrutos = JSON.parse(datasetBruto) as ProdutoCatalogoInicial[];

    if (produtosBrutos.length === 0) {
      console.info('ℹ️  Dataset vazio. Nada para importar.');
      return {
        registrosLidos: 0,
        registrosInseridos: 0,
        lotesProcessados: 0
      };
    }

    const produtosNormalizados = produtosBrutos.map(normalizarProduto);
    const lotes = quebrarEmLotes(produtosNormalizados, TAMANHO_LOTE);

    let registrosInseridos = 0;

    await cliente.query('BEGIN');
    await configurarContextoSessao(cliente);

    for (const [indiceLote, lote] of lotes.entries()) {
      const registrosInseridosNoLote = await inserirLote(cliente, lote);
      registrosInseridos += registrosInseridosNoLote;
      console.info(
        `  📚 Lote ${indiceLote + 1}/${lotes.length} processado. Inseridos no lote: ${registrosInseridosNoLote}`
      );
    }

    await cliente.query('COMMIT');

    console.info(
      `✅ Carga inicial concluída. Lidos: ${produtosNormalizados.length}, Inseridos: ${registrosInseridos}, Lotes: ${lotes.length}`
    );

    return {
      registrosLidos: produtosNormalizados.length,
      registrosInseridos,
      lotesProcessados: lotes.length
    };
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw new Error('Falha na carga inicial do catálogo', { cause: erro });
  } finally {
    cliente.release();
    await encerrarPoolDatabase(pool);
  }
}

async function main(): Promise<void> {
  await carregarCatalogoInicial();
}

if (process.argv[1] === __filename) {
  main().catch((erro) => {
    console.error('❌ Erro ao carregar catálogo inicial:', erro);
    process.exit(1);
  });
}
