// Questa versione aggiorna la PWA esistente senza richiedere una nuova installazione.
const CACHE_NAME = 'cge-volontari-static-v8';
const APP_BASE = '/gestionale-croce-gialla/';
const STATIC_ASSETS = new Set([
  APP_BASE + 'manifest.json',
  APP_BASE + 'icons/icon-192-v6.png',
  APP_BASE + 'icons/icon-512-v6.png',
  ]);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([...STATIC_ASSETS]))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('cge-volontari-static-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Il collegamento salvato nell'icona ha un URL fisso, ma l'HTML deve essere
  // preso sempre dalla versione pubblicata, non dalla cache del telefono.
  // Una query diversa evita anche vecchie copie sui CDN intermedi.
  if (request.mode === 'navigate' && url.pathname.startsWith(APP_BASE)) {
    event.respondWith((async () => {
      const freshUrl = new URL(request.url);
      freshUrl.searchParams.set('cge_refresh', String(Date.now()));
      return fetch(new Request(freshUrl.toString(), {
        method: 'GET', credentials: 'same-origin', cache: 'no-store',
        redirect: 'follow',
      }));
    })());
    return;
  }

  if (!STATIC_ASSETS.has(url.pathname)) return;
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
