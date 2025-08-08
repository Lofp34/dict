const CACHE_NAME = 'dictee-magique-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Assets versionnés (Vite) => cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const resp = await fetch(event.request);
        if (resp && resp.status === 200) cache.put(event.request, resp.clone());
        return resp;
      })
    );
    return;
  }

  // HTML et racine => network-first pour éviter le stale
  if (event.request.mode === 'navigate' || url.pathname === '/') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(event.request, { cache: 'no-store' });
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, fresh.clone());
          return fresh;
        } catch (_) {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(event.request);
          return cached || caches.match('/index.html');
        }
      })()
    );
    return;
  }

  // Par défaut: passer au réseau
  event.respondWith(fetch(event.request));
});