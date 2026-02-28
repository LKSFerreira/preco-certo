/**
 * Service Worker mínimo do Sem Susto.
 * 
 * Responsabilidades:
 * 1. Habilitar o evento `beforeinstallprompt` no navegador (requer SW ativo).
 * 2. Cache básico de assets estáticos para carregamento offline leve.
 * 
 * Estratégia: Network-first para navegação, Cache-first para assets estáticos.
 */

const NOME_CACHE = 'sem-susto-v1';

const ASSETS_ESTATICOS = [
  '/',
  '/favicon.png',
  '/favicon.svg',
];

// Instalação: pré-cacheia assets essenciais
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(NOME_CACHE).then((cache) => cache.addAll(ASSETS_ESTATICOS))
  );
  // Ativa o SW imediatamente sem esperar abas antigas fecharem
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome !== NOME_CACHE)
          .map((nome) => caches.delete(nome))
      )
    )
  );
  // Assume controle de todas as abas imediatamente
  self.clients.claim();
});

// Fetch: Network-first para navegação, Cache-first para assets
self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request;

  // Ignora requisições que não são GET (POST de API, etc.)
  if (requisicao.method !== 'GET') return;

  // Ignora requisições para APIs externas ou internas
  if (requisicao.url.includes('/api/')) return;

  evento.respondWith(
    fetch(requisicao)
      .then((resposta) => {
        // Clona e cacheia a resposta válida
        if (resposta && resposta.status === 200) {
          const respostaClone = resposta.clone();
          caches.open(NOME_CACHE).then((cache) => cache.put(requisicao, respostaClone));
        }
        return resposta;
      })
      .catch(() => {
        // Fallback para cache quando offline
        return caches.match(requisicao);
      })
  );
});
