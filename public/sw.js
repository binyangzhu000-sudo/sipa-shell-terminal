const CACHE = 'sipa-shell-v2';
const PRECACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Only handle GET, skip cross-origin & WebSocket
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;
  if (url.origin !== location.origin) return;

  // HTML / navigation requests: ALWAYS network-first. The document controls
  // which hashed JS/CSS bundle loads next, so serving a stale cached document
  // pins the browser to a stale bundle forever (this broke the Auth0 login
  // redirect_uri fix from being seen after it was already fixed server-side).
  const isNavigation = e.request.mode === 'navigate' || url.pathname === '/';
  if (isNavigation) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Hashed static assets (js/css/img/fonts): filename contains a content
  // hash, so cache-first is safe — a changed file always gets a new URL.
  if (url.pathname.match(/\.(js|css|png|svg|ico|woff2?)$/)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
