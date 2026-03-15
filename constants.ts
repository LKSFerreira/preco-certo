// Regex de validação de unidades — GERADA AUTOMATICAMENTE a partir do UNIT_MAP
// Ao adicionar uma nova unidade ao mapa em utilitarios.ts, ela é aceita aqui automaticamente.
import { UNIT_MAP } from './services/utilitarios';

// Ordena chaves por comprimento decrescente para evitar match parcial
// Exemplo: "quilograma" antes de "kg" antes de "k", "ml" antes de "m"
const unidadesAceitas = Object.keys(UNIT_MAP)
  .sort((a, b) => b.length - a.length)
  .map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

export const REGEX_UNIDADE = new RegExp(
  `^(\\d+([.,]\\d+)?\\s?)?(${unidadesAceitas})$`, 'iu'
);

// Chave para persistência no LocalStorage
export const CHAVE_STORAGE_CARRINHO = 'sem_susto_carrinho_v1';
export const CHAVE_STORAGE_CATALOGO = 'sem_susto_catalogo_v1';
export const CHAVE_STORAGE_HISTORICO = 'sem_susto_historico_v1';
export const LIMITE_ITENS_DISTINTOS_CARRINHO_GRATUITO = 15;

// Imagem placeholder (SVG Data URI)
// Ícone: Sacola de compras verde estilizada com fundo suave, substituindo a cesta cinza.
export const IMAGEM_PADRAO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%23f0fdf4'/%3E%3Cpath d='M192 144V96c0-35.3 28.7-64 64-64s64 28.7 64 64v48' fill='none' stroke='%2315803d' stroke-width='32' stroke-linecap='round'/%3E%3Cpath d='M160 144h192c8.8 0 16 7.2 16 16v32H144v-32c0-8.8 7.2-16 16-16z' fill='%2316a34a'/%3E%3Cpath d='M144 192h224l-24 240c-1.6 16-16 28-32 28H200c-16 0-30.4-12-32-28L144 192z' fill='%2322c55e'/%3E%3Ccircle cx='256' cy='300' r='32' fill='%23dcfce7' opacity='0.4'/%3E%3C/svg%3E";

// Lista de nomes de produtos inválidos/genéricos que devem ser rejeitados ou limpos
export const NOMES_INVALIDOS = new Set([
  // vazios / símbolos
  '', '-', '—', '–', '.', '..', '...', '…', '_',

  // pt-br (genéricos)
  'produto sem nome',
  'sem nome',
  'sem título',
  'sem descrição',
  'sem informacao',
  'sem informação',
  'nao informado',
  'não informado',
  'nao se aplica',
  'não se aplica',
  'indisponivel',
  'indisponível',
  'carregando',
  'carregando...',
  'aguarde',
  'aguarde...',
  'em breve',
  'teste',
  'exemplo',
  'rascunho',
  'placeholder',
  'nome do produto',
  'descricao',
  'descrição',
  'sem detalhes',
  'produto sem rótulo',
  'sem rótulo',
  'sem marca',
  'produto genérico',

  // en (genéricos)
  'product',
  'product name',
  'item',
  'item name',
  'name',
  'unknown',
  'unnamed',
  'no name',
  'no title',
  'no description',
  'not available',
  'unavailable',
  'loading',
  'loading...',
  'please wait',
  'please wait...',
  'example',
  'sample',
  'draft',
  'placeholder',
  'lorem ipsum',

  // nulos “stringificados”
  'null',
  'none',
  'nil',
  'undefined',
  'nan',
  'n/a',
  'na',
  'not applicable',
  'tbd',
  'to be defined',
  'todo',
]);
