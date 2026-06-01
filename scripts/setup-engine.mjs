// Copies the Stockfish single-threaded engine artifacts out of the installed
// `stockfish` npm package and into public/engine so Vite can serve them at a
// stable URL (/engine/...). These files are large (a ~39MB NNUE net) and are
// regenerated from node_modules, so they live in .gitignore rather than git.
//
// Idempotent: skips files that already exist with a matching size.
import { existsSync, mkdirSync, statSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const srcDir = join(root, "node_modules", "stockfish", "src");
const outDir = join(root, "public", "engine");

// The single-threaded NNUE build + its evaluation net.
const FILES = [
  "stockfish-nnue-16-single.js",
  "stockfish-nnue-16-single.wasm",
  "nn-5af11540bbfe.nnue",
];

function main() {
  if (!existsSync(srcDir)) {
    console.warn(
      "[setup-engine] stockfish package not found in node_modules — run `npm install` first. Skipping."
    );
    return;
  }
  mkdirSync(outDir, { recursive: true });

  let copied = 0;
  let skipped = 0;
  for (const name of FILES) {
    const from = join(srcDir, name);
    const to = join(outDir, name);
    if (!existsSync(from)) {
      console.warn(`[setup-engine] missing source file: ${name} (skipping)`);
      continue;
    }
    if (existsSync(to) && statSync(to).size === statSync(from).size) {
      skipped++;
      continue;
    }
    copyFileSync(from, to);
    copied++;
    console.log(`[setup-engine] copied ${name}`);
  }
  console.log(
    `[setup-engine] done — ${copied} copied, ${skipped} already present in public/engine`
  );
}

main();
