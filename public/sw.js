/**
 * PizzaFlow — Service Worker
 * Estratégia: Cache-first para assets estáticos, Network-first para API.
 * @version 1.0.0
 */

const CACHE_NAME     = 'pizzaflow-v1';
const API_CACHE_NAME = 'pizzaflow-api-v1';

/* ==========================================================================
   ASSETS PARA PRÉ-CACHE (Adaptado dinamicamente para subdiretórios/GitHub Pages)
   ========================================================================== */

const SCOPE = self.registration.scope;

const STATIC_ASSETS = [
  SCOPE,
  `${SCOPE}index.html`,
  `${SCOPE}manifest.webmanifest`,
  `${SCOPE}icons/icon-192.png`,
  `${SCOPE}icons/icon-512.png`,
];

/* ==========================================================================
   INSTALL — Pre-caches assets essenciais
   ========================================================================== */

self.addEventListener('install', (event) => {
  console.info('[SW] Instalando...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tenta cachear assets, mas não falha se algum não estiver disponível
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(() => {
            console.warn(`[SW] Não foi possível cachear: ${url}`);
          })
        )
      );
    }).then(() => {
      console.info('[SW] Instalação concluída');
      // Força o SW a se tornar ativo imediatamente
      return self.skipWaiting();
    })
  );
});

/* ==========================================================================
   ACTIVATE — Limpa caches antigas
   ========================================================================== */

self.addEventListener('activate', (event) => {
  console.info('[SW] Ativando...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map(name => {
            console.info(`[SW] Removendo cache antiga: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.info('[SW] Ativação concluída');
      // Assume controle de todas as abas imediatamente
      return self.clients.claim();
    })
  );
});

/* ==========================================================================
   FETCH — Estratégias de cache
   ========================================================================== */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET
  if (request.method !== 'GET') return;

  // Ignora extensões de browser e outros origins
  if (!url.origin.startsWith('http') || url.origin !== location.origin) {
    return;
  }

  // Requisições de API → Network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE_NAME));
    return;
  }

  // Fontes Google → Cache-first (longa duração)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, 'pizzaflow-fonts-v1'));
    return;
  }

  // Imagens → Cache-first
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, 'pizzaflow-images-v1'));
    return;
  }

  // Assets estáticos (JS, CSS) → Cache-first
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Navegação HTML → Network-first com fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Tudo mais → Network-first
  event.respondWith(networkFirst(request, CACHE_NAME));
});

/* ==========================================================================
   ESTRATÉGIAS
   ========================================================================== */

/**
 * Cache-first: retorna do cache se disponível, senão busca na rede e armazena
 */
async function cacheFirst(request, cacheName) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Recurso não disponível offline', { status: 503 });
  }
}

/**
 * Network-first: busca da rede primeiro, usa cache como fallback
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

/**
 * Network-first para navegação com fallback para index.html (SPA)
 */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Fallback para index.html (permite SPA funcionar offline)
    const cache = await caches.open(CACHE_NAME);
    return (
      await cache.match(request) ||
      await cache.match(SCOPE) ||
      await cache.match(`${SCOPE}index.html`) ||
      new Response('App offline', { status: 503, headers: { 'Content-Type': 'text/html' } })
    );
  }
}

/* ==========================================================================
   MENSAGENS (do app para o SW)
   ========================================================================== */

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.info('[SW] Pulando espera e atualizando...');
    self.skipWaiting();
  }
});
