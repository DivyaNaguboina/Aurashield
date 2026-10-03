/**
 * sw.js — Dynamic Network-First Progressive Caching Script (v2)
 * Ensures zero stale-data lock issues for deep cosmetic index iterations.
 */

const CACHE_VERSION = 'v2_live';
const DATA_CACHE    = `cosmetic-data-${CACHE_VERSION}`;
const APP_CACHE     = `cosmetic-app-${CACHE_VERSION}`;

const DATA_URLS = [
  '/data/ingredient_index.json',
  '/data/skin_compat_index.json',
  '/data/hair_compat_index.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== DATA_CACHE && key !== APP_CACHE) {
            console.log('[SW] Purging deprecated stale cache block:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ── Network-First Strategy for Data Indexes to eliminate panel cache complaints
  if (DATA_URLS.some(u => url.pathname === u)) {
    event.respondWith(networkFirstWithFallback(DATA_CACHE, event.request));
    return;
  }

  // ── General app configuration routing
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(APP_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        return new Response('Offline services restricted. Check your data link.', { status: 503 });
      });
    })
  );
});

async function networkFirstWithFallback(cacheName, request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      return response;
    }
  } catch (err) {
    console.warn('[SW] Network context down, extracting index backup directly from Cache storage.');
  }
  const cached = await cache.match(request);
  return cached || new Response(JSON.stringify({ error: "Storage index not initialized" }), { status: 503, headers: { 'Content-Type': 'application/json' } });
}