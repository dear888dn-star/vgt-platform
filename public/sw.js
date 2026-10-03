// Safar akademiya — service worker: ilovani o'rnatish va internetsiz rejim.
// Statik fayllar (sahifa, uslublar, skriptlar, mavzu rasmlari) keshdan tez ochiladi va fonda yangilanadi.
// API so'rovlari keshlanmaydi (taqdimot/video bo'laklari va AI ovoz fayllaridan tashqari — ular o'zgarmaydi).
const VERSION = "safar-v4";
const SHELL = ["/", "/index.html", "/css/style.css", "/css/motion.css", "/css/features.css", "/css/media.css", "/css/live.css", "/js/app.js", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Taqdimot bo'laklari o'zgarmaydi — avval kesh.
  if (/^\/api\/(slides\/[\w-]+\/chunk\/|tts\/audio\/|videos\/[\w-]+\/[\w-]+\/chunk\/)/.test(url.pathname)) {
    e.respondWith(caches.open(VERSION).then(async (c) => (await c.match(req)) || fetch(req).then((r) => (r.ok && c.put(req, r.clone()), r))));
    return;
  }
  if (url.pathname.startsWith("/api/")) return;

  // Sahifa: avval tarmoq, bo'lmasa kesh.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(VERSION).then((c) => c.put("/index.html", copy));
          return r;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Rasmlar, ikonkalar va kutubxonalar: keshdan darhol, fonda yangilash.
  if (/^\/(img|icons|vendor)\//.test(url.pathname)) {
    e.respondWith(
      caches.open(VERSION).then(async (c) => {
        const cached = await c.match(req);
        const network = fetch(req)
          .then((r) => (r.ok && c.put(req, r.clone()), r))
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Skriptlar, uslublar va ma'lumotlar: avval tarmoq (yangi versiya aralashib ketmasligi uchun), oflaynda kesh.
  e.respondWith(
    fetch(req)
      .then((r) => {
        if (r.ok) {
          const copy = r.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return r;
      })
      .catch(() => caches.match(req))
  );
});
