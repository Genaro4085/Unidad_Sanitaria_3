/* US3 Service Worker — caché conservadora (red fresca cuando hay red) */
/* BUILD_ID se reemplaza en deploy */

const BUILD_ID = '__BUILD_ID__';
const STATIC_CACHE = `us3-static-${BUILD_ID}`;
const RUNTIME_CACHE = `us3-runtime-${BUILD_ID}`;

const PRECACHE_URLS = [
  '/offline.html',
  '/favicon-32.png',
  '/css/tabler-icons.min.css',
  '/css/fonts/tabler-icons.woff2',
  '/icons/icon-192.png',
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
    || url.pathname.startsWith('/icons/')
    || url.pathname.startsWith('/css/fonts/');
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

  /* CDN, fuentes y librerías externas: los carga el navegador (evita CSP/504 en SW). */
  if (url.origin !== self.location.origin) return;

  if (isSensitiveUrl(url)) {
    event.respondWith(networkOnlyNoStore(request));
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(networkFirstStatic(request));
    return;
  }

  event.respondWith(networkFirstStatic(request));
});

async function networkOnlyNoStore(request) {
  try {
    return await fetch(request);
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

/** Siempre intenta red primero para JS/CSS (evita versiones viejas en caché). */
async function networkFirstStatic(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 504 });
  }
}

function notifyClients(data) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(clients => clients.forEach(c => c.postMessage(data)));
}
