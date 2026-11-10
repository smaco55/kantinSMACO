// Service worker sederhana: hanya aset statis. Transaksi dan data TIDAK pernah disimpan atau dilayani offline.
const V = 'kantin-v1';
const ASET = ['./', 'index.html', 'css/app.css', 'js/core.js', 'config.js', 'manifest.json', 'icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(ASET)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return; // permintaan ke Apps Script tidak disentuh
  // jaringan dulu agar pembaruan kode langsung berlaku; cache hanya cadangan saat gagal memuat halaman
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)).catch(() => {}); return res; }).catch(() => caches.match(r)));
});
