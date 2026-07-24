// GDC Nandasain — Content/Image Cache Service Worker
// Maksad: Firebase se aane wala content (site_content.json, site_images.json,
// slider.json etc.) cache mein rakhna taaki agar kabhi network fail ho jaaye
// (genuinely offline / request fail), tab bhi purana content dikh sake —
// lekin jab network kaam kar raha ho (chahe weak/slow ho), hamesha FRESH
// (latest) data hi diya jaaye, taaki naya upload/edit revert na ho.
const CACHE_NAME = 'gdc-content-cache-v2';
const CACHEABLE_HOST = 'gdc-nandasain-website-default-rtdb.firebaseio.com';

self.addEventListener('install', function(event) {
self.skipWaiting();
});

self.addEventListener('activate', function(event) {
event.waitUntil(
caches.keys().then(function(keys) {
return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
})
);
self.clients.claim();
});

self.addEventListener('fetch', function(event) {
var req = event.request;
if (req.method !== 'GET') return;
var url;
try { url = new URL(req.url); } catch(e) { return; }
if (url.hostname !== CACHEABLE_HOST) return;
if (!/\.json$/.test(url.pathname)) return;

// Network-first: pehle hamesha fresh data lene ki koshish karo (weak network
// pe bhi ye kaam karta hai, bas thoda time leta hai). Sirf tab cache se
// jawab do jab network request genuinely fail ho jaaye (offline/timeout).
event.respondWith(
fetch(req).then(function(networkResponse) {
if (networkResponse && networkResponse.ok) {
var copy = networkResponse.clone();
caches.open(CACHE_NAME).then(function(cache) { cache.put(req, copy); });
}
return networkResponse;
}).catch(function() {
return caches.open(CACHE_NAME).then(function(cache) {
return cache.match(req);
});
})
);
});
