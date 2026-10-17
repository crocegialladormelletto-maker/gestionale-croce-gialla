// Service Worker App Volontari - configurazione stabile
const CACHE_NAME = 'cge-volontari-static-v37';
const APP_BASE = '/gestionale-croce-gialla/';
const STATIC_ASSETS = [
  APP_BASE + 'app-volontari.html',
  APP_BASE + 'manifest-volontari.webmanifest',
  APP_BASE + 'icons/icon-192-v6.png',
  APP_BASE + 'icons/icon-512-v6.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
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

  if (request.mode === 'navigate' && url.pathname.startsWith(APP_BASE)) {
    // Il gestionale non va mai sostituito con la vecchia pagina di installazione.
    // Mostra invece un errore di connessione e conserva i dati sul server.
    // Tablet 08: mantieni ESATTAMENTE lo stesso collegamento del dispositivo,
    // ma recupera il nuovo index.html anche quando il CDN ha una copia precedente.
    // Nessun intervento sulle bozze locali o sulla sessione del tablet.
    const isTablet08 = (url.pathname === APP_BASE || url.pathname === APP_BASE + 'index.html')
      && url.searchParams.get('area') === 'tablet'
      && url.searchParams.get('mezzo') === '08';
    const freshUrl = isTablet08 ? new URL(request.url) : null;
    if (freshUrl) freshUrl.searchParams.set('_cge_app_build', '14.53-tablet08-accesso');
    event.respondWith(
      fetch(freshUrl ? freshUrl.href : request, {cache:'no-store'}).catch(async () => {
        if (url.pathname === APP_BASE + 'app-volontari.html') {
          const cached = await caches.match(APP_BASE + 'app-volontari.html');
          if (cached) return cached;
        }
        return new Response('<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connessione assente</title><body style="font:16px system-ui;padding:24px"><h2>Connessione temporaneamente non disponibile</h2><p>I servizi non sono stati cancellati. Riconnettiti e riapri l’app.</p></body></html>', {status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
      })
    );
    return;
  }

  if (!STATIC_ASSETS.includes(url.pathname)) return;

  event.respondWith(
    fetch(request, {cache:'no-store'}).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(url.pathname, copy));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
