// ChessRetabled service worker — makes the installed app work offline.
//
// Strategy: network-first for navigations (a new deploy is picked up on the
// next online visit, with the cached shell as the offline fallback);
// cache-first for everything else (Vite assets are content-hashed, and the
// big Stockfish files — including the ~39 MB NNUE net — are pinned to the
// stockfish npm package version, so staleness isn't a practical concern).
//
// Registered only in production builds (see src/main.tsx). All URLs are kept
// relative to the registration scope so the GitHub Pages sub-path deploy
// (/ChessRetabled/) works unchanged.

const CACHE = "chessretabled-v1";
const SHELL = self.registration.scope; // ".../" — the SPA index

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(SHELL)) return;

  // SPA navigation: any route serves the (network-fresh) index shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(SHELL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL).then((hit) => hit ?? Response.error()))
    );
    return;
  }

  // Assets (hashed bundles, engine, fonts, icons): cache-first.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ??
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
