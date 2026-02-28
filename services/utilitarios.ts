/**
 * Formata um nÃºmero para moeda BRL
 */
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

/**
 * Formata texto para Title Case (Primeira Letra MaiÃºscula), ignorando preposiÃ§Ãµes.
 * Ex: "LEITE EM PÃ“ INTEGRAL" -> "Leite em PÃ³ Integral"
 */
export const formatarTitulo = (texto: string): string => {
  if (!texto) return '';
  const conectivos = [
    'de', 'da', 'do', 'dos', 'das', 'com', 'e', 'em', 'para', 'por', 'sem',
    'a', 'o', 'as', 'os', 'um', 'uns', 'uma', 'umas',
    'no', 'na', 'nos', 'nas', 'pelo', 'pela', 'pelos', 'pelas',
    'atÃ©', 'sob', 'sobre', 'ante', 'apÃ³s', 'desde', 'entre'
  ];

  return texto
    .toLowerCase()
    .split(' ')
    .map((palavra, index) => {
      if (index > 0 && conectivos.includes(palavra)) return palavra;
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
};

// --- Canvas Utils para Recorte ---
const criarImagem = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.addEventListener('load', () => resolve(imagem));
    imagem.addEventListener('error', (error) => reject(error));
    imagem.setAttribute('crossOrigin', 'anonymous');
    imagem.src = url;
  });

export async function obterImagemRecortada(imagemSrc: string, pixelCrop: any): Promise<string> {
  const imagem = await criarImagem(imagemSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    imagem,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Simula a biblioteca 'browser-image-compression' usando Canvas nativo.
 * Isso permite reduzir o tamanho da imagem antes de salvar no LocalStorage
 * para nÃ£o estourar a cota de armazenamento do navegador.
 */
export const comprimirImagem = async (arquivo: File, qualidade: number = 0.7, larguraMax: number = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.readAsDataURL(arquivo);
    leitor.onload = (evento) => {
      const img = new Image();
      img.src = evento.target?.result as string;
      img.onload = () => {
        const elementoCanvas = document.createElement('canvas');
        const proporcao = larguraMax / img.width;

        // Se a imagem for menor que o mÃ¡ximo, mantÃ©m o tamanho
        const novaLargura = img.width > larguraMax ? larguraMax : img.width;
        const novaAltura = img.width > larguraMax ? img.height * proporcao : img.height;

        elementoCanvas.width = novaLargura;
        elementoCanvas.height = novaAltura;

        const ctx = elementoCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, novaLargura, novaAltura);
          // Retorna a imagem comprimida em Base64 (JPEG)
          resolve(elementoCanvas.toDataURL('image/jpeg', qualidade));
        } else {
          reject(new Error('Falha ao obter contexto do Canvas'));
        }
      };
      img.onerror = (erro) => reject(erro);
    };
    leitor.onerror = (erro) => reject(erro);
  });
};

/**
 * Comprime uma imagem em formato Base64 para reduzir tamanho antes de salvar no banco.
 * Usa Canvas nativo para redimensionar e recodificar com menor qualidade.
 *
 * **Exemplo:**
 *
 * .. code-block:: typescript
 *
 *     const base64Original = canvas.toDataURL('image/jpeg', 0.9);
 *     const base64Comprimido = await comprimirImagemBase64(base64Original);
 *     console.log('Antes:', base64Original.length, 'Depois:', base64Comprimido.length);
 *
 * :param base64: String base64 da imagem (com prefixo data:image/...)
 * :param qualidade: Qualidade JPEG de 0 a 1 (default: 0.7)
 * :param larguraMaxima: Largura mÃ¡xima em pixels (default: 400)
 * :returns: String base64 comprimida
 */
export const comprimirImagemBase64 = async (
  base64: string,
  qualidade: number = 0.7,
  larguraMaxima: number = 400
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.src = base64;

    imagem.onload = () => {
      const canvas = document.createElement('canvas');

      // Calcula nova dimensÃ£o mantendo proporÃ§Ã£o
      const proporcao = larguraMaxima / imagem.width;
      const novaLargura = imagem.width > larguraMaxima ? larguraMaxima : imagem.width;
      const novaAltura = imagem.width > larguraMaxima ? imagem.height * proporcao : imagem.height;

      canvas.width = novaLargura;
      canvas.height = novaAltura;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imagem, 0, 0, novaLargura, novaAltura);

        // Retorna base64 comprimido em JPEG
        const resultado = canvas.toDataURL('image/jpeg', qualidade);

        // Log para debug (Ãºtil durante desenvolvimento)
        const tamanhoOriginal = Math.round(base64.length / 1024);
        const tamanhoFinal = Math.round(resultado.length / 1024);
        console.log(`ðŸ“· CompressÃ£o: ${tamanhoOriginal}KB â†’ ${tamanhoFinal}KB (${Math.round((1 - tamanhoFinal / tamanhoOriginal) * 100)}% reduÃ§Ã£o)`);

        resolve(resultado);
      } else {
        reject(new Error('Falha ao obter contexto do Canvas'));
      }
    };

    imagem.onerror = (erro) => reject(erro);
  });
};

// Mapa de normalizaÃ§Ã£o de unidades â€” FONTE ÃšNICA DE VERDADE
// A REGEX_UNIDADE em constants.ts Ã© derivada automaticamente das chaves deste mapa.
// Ao adicionar uma nova unidade aqui, a validaÃ§Ã£o do formulÃ¡rio a aceita automaticamente.
export const UNIT_MAP: Record<string, string> = {
  // --- VOLUME ---
  // Litros (L maiÃºsculo por padrÃ£o SI)
  'l': 'L', 'lt': 'L', 'lts': 'L', 'litro': 'L', 'litros': 'L',
  'L': 'L', 'LT': 'L', 'LTS': 'L',
  // Mililitros
  'ml': 'mL', 'mL': 'mL', 'ML': 'mL', 'm.l': 'mL', 'mils': 'mL',

  // --- MASSA / PESO ---
  // Quilogramas
  'k': 'kg', 'kg': 'kg', 'k.g': 'kg', 'quilo': 'kg', 'kilo': 'kg',
  'kilograma': 'kg', 'quilograma': 'kg', 'kg.': 'kg', 'kgs': 'kg',
  'KG': 'kg',
  // Gramas
  'g': 'g', 'gr': 'g', 'grs': 'g', 'grama': 'g', 'gramas': 'g', 'g.': 'g',
  'G': 'g', 'GR': 'g',
  // Miligramas (comum em farmÃ¡cia/suplementos)
  'mg': 'mg', 'mgs': 'mg', 'miligrama': 'mg', 'miligramas': 'mg',

  // --- UNIDADES / CONTAGEM ---
  // Unidade (pt-BR + en)
  'u': 'uni', 'un': 'uni', 'und': 'uni', 'uni': 'uni', 'unid': 'uni',
  'unidade': 'uni', 'unidades': 'uni', 'unis': 'uni',
  'U': 'uni', 'UN': 'uni',
  // PeÃ§as â€” variaÃ§Ãµes pt-BR (pÃºblico-alvo principal)
  'pÃ§': 'pÃ§', 'pÃ§a': 'pÃ§', 'pÃ§as': 'pÃ§', 'pÃ§s': 'pÃ§',
  'pca': 'pÃ§', 'peca': 'pÃ§', 'peÃ§a': 'pÃ§', 'peÃ§as': 'pÃ§', 'pecas': 'pÃ§',
  // PeÃ§as â€” variaÃ§Ãµes en (APIs externas como Cosmos retornam "PCS")
  'pcs': 'pÃ§', 'pc': 'pÃ§', 'piece': 'pÃ§', 'pieces': 'pÃ§',
  // DÃºzia
  'dz': 'dz', 'duzia': 'dz', 'dÃºzia': 'dz',

  // --- EMBALAGENS ---
  // Caixa
  'cx': 'cx', 'cxa': 'cx', 'caixa': 'cx', 'caixas': 'cx', 'box': 'cx',
  // Pacote
  'pct': 'pct', 'pac': 'pct', 'pcte': 'pct', 'pacote': 'pct', 'pacotes': 'pct', 'pack': 'pct',
  // Fardo
  'fd': 'fd', 'fdo': 'fd', 'fardo': 'fd',
  // Lata
  'lata': 'lata', 'latas': 'lata',
  // Garrafa
  'gf': 'gf', 'gfa': 'gf', 'garrafa': 'gf', 'garrafas': 'gf',

  // --- COMPRIMENTO (Papelaria, Higiene) ---
  // Metros
  'm': 'm', 'mt': 'm', 'mts': 'm', 'metro': 'm', 'metros': 'm',
  // CentÃ­metros
  'cm': 'cm', 'cms': 'cm', 'centimetro': 'cm',
  // MilÃ­metros
  'mm': 'mm', 'mms': 'mm'
};

const REGEX_UNIDADES = /^(?<val>\d+(?:[.,]\d+)?)\s*(?<unit>[\p{L}.]+)$/u;

export function normalizarTamanho(entrada: string): string {
  if (!entrada) return '';

  const entradaLimpa = entrada.trim();
  const correspondencia = entradaLimpa.match(REGEX_UNIDADES);
  if (!correspondencia?.groups) {
    return entradaLimpa;
  }

  const valor = correspondencia.groups.val.replace(',', '.');
  const unidadeBruta = correspondencia.groups.unit.trim();
  const unidadeLimpa = unidadeBruta.toLowerCase().replace(/\.$/, '');
  const unidadeCanonica = UNIT_MAP[unidadeLimpa];

  if (!unidadeCanonica) {
    return entradaLimpa;
  }

  const valorNumerico = parseFloat(valor);
  const valorFinal = Number.isInteger(valorNumerico) ? valorNumerico.toString() : valor;
  return `${valorFinal} ${unidadeCanonica}`;
}

export function normalizarUnidade(valorBruto: string, unidadeBruta: string): string {
  return normalizarTamanho(`${valorBruto} ${unidadeBruta}`);
}

/**
 * Tenta extrair o tamanho/peso da string de descriÃ§Ã£o ou normalizar string bruta.
 * Ex: "... 1KG" -> "1kg"
 */
export function extrairTamanho(texto: string): string | null {
  if (!texto) return null;

  const correspondencia = texto.match(/(?<val>\d+(?:[.,]\d+)?)\s*(?<unit>[\p{L}.]+)/u);
  if (correspondencia && correspondencia.groups) {
    return normalizarTamanho(`${correspondencia.groups.val} ${correspondencia.groups.unit}`);
  }
  return null;
}

/**
 * ConstrÃ³i a URL da imagem pÃºblica do OpenFoodFacts a partir do cÃ³digo de barras.
 * LÃ³gica de split para cÃ³digos > 8 dÃ­gitos.
 */
export function construirUrlImagemOFF(codigo: string): string | null {
  if (!codigo) return null;

  const strCode = codigo.toString();
  let path = strCode;

  if (strCode.length > 8) {
    const correspondencia = strCode.match(/^(\d{3})(\d{3})(\d{3})(\d*)$/);
    if (correspondencia) {
      // Remove grupos undefined/vazios
      const parts = correspondencia.slice(1).filter(p => p);
      path = parts.join('/');
    }
  }

  // Tenta estimar a revisÃ£o? NÃ£o temos como saber a revisÃ£o sem consultar a API.
  // Porem, se tivermos o objeto de imagens da API, podemos passar rev.
  // Sem rev, essa URL genÃ©rica pode falhar ou precisar de redirect.
  // Mas a API de imagens suporta: .../front_pt.jpg (sem rev, pega a ultima)?
  // Testes indicam que sim, as vezes. Mas o padrÃ£o oficial pede rev.
  // Vamos assumir que essa funÃ§Ã£o serve para quando NÃƒO TEMOS url, entÃ£o tentamos a sorte.
  return `https://images.openfoodfacts.org/images/products/${path}/front_pt.400.jpg`;
}
