// Questa versione aggiorna la PWA esistente senza richiedere una nuova installazione.
const CACHE_NAME = 'cge-volontari-static-v27';
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
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('cge-volontari-static-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();

    // Forza tutte le pagine già aperte del gestionale a caricare l'ultima build.
    const windows = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for (const client of windows) {
      try {
        const u = new URL(client.url);
        if (u.pathname.startsWith(APP_BASE)) {
          u.searchParams.set('cge_refresh','13.90-'+Date.now());
          await client.navigate(u.toString());
        }
      } catch (_) {}
    }
  })());
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
