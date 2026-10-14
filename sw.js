/* Service worker: praca offline i instalacja jako aplikacja (PWA). Rejestrowany w app.js tylko przez http(s).
   Strategia „najpierw sieć”: z siecią użytkownik zawsze dostaje najnowszą wersję (kopia w pamięci jest przy okazji
   odświeżana), bez sieci strona działa z kopii. Projekty i tak są w localStorage, więc offline nic nie ginie.
   Nowy plik potrzebny stronie dopisz do ASSETS (test „lista plików service workera jest kompletna” to sprawdza). */
/** @type {ServiceWorkerGlobalScope} */
const sw = /** @type {any} */ (self);
const CACHE = 'rozdz-0.22.0';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/fonts.css',
  'css/styles.css',
  'js/data.js',
  'js/model.js',
  'js/render.js',
  'js/wiring.js',
  'js/sim.js',
  'js/schemat.js',
  'js/app.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'fonts/barlow-400-latin-ext.woff2',
  'fonts/barlow-400-latin.woff2',
  'fonts/barlow-500-latin-ext.woff2',
  'fonts/barlow-500-latin.woff2',
  'fonts/barlow-600-latin-ext.woff2',
  'fonts/barlow-600-latin.woff2',
  'fonts/barlow-condensed-500-latin-ext.woff2',
  'fonts/barlow-condensed-500-latin.woff2',
  'fonts/barlow-condensed-600-latin-ext.woff2',
  'fonts/barlow-condensed-600-latin.woff2',
  'fonts/barlow-condensed-700-latin-ext.woff2',
  'fonts/barlow-condensed-700-latin.woff2',
  'fonts/jetbrains-mono-400-latin-ext.woff2',
  'fonts/jetbrains-mono-400-latin.woff2',
  'fonts/jetbrains-mono-500-latin-ext.woff2',
  'fonts/jetbrains-mono-500-latin.woff2'
];

sw.addEventListener('install', e => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => sw.skipWaiting())
  );
});

sw.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k.indexOf('rozdz-') === 0 && k !== CACHE).map(k => caches.delete(k))))
      .then(() => sw.clients.claim())
  );
});

sw.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== sw.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req, { ignoreSearch: true })
          .then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined))
          /* brak kopii: zwykły błąd sieci zamiast undefined, którego respondWith() nie przyjmuje */
          .then(hit => hit || Response.error())
      )
  );
});
