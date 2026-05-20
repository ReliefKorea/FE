const CACHE_NAME = 'relief-korea-static-v1';

const DEV_INTERNAL_PATHS = [
  '/@vite',
  '/@react-refresh',
  '/node_modules/.vite',
];

function isHttpUrl(url) {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function isViteInternalPath(pathname) {
  return DEV_INTERNAL_PATHS.some(path => pathname.startsWith(path) || pathname.includes(path));
}

function isBackendApiRequest(url) {
  return url.pathname.startsWith('/api/')
    || (url.hostname === 'localhost' && url.port === '3000' && url.pathname.startsWith('/api/'))
    || (url.hostname === '127.0.0.1' && url.port === '3000' && url.pathname.startsWith('/api/'));
}

function shouldHandleRequest(request, url) {
  if (request.method !== 'GET') return false;
  if (!isHttpUrl(url)) return false;
  if (url.origin !== self.location.origin) return false;
  if (isViteInternalPath(url.pathname)) return false;
  if (isBackendApiRequest(url)) return false;
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return false;

  return true;
}

function shouldCacheResponse(response) {
  return response
    && response.ok
    && response.type === 'basic';
}

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  let url;

  try {
    url = new URL(event.request.url);
  } catch (_) {
    return;
  }

  if (!shouldHandleRequest(event.request, url)) {
    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);

      if (shouldCacheResponse(response)) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }

      return response;
    } catch (error) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw error;
    }
  })());
});
