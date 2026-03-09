import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAMINHO_PADRAO_ENTRADA = path.resolve(__dirname, '../../database/data/produtos_higienizados.json');
const CAMINHO_PADRAO_SAIDA = path.resolve(
  __dirname,
  '../../database/data/produtos_higienizados_final.json'
);

const TERMOS_GENERICOS = new Set([
  'produto sem nome',
  'marca desconhecida',
  'sem marca',
  'sem tamanho',
  'generico',
  'genérico',
  'tamanho desconhecido',
  'nao informado',
  'não informado'
]);

interface ProdutoCatalogo {
  descricao?: string | null;
  marca?: string | null;
  tamanho?: string | null;
  [chave: string]: unknown;
}

function obterValorArgumento(nomeArgumento: string): string | undefined {
  const indiceArgumento = process.argv.findIndex((argumentoAtual) => argumentoAtual === nomeArgumento);
  return indiceArgumento === -1 ? undefined : process.argv[indiceArgumento + 1];
}

function limparStringGenerica(valorAtual: unknown): string | null | unknown {
  if (typeof valorAtual !== 'string') {
    return valorAtual;
  }

  return TERMOS_GENERICOS.has(valorAtual.trim().toLowerCase()) ? null : valorAtual;
}

export async function removerStringsGenericas(): Promise<void> {
  const caminhoEntrada = path.resolve(obterValorArgumento('--input') || CAMINHO_PADRAO_ENTRADA);
  const caminhoSaida = path.resolve(obterValorArgumento('--output') || CAMINHO_PADRAO_SAIDA);
  const produtos = JSON.parse(await readFile(caminhoEntrada, 'utf8')) as ProdutoCatalogo[];

  let contadorAlteracoes = 0;

  for (const produtoAtual of produtos) {
    let alterou = false;

    for (const campoAtual of ['descricao', 'marca', 'tamanho'] as const) {
      const valorAnterior = produtoAtual[campoAtual];
      const valorNovo = limparStringGenerica(valorAnterior);

      if (valorAnterior !== valorNovo) {
        produtoAtual[campoAtual] = valorNovo as string | null | undefined;
        alterou = true;
      }
    }

    if (alterou) {
      contadorAlteracoes += 1;
    }
  }

  await writeFile(caminhoSaida, `${JSON.stringify(produtos, null, 2)}\n`, 'utf8');
  console.info(`✅ Sucesso! ${contadorAlteracoes} produtos tiveram strings genéricas substituídas por null.`);
  console.info(`📁 Novo arquivo gerado: ${caminhoSaida}`);
}

if (process.argv[1] === __filename) {
  removerStringsGenericas().catch((erro) => {
    console.error('❌ Erro ao remover strings genéricas:', erro);
    process.exit(1);
  });
}
