// Cambia la versión cuando actualices archivos importantes
const CACHE_NAME = 'nattiva-cache-v2';

// Archivos base para funcionar offline
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo manejar requests del mismo dominio (GitHub Pages)
  if (url.origin !== self.location.origin) return;

  // 1) Para NAVEGACIÓN (cuando entras a la web o recargas):
  //    Network-first para que el HTML se actualice.
  //    Si no hay internet, usa caché.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // guarda la última versión del index.html
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 2) Para recursos (iconos, manifest, etc): cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          // guardar recursos exitosos en caché (opcional pero útil)
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
      );
    })
  );
});
