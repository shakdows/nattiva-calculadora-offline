// ===================================================
// Service Worker - Nattiva
// Incrementa la versión SIEMPRE que cambies HTML/CSS/JS
// ===================================================
const CACHE_NAME = 'nattiva-cache-v3';

// Archivos esenciales para funcionar offline
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-512.png'
  // agrega aquí otros archivos si los usas, ej:
  // './logo-nattiva.png'
];

// ---------------------
// INSTALL
// ---------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ---------------------
// ACTIVATE
// ---------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---------------------
// FETCH
// ---------------------
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Solo manejar requests del mismo dominio (GitHub Pages)
  if (new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // 1️⃣ Navegación (HTML): network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('./index.html', copy);
          });
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 2️⃣ Recursos (iconos, manifest, css, js): cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
          return response;
        })
      );
    })
  );
});
