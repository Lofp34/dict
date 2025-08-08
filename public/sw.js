const CACHE_NAME = 'dictee-magique-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non HTTP(S) (ex: chrome-extension://) et les méthodes non-GET
  const url = event.request.url;
  if (!/^https?:/i.test(url) || event.request.method !== 'GET') {
    return; // laisser le navigateur gérer
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Optionnel: ne mettre en cache que le même origin
          try {
            const reqUrl = new URL(event.request.url);
            if (reqUrl.origin === self.location.origin) {
              cache.put(event.request, responseToCache);
            }
          } catch {}
        });
        return networkResponse;
      });
    })
  );
}); 