/* EZEE VISION CHAMPUA PWA service worker.
 * Cache only the local application shell. Firebase/Auth/Firestore requests are never cached.
 */
const CACHE_VERSION = 'evc-app-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/css/app.css',
  '/assets/js/app.js',
  '/assets/js/settings.js',
  '/firebase-config.js',
  '/assets/images/app-icon-192.png',
  '/assets/images/app-icon-512.png',
  '/assets/images/app-icon-maskable.png',
  '/assets/images/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('evc-app-shell-') && key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never intercept Firebase, Google APIs, WhatsApp, or any cross-origin request.
  if (url.origin !== self.location.origin) return;
  // Do not cache Firestore/Auth endpoints if same-origin proxy routes are added later.
  if (/\/(__\/|api\/|firebase|firestore|identitytoolkit|securetoken)/i.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => (await caches.match('/index.html')) || (await caches.match('/offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
