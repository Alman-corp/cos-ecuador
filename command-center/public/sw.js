const CACHE_VERSION = 'v1'
const STATIC_CACHE = `cos-static-${CACHE_VERSION}`
const PAGES_CACHE = `cos-pages-${CACHE_VERSION}`
const API_CACHE = `cos-api-${CACHE_VERSION}`
const OFFLINE_CACHE = `cos-offline-${CACHE_VERSION}`

const MAX_API_ENTRIES = 50

const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sin Conexión — COS Ecuador</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: 1rem;
    }
    .container { text-align: center; max-width: 400px; }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: #3b82f6; }
    p { color: #94a3b8; margin-bottom: 1.5rem; line-height: 1.5; }
    button {
      background: #3b82f6;
      color: #fff;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>Estás sin conexión</h1>
    <p>Parece que has perdido la conexión a internet. Algunas funciones pueden no estar disponibles hasta que te reconectes.</p>
    <button onclick="window.location.reload()">Reintentar</button>
  </div>
</body>
</html>`

const PRECACHE_URLS = [
  '/manifest.json',
  '/icon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {})),
      caches.open(OFFLINE_CACHE).then((cache) => {
        const response = new Response(OFFLINE_PAGE, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
        return cache.put('/offline', response)
      }),
    ])
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE && key !== API_CACHE && key !== OFFLINE_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Always let API calls pass through to the server (never intercept)
  if (url.pathname.startsWith('/api/')) return

  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/static') ||
    url.pathname.match(/\.(css|js|mjs)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  if (request.mode === 'navigate') {
    if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/dashboard')) {
      event.respondWith(networkFirstWithFallback(request, PAGES_CACHE))
    } else {
      event.respondWith(staleWhileRevalidate(request, PAGES_CACHE))
    }
    return
  }

  event.respondWith(networkFirstWithFallback(request, PAGES_CACHE))
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tax-data') {
    event.waitUntil(syncTaxData())
  }
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {
    title: 'COS Ecuador',
    body: 'Tienes una nueva notificación',
  }

  const options = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { url: data.url ?? '/' },
    vibrate: [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const urlToOpen = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(urlToOpen)
    })
  )
})

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirstWithLimit(request, cacheName, limit) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      if (keys.length >= limit) {
        await cache.delete(keys[0])
      }
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)

  return cached ?? fetchPromise
}

async function networkFirstWithFallback(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return caches.match('/offline')
  }
}

async function syncTaxData() {
  const cache = await caches.open(API_CACHE)
  const requests = await cache.keys()
  const pending = requests.filter((req) => req.url.includes('/api/tax/'))
  for (const req of pending) {
    try {
      await fetch(req)
    } catch {
      // Will retry on next sync event
    }
  }
}
