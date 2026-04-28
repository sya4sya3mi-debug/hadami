const CACHE_NAME = "hadami-v12";

// Pre-cache the start URL and critical fonts on install
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        "/",
        "/fonts/YakuHanJPs/YakuHanJPs-Regular.woff2",
        "/fonts/YakuHanJPs/YakuHanJPs-Bold.woff2",
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip cross-origin requests and most API routes
  if (
    e.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    e.request.url.includes("supabase.co") ||
    e.request.url.includes("unpkg.com") ||
    e.request.url.includes("cdn.jsdelivr.net")
  ) {
    return;
  }

  // Cache-first for image proxy (optimized Rakuten images)
  if (url.pathname.startsWith("/api/image-proxy")) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Skip other API routes
  if (e.request.url.includes("/api/")) {
    return;
  }

  // For Next.js static assets (_next/static): cache-first (immutable hashed files)
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // For HTML pages: network-first (always get fresh HTML), fall back to cache
  if (e.request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // For other assets (images, icons, manifest): cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
