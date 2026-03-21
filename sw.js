const CACHE_NAME = "play-for-autism-v11";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/about.html",
  "/store.html",
  "/events.html",
  "/donate.html",
  "/contact.html",
  "/confirmation.html",
  "/404.html",
  "/assets/css/style.css",
  "/assets/js/main.js",
  "/assets/js/store.js",
  "/favicon.svg",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});
