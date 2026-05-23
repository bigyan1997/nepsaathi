const CACHE_NAME = "nepsaathi-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add("/index.html")),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls, cross-origin requests, or non-GET requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // For SPA navigation requests, serve index.html from cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/index.html").then((r) => r || new Response("Offline", { status: 503 }))
      ),
    );
    return;
  }

  // For other same-origin assets, try network first then cache fallback
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((r) => r || new Response("Not found", { status: 404 }))
    ),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const { title, body, url } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/badge.svg",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        // Focus the existing window first; navigate() without focus() silently fails in some browsers
        existing.focus();
        existing.navigate(self.location.origin + url);
      } else {
        clients.openWindow(self.location.origin + url);
      }
    }),
  );
});
