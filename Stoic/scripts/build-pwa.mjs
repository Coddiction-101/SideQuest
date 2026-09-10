import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const assets = readdirSync('dist/assets').map(file => `/assets/${file}`)
const pulse = readdirSync('dist/pulse').map(file => `/pulse/${file}`)
const files = ['/index.html', '/manifest.webmanifest', '/stoic-favicon.svg', '/stoic-symbol.svg', '/stoic-symbol-180.png', '/stoic-symbol-192.png', '/stoic-symbol-512.png', ...assets, ...pulse]
const hash = createHash('sha256')
for (const file of files) hash.update(readFileSync(`dist${file}`))
const version = hash.digest('hex').slice(0, 12)
writeFileSync('dist/sw.js', `
const CACHE = 'stoic-${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('stoic-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      try {
        const response = await fetch(request, { signal: controller.signal });
        if (!response.ok) throw new Error('Navigation unavailable');
        return response;
      } catch {
        const pathname = new URL(request.url).pathname;
        return await cache.match(pathname.startsWith('/pulse/') ? '/pulse/index.html' : '/index.html') || Response.error();
      } finally { clearTimeout(timer); }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && new URL(request.url).pathname.startsWith('/assets/')) await cache.put(request, response.clone());
    return response;
  })());
});
`)
console.log(`Offline app generated: ${version} (${files.length} cached files).`)
