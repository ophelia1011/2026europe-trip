// Ophelia Europe 2026 - offline cache
// Cache-first for the app shell + known photos, so the itinerary still opens with no signal.
const CACHE_NAME = 'ophelia-europe-2026-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  'https://commons.wikimedia.org/wiki/Special:FilePath/1308%20-%20Zell%20am%20See.JPG?width=800',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Kaiser-Franz-Josefs-H%C3%B6he%20mit%20Gross%20Glockner.jpg?width=800',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Sterzing-Vipiteno.JPG?width=800',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Lago%20di%20Braies%20South%20Tyrol%206.jpg?width=800',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Kronplatz%20von%20Bruneck%2C%202.jpeg?width=800',
  'https://commons.wikimedia.org/wiki/Special:FilePath/AlpediSiusi%20panorama2.JPG?width=800',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Grainau%2C%20Eibsee%2C%20Zugspitze%20und%20Ludwigsinsel.JPG?width=800',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Marienplatz%2CMunich%2CGermany.jpg?width=800',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Dreiflusseck%20Passau.JPG?width=800',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Belvedere%20museum%2C%20Vienna.JPG?width=800',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // add each individually so one failed (e.g. offline install) doesn't block the rest
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { mode: 'cors' })).catch(() => {})
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // network-first for the HTML document itself, so edits/updates show up when online;
  // falls back to cache when there's no signal
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  // cache-first for everything else (photos, CSS, JS) — fast + works offline
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});
