// CampoBR Fast Image Cache Service Worker v1
const CACHE_NAME = 'campobr-images-v1';

const IMAGE_HOSTS = [
  'images.unsplash.com',
  'i.ibb.co',
  'images.pexels.com',
  'campobr.blog'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Check if request is an image or targeted image CDN host
  const isImageRequest = 
    request.destination === 'image' ||
    IMAGE_HOSTS.some(host => url.hostname.includes(host)) ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|gif)$/i);

  if (request.method === 'GET' && isImageRequest) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // 1. Try Cache First for fastest possible 0ms rendering
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Revalidate in background if online (Stale-While-Revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
              cache.put(request, networkResponse);
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // 2. Otherwise fetch from network and store in cache
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // If offline and not in cache, fallback
          return cachedResponse || Response.error();
        }
      })
    );
  }
});
