// Copies the Stockfish single-threaded engine artifacts out of the installed
// `stockfish` npm package and into public/engine so Vite can serve them at a
// stable URL (/engine/...). These files are large (a ~39MB NNUE net) and are
// regenerated from node_modules, so they live in .gitignore rather than git.
//
// Idempotent: skips files that already exist with a matching size.
import {
  existsSync,
  mkdirSync,
  statSync,
  copyFileSync,
  writeFileSync,
} from "node:fs";
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
  // GPL compliance: Stockfish is GPL-3.0, and we ship its compiled binary to the
  // browser. Place its license + a corresponding-source pointer next to the
  // engine so they deploy together (dist/engine/...). These are regenerated here
  // rather than committed, exactly like the engine files themselves.
  const licenseFrom = join(root, "node_modules", "stockfish", "Copying.txt");
  const licenseTo = join(outDir, "STOCKFISH-LICENSE.txt");
  if (existsSync(licenseFrom)) {
    if (
      !existsSync(licenseTo) ||
      statSync(licenseTo).size !== statSync(licenseFrom).size
    ) {
      copyFileSync(licenseFrom, licenseTo);
      console.log("[setup-engine] copied STOCKFISH-LICENSE.txt");
    }
  } else {
    console.warn("[setup-engine] Stockfish Copying.txt not found (skipping license)");
  }
  writeFileSync(
    join(outDir, "SOURCE.txt"),
    [
      "ChessRetabled bundles the Stockfish 16 chess engine (WebAssembly build).",
      "",
      "Stockfish is free software licensed under the GNU General Public License",
      "v3 (see STOCKFISH-LICENSE.txt in this folder).",
      "",
      "Complete corresponding source code:",
      "  - Stockfish engine:  https://github.com/official-stockfish/Stockfish  (Stockfish 16)",
      '  - WebAssembly build: https://github.com/nmrugg/stockfish.js  (npm "stockfish" 16.0.0)',
      "",
      "The engine files here (stockfish-nnue-16-single.js, .wasm, and the NNUE",
      "network nn-*.nnue) are distributed unmodified and remain under GPL-3.0.",
      "",
    ].join("\n")
  );

  console.log(
    `[setup-engine] done — ${copied} copied, ${skipped} already present in public/engine`
  );
}

main();
