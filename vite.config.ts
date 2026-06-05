import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
// We use the single-threaded Stockfish build, which needs no SharedArrayBuffer
// and therefore no COOP/COEP cross-origin-isolation headers. That keeps the app
// trivially deployable to any static host. The engine files are vendored into
// public/engine by scripts/setup-engine.mjs.
//
// `base` defaults to "/" (root-hosted) but can be overridden via the BASE_PATH
// env var for sub-path hosting. The GitHub Pages deploy builds with
// BASE_PATH=/<repo>/ so assets and routes resolve under the project subpath;
// `import.meta.env.BASE_URL` then feeds the router basename (see src/main.tsx).
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
});
