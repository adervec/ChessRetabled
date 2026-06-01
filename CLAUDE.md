# ChessRetabled — architecture notes

Cel-shaded chess app: Play vs bots, Puzzles, Lessons, Practice. React 18 + TS +
Vite, chess.js, Stockfish 16 WASM, zustand. See README.md for the user-facing
overview; this file captures the non-obvious decisions.

## Commands

- `npm run dev` / `build` / `preview` — pre/post hooks vendor the engine first.
- `npm run typecheck` — `tsc --noEmit` (single config, **no project references**;
  `tsc -b` was dropped because the composite node config rejected `noEmit`).
- `node scripts/build-puzzles.mjs` — regenerate `src/content/puzzles.generated.json`.
- `node scripts/validate-lessons.mjs` — validate interactive lesson moves.
  (Both scripts import the `.ts` content directly via Node 24 type-stripping.)

## The 2.5D board (`src/components/board/`)

- `.board3d` is a flat CSS grid with `transform: rotateX(46deg)` and
  `transform-style: preserve-3d`. Pieces are positioned on the plane, then their
  SVG sprite is **counter-rotated** (`rotateX(-tilt)`, origin bottom) so they
  stand upright. A flat contact-shadow ellipse grounds each one.
- **Keep compositing light.** Per-sprite `will-change`/`filter: drop-shadow` and
  `mix-blend-mode` were removed — 32 composited layers tanked performance and
  broke headless screenshots. Don't reintroduce them.
- **Click routing:** square cells own the click handlers; piece sprites use
  `pointer-events` to route a click to the piece's own square. Legal-move target
  dots render above pieces and are clickable so moves always land.
- Pieces carry **stable ids** (tracked through captures, en passant, castling,
  promotion in `useChessGame`) so moves animate via CSS transitions instead of
  teleporting. Don't key pieces by square.
- `fenToPlaced()` in `chess/types.ts` renders *static* boards (e.g. a lone knight
  with no kings) without chess.js, which rejects kingless FENs.

## Engine (`src/engine/`)

- `StockfishEngine` wraps the **single-threaded** build (`public/engine/
  stockfish-nnue-16-single.*` + the `nn-*.nnue` net). Single-threaded ⇒ no
  SharedArrayBuffer ⇒ no COOP/COEP headers ⇒ trivially deployable.
- Engine files are **gitignored** and regenerated from `node_modules/stockfish`
  by `scripts/setup-engine.mjs`. The NNUE net alone is ~39 MB.
- `GameEngine` (singleton via `getEngine()`) prefers Stockfish and falls back to
  `MinimaxEngine` if it can't load or dies mid-session — so Play never breaks.
- Bot strength: sub-1320 uses Stockfish "Skill Level"; ≥1320 uses `UCI_Elo`.
  Weak bots add random blunders on top (`content/bots.ts` + `engine/bot.ts`).

## Content correctness

- Puzzles are **derived, not hand-typed**: `build-puzzles.mjs` finds mating moves
  by scanning for checkmate and proves forced mate-in-2 by search. Mate-in-2
  puzzles store first-move `keys`; the player auto-plays any legal opponent reply
  then accepts any mating move.
- Add candidate FENs to `build-puzzles.mjs` and re-run; invalid ones are excluded
  and logged. Don't hand-edit `puzzles.generated.json`.

## Progress

- `useProgress` (zustand + persist) → localStorage key
  `chessretabled.progress.v1`. Bump the key name on breaking shape changes.

## Gotchas

- The dev **preview/screenshot tooling was flaky** in this environment
  (screenshot capture timed out service-wide). Verify via DOM/`eval` instead.
- Reusable game loop: `useChessGame` (state) → `useBoardController` (selection/
  promotion) → feature hooks (`useBotGame`, `usePuzzle`). All four modes share it.
