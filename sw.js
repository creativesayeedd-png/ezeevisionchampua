/* EZEE VISION CHAMPUA — path-safe PWA service worker.
   Works from a domain root (Vercel) and a GitHub Pages project subpath. */
const CACHE_VERSION = 'evc-app-shell-v3-path-safe';
const BASE_URL = new URL('./', self.registration.scope);
const SHELL_PATHS = [
  './', './index.html', './offline.html', './manifest.webmanifest',
  './assets/css/app.css', './assets/js/app.js', './assets/js/settings.js',
  './firebase-config.js', './assets/images/app-icon-192.png',
  './assets/images/app-icon-512.png', './assets/images/app-icon-maskable.png',
  './assets/images/apple-touch-icon.png', './assets/images/ezee-vision-logo-source.webp'
];
const APP_SHELL = SHELL_PATHS.map(path => new URL(path, BASE_URL).href);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('evc-app-shell-') && key !== CACHE_VERSION)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Never cache Firebase or WhatsApp.
  if (/\/(?:__\/|api\/|firebase|firestore|identitytoolkit|securetoken)/i.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(new URL('./index.html', BASE_URL).href, copy));
        }
        return response;
      }).catch(async () =>
        (await caches.match(new URL('./index.html', BASE_URL).href)) ||
        (await caches.match(new URL('./offline.html', BASE_URL).href))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
