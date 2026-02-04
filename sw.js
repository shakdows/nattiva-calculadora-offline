// ===================================================
// Service Worker - Nattiva (RECOMENDADO)
// Cambia la versión SIEMPRE que actualices index.html
// ===================================================
const VERSION = 'v4';
const CACHE_NAME = `nattiva-cache-${VERSION}`;

// Archivos esenciales offline (agrega más si los usas)
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-512.png',
];

// ---------------------
// INSTALL
// ---------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE))
  );
  self.skipWaiting();
});

// ---------------------
// ACTIVATE
// ---------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ---------------------
// FETCH
// ---------------------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo mismo origen (tu GitHub Pages)
  if (url.origin !== self.location.origin) return;

  // 1) Navegación (HTML): NETWORK FIRST
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 2) Recursos: STALE-WHILE-REVALIDATE
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);

      // Devuelve cache si existe (rápido), y en paralelo actualiza
      return cached || networkFetch;
    })
  );
});
