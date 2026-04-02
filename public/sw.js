const CACHE_NAME = 'noor-v3';
const SHELL = ['/index.html', '/manifest.json', '/favicon.ico'];

// ── Install: cache app shell ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for GET requests ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});

// ── Push: show prayer notification (iOS Safari 16.4+ / Android Chrome) ────────
self.addEventListener('push', (event) => {
  let data = { title: '🕌 نور المسلم', body: 'حان وقت الصلاة', prayer: 'dhuhr' };
  try {
    data = event.data.json();
  } catch {}

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `prayer-${data.prayer}`,         // replaces previous same-prayer notif
    renotify: true,
    requireInteraction: true,
    data: { prayer: data.prayer, url: '/' },
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'dismiss', title: 'إغلاق' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification click: open / focus the app ──────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow('/');
    })
  );
});

// ── Periodic background sync (Chrome Android) ─────────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'prayer-refresh') {
    event.waitUntil(refreshPrayerData());
  }
});

async function refreshPrayerData() {
  // Re-fetch latest prayer times from the app's API and update cache
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.add('/');
  } catch {}
}
