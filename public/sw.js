/// <reference lib="webworker" />

const CACHE_NAME = "unitech-v1";
const STATIC_ASSETS = ["/", "/favicon.ico", "/unitech-logo.png"];

// Install: pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: stale-while-revalidate for images, network-first for API/navigation
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, etc.
  if (request.method !== "GET" || !url.protocol.startsWith("http")) return;

  // Supabase API / edge functions — always network
  if (url.hostname.includes("supabase.co") && !url.pathname.includes("/storage/")) {
    return;
  }

  // Images (including Supabase storage images): cache-first
  // Storage image URLs contain timestamps so cache-busting is built in.
  if (
    request.destination === "image" ||
    url.pathname.includes("/storage/v1/object/public/")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Navigation: network-first with cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/") || new Response("Offline", { status: 503 }))
    );
    return;
  }

  // JS/CSS assets: cache-first (hashed filenames)
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    url.pathname.match(/\.[a-f0-9]{8}\.(js|css)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }
});
