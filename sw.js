const CACHE_NAME = "play-for-autism-v12";
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
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});
