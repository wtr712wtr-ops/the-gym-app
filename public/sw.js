const CACHE = 'thegym-v77';
const ASSETS = ['/', '/index.html'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { if (e.request.url.includes('/api/')) return; e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request))); });
self.addEventListener('push', e => { const data = e.data ? e.data.json() : {}; e.waitUntil(self.registration.showNotification(data.title || 'THE GYM', { body: data.body || '新しい記録が追加されました', icon: '/icon-192.png', vibrate: [200, 100, 200] })); });