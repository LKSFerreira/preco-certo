import { createGunzip } from 'node:zlib';
import { createReadStream, createWriteStream, existsSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAMINHO_PADRAO_ENTRADA = path.resolve(__dirname, '../../../openfoodfacts-products.jsonl.gz');
const CAMINHO_PADRAO_SAIDA = path.resolve(__dirname, '../../../produtos_brasil_v1.csv');
const REGEX_BRASIL = /brazil|brasil/i;

interface ConfiguracaoCli {
  caminhoEntrada: string;
  caminhoSaida: string;
}

function obterValorArgumento(nomeArgumento: string): string | undefined {
  const indiceArgumento = process.argv.findIndex((argumentoAtual) => argumentoAtual === nomeArgumento);
  return indiceArgumento === -1 ? undefined : process.argv[indiceArgumento + 1];
}

function lerConfiguracaoCli(): ConfiguracaoCli {
  return {
    caminhoEntrada: path.resolve(obterValorArgumento('--input') || CAMINHO_PADRAO_ENTRADA),
    caminhoSaida: path.resolve(obterValorArgumento('--output') || CAMINHO_PADRAO_SAIDA)
  };
}

function formatarBytes(quantidadeBytes: number): string {
  const unidades = ['B', 'KB', 'MB', 'GB'];
  let valorAtual = quantidadeBytes;
  let indiceUnidade = 0;

  while (valorAtual >= 1024 && indiceUnidade < unidades.length - 1) {
    valorAtual /= 1024;
    indiceUnidade += 1;
  }

  return `${valorAtual.toFixed(1)} ${unidades[indiceUnidade]}`;
}

function serializarLinhaCsv(rawData: string): string {
  return `"${rawData.replace(/"/g, '""')}"\n`;
}

function produtoEhDoBrasil(produto: Record<string, unknown>): boolean {
  const tagsBrutas = produto.countries_tags;

  if (!Array.isArray(tagsBrutas)) {
    return false;
  }

  return tagsBrutas.some((tagAtual) => typeof tagAtual === 'string' && REGEX_BRASIL.test(tagAtual));
}

export async function filtrarBaseDadoParaBrasil(): Promise<void> {
  const { caminhoEntrada, caminhoSaida } = lerConfiguracaoCli();

  if (!existsSync(caminhoEntrada)) {
    throw new Error(`Arquivo de entrada não encontrado: ${caminhoEntrada}`);
  }

  const tamanhoArquivo = statSync(caminhoEntrada).size;
  const streamLeitura = createReadStream(caminhoEntrada);
  const streamDescompactado = streamLeitura.pipe(createGunzip());
  const leitorLinha = createInterface({ input: streamDescompactado, crlfDelay: Infinity });
  const streamEscrita = createWriteStream(caminhoSaida, { encoding: 'utf8' });
  const inicioExecucao = Date.now();

  let totalLidos = 0;
  let totalSalvos = 0;
  let bytesProcessados = 0;

  streamEscrita.write('raw_data\n');

  console.info(`📁 Arquivo: ${caminhoEntrada} (${formatarBytes(tamanhoArquivo)})`);
  console.info(`🎯 Destino: ${caminhoSaida}\n`);

  for await (const linhaAtual of leitorLinha) {
    totalLidos += 1;
    bytesProcessados += Buffer.byteLength(linhaAtual, 'utf8');

    if (!REGEX_BRASIL.test(linhaAtual)) {
      continue;
    }

    try {
      const registroBruto = JSON.parse(linhaAtual) as Record<string, unknown>;
      const produto = (registroBruto.product || registroBruto) as Record<string, unknown>;

      if (!produtoEhDoBrasil(produto)) {
        continue;
      }

      streamEscrita.write(serializarLinhaCsv(JSON.stringify(produto)));
      totalSalvos += 1;
    } catch {
      continue;
    }

    if (totalLidos % 5000 === 0) {
      const tempoDecorridoSegundos = Math.max(1, Math.floor((Date.now() - inicioExecucao) / 1000));
      console.info(
        `📊 Lidos: ${totalLidos.toLocaleString('pt-BR')} | BR: ${totalSalvos.toLocaleString('pt-BR')} | ${Math.round(bytesProcessados / tempoDecorridoSegundos).toLocaleString('pt-BR')} B/s`
      );
    }
  }

  streamEscrita.end();

  await new Promise<void>((resolve, reject) => {
    streamEscrita.on('finish', () => resolve());
    streamEscrita.on('error', (erro) => reject(erro));
  });

  const tempoTotalSegundos = Math.max(1, Math.floor((Date.now() - inicioExecucao) / 1000));

  console.info('\n✅ Processamento concluído.');
  console.info(`   📊 Total de linhas lidas: ${totalLidos.toLocaleString('pt-BR')}`);
  console.info(`   🇧🇷 Produtos brasileiros: ${totalSalvos.toLocaleString('pt-BR')}`);
  console.info(`   ⏱️ Tempo total: ${tempoTotalSegundos}s`);
  console.info(`   💾 Arquivo gerado: ${caminhoSaida}`);
}

if (process.argv[1] === __filename) {
  filtrarBaseDadoParaBrasil().catch((erro) => {
    console.error('❌ Erro ao filtrar base do Open Food Facts:', erro);
    process.exit(1);
  });
}
