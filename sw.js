/* US3 Service Worker — caché seguro (sin datos sensibles ni auth) */
/* BUILD_ID se reemplaza en deploy: local-mqfvdlhm */

const BUILD_ID = '__BUILD_ID__';
const STATIC_CACHE = `us3-static-${BUILD_ID}`;
const RUNTIME_CACHE = `us3-runtime-${BUILD_ID}`;

/** Shell público precacheado (sin respuestas autenticadas). */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/panel.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/css/design-system.css',
  '/css/login.css',
  '/css/inst-header.css',
  '/css/app.css',
  '/css/motion.css',
  '/css/pwa.css',
  '/js/login.js',
  '/js/load-config.js',
  '/js/pwa.js',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
];

const SENSITIVE_PATHS = [
  /^\/api\//,
  /^\/js\/config\.js$/,
];

const SENSITIVE_HOSTS = [/\.supabase\.co$/i];

function isSensitiveUrl(url) {
  if (url.origin !== self.location.origin) {
    return SENSITIVE_HOSTS.some(re => re.test(url.hostname))
      || url.hostname.includes('supabase');
  }
  return SENSITIVE_PATHS.some(re => re.test(url.pathname));
}

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return /\.(css|js|png|svg|webp|woff2?|webmanifest)$/i.test(url.pathname)
    || url.pathname.startsWith('/icons/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate'
    || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(err => console.warn('[SW] precache parcial', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('us3-') && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => notifyClients({ type: 'SW_ACTIVATED', buildId: BUILD_ID }))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (isSensitiveUrl(url)) {
    event.respondWith(networkOnlyNoStore(request));
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkOnlyNoStore(request));
});

async function networkOnlyNoStore(request) {
  try {
    const res = await fetch(request);
    return res;
  } catch {
    return new Response('Requiere conexión', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirstPage(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline.html');
    if (offline) return offline;
    return new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return cached || new Response('', { status: 504 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(res => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || networkPromise || new Response('', { status: 504 });
}

function notifyClients(data) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(clients => clients.forEach(c => c.postMessage(data)));
}
