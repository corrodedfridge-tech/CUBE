/* CUBE service worker.

   The old one was cache-first on a cache called 'cube-v1' that never changed its name, so
   once it had a copy of script.js it served that copy for ever and no update could ever
   reach anyone. This one does the opposite where it matters:

     the code  (html, css, js)  network first, cache only as the offline fallback
     the art   (png, mp3)       cache first, because a given file never changes contents

   and the cache name carries the version, so publishing a build throws the old one away. */
const VER = '4.2';
const C = 'cube-' + VER;
const SHELL = ['./', './index.html', './style.css', './script.js', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './icon-180.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const CODE = /\.(?:html|css|js|webmanifest)$|\/$/;

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const code = CODE.test(new URL(e.request.url).pathname);
  if (code) {
    // network first: whatever is published wins, and the cache is only there for offline
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(C).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request, { ignoreSearch: true })
                       .then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  // art: cache first, it is the same bytes every time
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit || fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(C).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => undefined)
    )
  );
});
