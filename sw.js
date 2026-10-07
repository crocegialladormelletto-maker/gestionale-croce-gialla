// Service Worker App Volontari - configurazione stabile
const CACHE_NAME = 'cge-volontari-static-v33';
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
    event.respondWith(
      fetch(request, {cache:'no-store'})
        .catch(() => caches.match(APP_BASE + 'app-volontari.html'))
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
