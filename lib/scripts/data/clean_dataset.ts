import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAMINHO_PADRAO_CSV = path.resolve(__dirname, '../../../produtos_brasil_v1.csv');
const CAMINHO_PADRAO_JSON = path.resolve(__dirname, '../../database/data/produtos_higienizados.json');
const REGEX_UNIDADES = /(?<valor>\d+(?:[.,]\d+)?)\s*(?<unidade>[a-zA-Z.]+)/;

const MAPA_UNIDADES: Record<string, string> = {
  l: 'L',
  lt: 'L',
  lts: 'L',
  litro: 'L',
  litros: 'L',
  ml: 'ml',
  'm.l': 'ml',
  mils: 'ml',
  k: 'kg',
  kg: 'kg',
  'k.g': 'kg',
  kilo: 'kg',
  quilo: 'kg',
  kilograma: 'kg',
  quilograma: 'kg',
  kgs: 'kg',
  g: 'g',
  gr: 'g',
  grs: 'g',
  grama: 'g',
  gramas: 'g',
  mg: 'mg',
  mgs: 'mg',
  miligrama: 'mg',
  miligramas: 'mg',
  u: 'un',
  un: 'un',
  und: 'un',
  uni: 'un',
  unid: 'un',
  unidade: 'un',
  unidades: 'un',
  unis: 'un',
  'pç': 'un',
  pca: 'un',
  peca: 'un',
  dz: 'dz',
  duzia: 'dz',
  dúzia: 'dz',
  cx: 'cx',
  cxa: 'cx',
  caixa: 'cx',
  caixas: 'cx',
  box: 'cx',
  pct: 'pct',
  pcte: 'pct',
  pacote: 'pct',
  pacotes: 'pct',
  pc: 'pct',
  pack: 'pct',
  fd: 'fd',
  fdo: 'fd',
  fardo: 'fd',
  lata: 'lata',
  latas: 'lata',
  gf: 'gf',
  gfa: 'gf',
  garrafa: 'gf',
  garrafas: 'gf',
  m: 'm',
  mt: 'm',
  mts: 'm',
  metro: 'm',
  metros: 'm',
  cm: 'cm',
  cms: 'cm',
  centimetro: 'cm',
  mm: 'mm',
  mms: 'mm'
};

interface ProdutoHigienizado {
  codigo_barras: string;
  descricao: string;
  marca: string;
  tamanho: string;
  imagem: string | null;
  preco_estimado: number;
}

function obterValorArgumento(nomeArgumento: string): string | undefined {
  const indiceArgumento = process.argv.findIndex((argumentoAtual) => argumentoAtual === nomeArgumento);
  return indiceArgumento === -1 ? undefined : process.argv[indiceArgumento + 1];
}

function deserializarLinhaCsv(linhaAtual: string): string | null {
  if (!linhaAtual || linhaAtual === 'raw_data') {
    return null;
  }

  if (!linhaAtual.startsWith('"') || !linhaAtual.endsWith('"')) {
    return linhaAtual;
  }

  return linhaAtual.slice(1, -1).replace(/""/g, '"');
}

function normalizarUnidade(valorBruto: string, unidadeBruta: string): string {
  const valorNormalizado = valorBruto.replace(',', '.');
  const unidadeNormalizada = unidadeBruta.toLowerCase().trim().replace(/\.$/, '');
  const unidadeFinal = MAPA_UNIDADES[unidadeNormalizada] || unidadeNormalizada;
  const numero = Number.parseFloat(valorNormalizado);
  const valorFinal = Number.isInteger(numero) ? String(numero) : valorNormalizado;
  return `${valorFinal}${unidadeFinal}`;
}

function extrairTamanho(produtoBruto: Record<string, unknown>): string {
  const candidatos = [
    typeof produtoBruto.quantity === 'string' ? produtoBruto.quantity : '',
    `${produtoBruto.product_quantity ?? ''}${produtoBruto.product_quantity_unit ?? ''}`
  ];

  for (const candidatoAtual of candidatos) {
    if (!candidatoAtual) {
      continue;
    }

    const match = REGEX_UNIDADES.exec(String(candidatoAtual));

    if (match?.groups?.valor && match.groups.unidade) {
      return normalizarUnidade(match.groups.valor, match.groups.unidade);
    }
  }

  return 'Sem Tamanho';
}

function extrairDescricao(produtoBruto: Record<string, unknown>, tamanhoExtraido: string): string | null {
  const nomeBruto =
    produtoBruto.product_name_pt || produtoBruto.product_name || produtoBruto.product_name_en;

  if (typeof nomeBruto !== 'string' || !nomeBruto.trim()) {
    return null;
  }

  let nomeNormalizado = nomeBruto.toLowerCase().replace(/\b\w/g, (letraAtual) => letraAtual.toUpperCase()).trim();

  if (['produto sem nome', 'unknown', 'nan'].includes(nomeNormalizado.toLowerCase())) {
    return null;
  }

  if (tamanhoExtraido !== 'Sem Tamanho' && nomeNormalizado.endsWith(` ${tamanhoExtraido}`)) {
    nomeNormalizado = nomeNormalizado.slice(0, -1 * (` ${tamanhoExtraido}`).length).trim();
  }

  return nomeNormalizado;
}

function extrairMarca(produtoBruto: Record<string, unknown>): string {
  const marcaPrincipal = typeof produtoBruto.brands === 'string' ? produtoBruto.brands : '';
  const tagsMarcas = Array.isArray(produtoBruto.brands_tags) ? produtoBruto.brands_tags : [];
  const marcaBruta = marcaPrincipal || (typeof tagsMarcas[0] === 'string' ? tagsMarcas[0] : '');

  if (!marcaBruta) {
    return 'Sem Marca';
  }

  const marcaSemPrefixo = marcaBruta.includes(':') ? marcaBruta.split(':').pop() || marcaBruta : marcaBruta;
  return marcaSemPrefixo
    .toLowerCase()
    .replace(/\b\w/g, (letraAtual) => letraAtual.toUpperCase())
    .trim();
}

function construirUrlImagem(codigoBarras: string, produtoBruto: Record<string, unknown>): string | null {
  const imagens = produtoBruto.images as Record<string, unknown> | undefined;
  const selecionadas = imagens?.selected as Record<string, unknown> | undefined;
  const frente = selecionadas?.front as Record<string, unknown> | undefined;
  const imagemIdioma =
    (frente?.pt as Record<string, unknown> | undefined) ||
    (frente?.en as Record<string, unknown> | undefined) ||
    (frente?.fr as Record<string, unknown> | undefined);

  if (!imagemIdioma || typeof imagemIdioma.rev !== 'string' && typeof imagemIdioma.rev !== 'number') {
    return null;
  }

  const revisao = String(imagemIdioma.rev);
  const idioma = frente?.pt ? 'pt' : frente?.en ? 'en' : 'fr';
  const codigoNormalizado = String(codigoBarras);

  if (codigoNormalizado.length <= 8) {
    return `https://images.openfoodfacts.org/images/products/${codigoNormalizado}/front_${idioma}.${revisao}.400.jpg`;
  }

  const match = /^(\d{3})(\d{3})(\d{3})(\d*)$/.exec(codigoNormalizado);
  const caminhoParticionado = match
    ? match.slice(1).filter(Boolean).join('/')
    : codigoNormalizado;

  return `https://images.openfoodfacts.org/images/products/${caminhoParticionado}/front_${idioma}.${revisao}.400.jpg`;
}

function processarProduto(rawData: string): ProdutoHigienizado | null {
  try {
    const produtoBruto = JSON.parse(rawData) as Record<string, unknown>;
    const codigoBarras = String(produtoBruto.code || produtoBruto._id || produtoBruto.id || '');

    if (!codigoBarras) {
      return null;
    }

    const tamanho = extrairTamanho(produtoBruto);
    const descricao = extrairDescricao(produtoBruto, tamanho);

    if (!descricao) {
      return null;
    }

    return {
      codigo_barras: codigoBarras,
      descricao,
      marca: extrairMarca(produtoBruto),
      tamanho,
      imagem: construirUrlImagem(codigoBarras, produtoBruto),
      preco_estimado: 0
    };
  } catch {
    return null;
  }
}

export async function higienizarDataset(): Promise<void> {
  const caminhoEntrada = path.resolve(obterValorArgumento('--input') || CAMINHO_PADRAO_CSV);
  const caminhoSaida = path.resolve(obterValorArgumento('--output') || CAMINHO_PADRAO_JSON);
  const leitorLinha = createInterface({
    input: createReadStream(caminhoEntrada, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });
  const produtosHigienizados: ProdutoHigienizado[] = [];

  let totalLidos = 0;

  console.info('🚀 Iniciando higienização para JSON...');

  for await (const linhaAtual of leitorLinha) {
    const rawData = deserializarLinhaCsv(linhaAtual);

    if (!rawData) {
      continue;
    }

    totalLidos += 1;
    const produtoProcessado = processarProduto(rawData);

    if (produtoProcessado) {
      produtosHigienizados.push(produtoProcessado);
    }

    if (totalLidos % 5000 === 0) {
      console.info(
        `📊 Lidos: ${totalLidos.toLocaleString('pt-BR')}, Mantidos: ${produtosHigienizados.length.toLocaleString('pt-BR')}...`
      );
    }
  }

  await writeFile(caminhoSaida, `${JSON.stringify(produtosHigienizados, null, 2)}\n`, 'utf8');
  console.info(`💾 Salvando ${produtosHigienizados.length.toLocaleString('pt-BR')} produtos em ${caminhoSaida}...`);
  console.info('✅ Concluído!');
}

if (process.argv[1] === __filename) {
  higienizarDataset().catch((erro) => {
    console.error('❌ Erro ao higienizar dataset:', erro);
    process.exit(1);
  });
}
