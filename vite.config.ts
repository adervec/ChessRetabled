import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
// We use the single-threaded Stockfish build, which needs no SharedArrayBuffer
// and therefore no COOP/COEP cross-origin-isolation headers. That keeps the app
// trivially deployable to any static host. The engine files are vendored into
// public/engine by scripts/setup-engine.mjs.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
});
