// CampoBR Service Worker v2 — cache de imagens e assets versionados
// Melhorias vs v1: sem revalidação a cada hit (economiza banda), limite de entradas,
// comparação EXATA de host (antes usava includes) e cache de /assets/* (JS/CSS com hash).
const IMG_CACHE = 'campobr-images-v2';
const ASSET_CACHE = 'campobr-assets-v2';
const MAX_IMG_ENTRIES = 150;
const MAX_ASSET_ENTRIES = 60;

const IMAGE_HOSTS = new Set([
  'images.unsplash.com',
  'i.ibb.co',
  'images.pexels.com',
  self.location.hostname,
]);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== IMG_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Remove as entradas mais antigas quando passa do limite (FIFO)
async function trimCache(cache, max) {
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === 'opaque')) {
      cache.put(request, res.clone()).then(() => trimCache(cache, max)).catch(() => {});
    }
    return res;
  } catch (err) {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // JS/CSS versionados pelo Vite (nome com hash => imutáveis)
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE, MAX_ASSET_ENTRIES));
    return;
  }

  const isImage =
    request.destination === 'image' ||
    /\.(png|jpe?g|webp|avif|svg|gif)$/i.test(url.pathname);

  if (isImage && IMAGE_HOSTS.has(url.hostname)) {
    event.respondWith(cacheFirst(request, IMG_CACHE, MAX_IMG_ENTRIES));
  }
});
