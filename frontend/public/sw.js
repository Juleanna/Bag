/* eslint-disable */
/**
 * Service worker для BugTracker (мінімальний).
 * Стратегія:
 *  - Network-first для API (/api/) — щоб не показувати застарілі дані.
 *  - Cache-first для статики (/assets/, /icon-*, /manifest.webmanifest).
 *  - Offline fallback на /offline.html (опціонально).
 */
const CACHE = 'bt-v1'
const STATIC_ASSETS = ['/', '/manifest.webmanifest', '/icon-192.svg', '/icon-512.svg']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => null)
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const req = event.request
  // Тільки GET через SW
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // API: network-first, без кешу (дані змінюються постійно)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(JSON.stringify({ offline: true }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        })
      )
    )
    return
  }

  // Статика: cache-first з оновленням у фоні
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req)
        .then(res => {
          if (res.ok && req.url.startsWith(self.location.origin)) {
            const copy = res.clone()
            caches.open(CACHE).then(c => c.put(req, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || fetchPromise
    })
  )
})
