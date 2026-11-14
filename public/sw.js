const PREFIX = "sky-strike-rio-" + self.registration.scope + "-";
const CACHE = PREFIX + "v2";
const CORE = [
  "./",
  "./index.html",
  "./assets/rio/route-upper.webp",
  "./assets/rio/route-lower.webp",
  "./assets/rio/mountain-finale.webp",
  "./assets/brazil/amazon.webp",
  "./assets/brazil/pantanal.webp",
  "./assets/brazil/brasilia.webp",
  "./assets/brazil/iguacu.webp",
  "./assets/brazil/atlantic.webp",
  "./assets/hangar/brazil-hangar.webp",
  "./manifest.webmanifest",
  "./icons/sky-strike.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(PREFIX) && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== location.origin
  )
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE).then((cache) => cache.put(event.request, copy)),
          );
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then(
            (response) =>
              response ||
              new Response("Recurso não disponível offline", { status: 503 }),
          ),
      ),
  );
});
