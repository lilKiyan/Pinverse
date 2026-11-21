
const VERSION = 'v1795259019297'
const STATIC_CACHE = `pinverse-static-${VERSION}`
const IMAGE_CACHE = `pinverse-images-${VERSION}`
const PAGES_CACHE = `pinverse-pages-${VERSION}`
const MAX_IMAGES = 80  

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(PAGES_CACHE).then((cache) => cache.addAll(['/', '/offline.html']))
    )
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((k) => ![STATIC_CACHE, IMAGE_CACHE, PAGES_CACHE].includes(k))
                    .map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (event) => {
    const { request } = event

    if (request.method !== 'GET') return

    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) return

    if (url.hostname === 'res.cloudinary.com') {
        event.respondWith(cacheFirst(request, IMAGE_CACHE))
        return
    }

    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(cacheFirst(request, STATIC_CACHE))
        return
    }

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, PAGES_CACHE))
        return
    }

})

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request)
    if (cached) return cached

    const res = await fetch(request)
    if (res.ok) {
        const cache = await caches.open(cacheName)
        cache.put(request, res.clone())
        if (cacheName === IMAGE_CACHE) trimCache(cacheName, MAX_IMAGES)
    }
    return res
}

async function networkFirst(request, cacheName) {
    try {
        const res = await fetch(request)
        if (res.ok) {
            const cache = await caches.open(cacheName)
            cache.put(request, res.clone())
        }
        return res
    } catch {
        const cached = await caches.match(request)
        if (cached) return cached

        const offline = await caches.match('/offline.html')
        if (offline) return offline

        return new Response('اتصال برقرار نیست', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
    }
}

async function trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    if (keys.length <= maxEntries) return
    for (let i = 0; i < keys.length - maxEntries; i++) {
        await cache.delete(keys[i])
    }
}