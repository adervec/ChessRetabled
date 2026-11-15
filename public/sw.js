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

// Files that keep the same name across deploys *and* carry content that changes.
// Cache-first would pin the first copy a reader ever saw: whatsnew.json would
// show one update's notes forever, which is exactly what it exists not to do.
// (No CACHE bump needed for this: no existing cache holds whatsnew.json, and
// bumping would make every installed app re-download the ~39 MB NNUE net.)
const FRESH = /\/whatsnew\.json$/;

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

  // Network-first, with the cache as the offline fallback. `key` is what the
  // response is stored under: a navigation to any route caches the index shell.
  const freshFirst = (key) =>
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(key, copy));
        return res;
      })
      .catch(() => caches.match(key).then((hit) => hit ?? Response.error()));

  // SPA navigation: any route serves the (network-fresh) index shell.
  if (req.mode === "navigate") {
    event.respondWith(freshFirst(SHELL));
    return;
  }

  if (FRESH.test(new URL(req.url).pathname)) {
    event.respondWith(freshFirst(req));
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
