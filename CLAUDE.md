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
- `node scripts/validate-games.mjs` — exercise the combinatorial-games suite
  (rules, terminal detection, AI legality + tactics). Same `.ts`-import trick.

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

## CI/CD (`.github/workflows/`)

- `ci.yml` (PRs to `main` + pushes to non-`main` branches): `npm ci` → typecheck
  → `validate-lessons.mjs` → **puzzle drift check** (re-run `build-puzzles.mjs`
  and fail if `puzzles.generated.json` changes — enforces "derive, don't
  hand-edit") → build. Runs on **Node 24** (the content scripts need
  type-stripping). `main` is skipped here — it's covered by deploy.
- `deploy.yml` (push to `main` / manual): validate → build → **GitHub Pages**.
  One-time: set repo Pages source to "GitHub Actions". Ships an SPA `404.html`
  (copy of `index.html`) so deep links survive a refresh.
- **Sub-path base** — Pages serves at `/<repo>/`, so `deploy.yml` builds with
  `BASE_PATH=/<repo>/`. `vite.config.ts` reads it into `base`; everything else
  derives from `import.meta.env.BASE_URL` (= `base`): router `basename`
  (`main.tsx`), favicon (`index.html`, via Vite's `%BASE_URL%`), and the
  Stockfish worker URL (`engine/stockfish.ts`; its `.wasm`/`.nnue` resolve
  relative to the worker). **Don't hardcode root-absolute asset URLs** (`/foo`) —
  they skip the base prefix and 404 on Pages. Dev/`build` without `BASE_PATH`
  stay at `/`.

## Combinatorial games (`src/games/`)

A self-contained suite of perfect-information games (Checkers, Reversi, Connect
Four, Gomoku, Nine Men's Morris, Tic-Tac-Toe) living **beside** the chess app,
reachable at `/games` (the "Games" nav item → `pages/Arcade.tsx`).

- **All original code, no new dependencies.** Nothing is pulled in for these
  games, so the GPL-3.0 licensing story is unchanged — `THIRD-PARTY-NOTICES.md`
  needs no additions. (This was the deliberate choice over bundling
  Fairy-Stockfish/`ffish.js` etc.: those are GPL-compatible but would add a WASM
  download; the self-written route keeps the static client-side build trivial.)
- **One abstraction, many games.** `core/types.ts` defines `GameDefinition<S>`
  (immutable state, `legalMoves`/`applyMove`/`status`/`evaluate`, render metadata).
  `core/ai.ts` is a generic negamax + alpha-beta with iterative deepening and a
  per-move time budget — the same shape as the chess `MinimaxEngine`, but
  game-agnostic. Add a game = write one `defs/*.ts` and list it in `registry.ts`.
- **Logic is `.ts`, UI is `.tsx`.** `defs/` + `core/` carry only data + pure
  logic and cross-import with **explicit `.ts` extensions**, so
  `scripts/validate-games.mjs` can import and test them headlessly under Node 24
  type-stripping (JSX can't be stripped, so definitions never touch `.tsx`).
- **Generic UI.** `ui/GameBoard.tsx` renders both geometries — `"grid"` (square
  boards) and `"points"` (SVG node-and-line boards, e.g. Morris).
  `ui/useGenericGame.ts` owns interaction: `"place"` vs `"select"` (per-turn via
  `interactionFor`, since Morris alternates), plus a generic capture-pick step
  driven by a move's optional `remove` field. The AI runs on the main thread
  behind a `setTimeout` yield (like the chess fallback); time budgets are capped.

## Presentation, settings & data (added in the expansion)

- **Settings** (`state/useSettings.ts`, persisted): `theme` (`dusk` default /
  `pastel` / `croanada`), `animSpeed`, `boardTilt`. App.tsx reflects them onto
  `<html data-theme>` and the `--anim-dur` CSS var. Chrome/board/card colours are
  pure token overrides in `tokens.css` (`:root[data-theme="…"]`) incl. `--felt`.
- **Themed pieces** (`theme/pieces.ts`): chess SVGs (`PieceArt`) and arcade tokens
  (`GamePiece`) recolour per theme. A theme may supply a `light`/`dark` piece pair;
  each game's two sides map to it **by luminance** (so the lighter side stays light
  and only the hue changes). Dusk has no entry → native per-game colours; Pastel
  and Croanada fully reskin (Croanada = snow white vs maple red).
- **Animation**: the generic board animates via stable-id tokens (`ui/boardView.ts`
  `Token`), reconciled in `useGenericGame`; CSS transitions read `--anim-dur`.
  Captures fall into a rendered graveyard. The computer never replies instantly —
  `aiThinkFloorMs(animSpeed)` floors its move to ≥ one animation.
- **Archive / data** (`state/useArchive.ts`): every finished game (chess + arcade +
  simul + cards + logic) is logged with its full move list. `state/dataTransfer.ts`
  does one-bundle JSON export/import; `state/sync.ts` is the cloud-sync seam (a
  `SyncAdapter` + a local-mirror impl + `syncNow()` last-write-wins).
- **Dashboard** (`pages/Dashboard.tsx`, `/dashboard`): a cross-game summary.
  `catalog.ts` flattens chess + board + cards + logic into one id-keyed list
  (category + `solo`/`versus` kind, keyed to `GameRecord.gameId`); `state/stats.ts`
  is a **pure, time-injectable** aggregator over the archive (played/untried, win
  rate, streak, favourite, per-category, 14-day sparkline, recency/frequency).
  Verified by `scripts/validate-stats.mjs`. Logic-puzzle metadata now lives in the
  shared `logic/registry.ts` (used by both the lobby and the catalog).
- **Cloud sync (Google Firestore)** (`state/cloud/`): a real `SyncAdapter` over the
  Firestore REST API (`cloud/firestore.ts`, whole bundle as one JSON doc field) +
  a Google Identity sign-in seam (`cloud/googleAuth.ts`). **Privacy-gated**:
  `cloud/policy.ts` (`chooseAdapterKind`) is the single chokepoint — cloud is OFF
  by default and nothing uploads until the user opts in, **consents**, and supplies
  a project id + API key; otherwise the local mirror is used. `state/cloudConfig.ts`
  (persisted; never stores the short-lived Bearer token) builds + registers the
  adapter via `applyCloudConfig()` (called on app start + on every config change).
  Bring-your-own Firebase project (web API key is public; lock with Firestore
  rules). Pure pieces (gate, encode/decode, JWT, LWW) covered by
  `scripts/validate-sync.mjs`. NB: TS **parameter properties** break Node
  type-stripping — assign fields explicitly in `.ts` constructors.

## More modes & content

- **Simul** (`pages/Simul.tsx`, `games/simul/`): a simultaneous exhibition over an
  arbitrary mix of chess + arcade boards. `ChessSlot` uses a **per-slot
  MinimaxEngine** (not the shared Stockfish worker, to avoid contention);
  `GenericSlot` uses the games framework. "Next board needing you" rotates focus.
- **Games Academy** (`pages/Academy.tsx`, `games/learn/`): a learning path per game
  (concept text + interactive challenges). `useLessonPosition` implements the same
  `BoardView` surface so the standard board renders tutorials. Challenge setups +
  answers are verified by `scripts/validate-game-lessons.mjs` (in CI).
- The chess curriculum in `content/lessons.ts` is the other learning track (9
  courses); its `move` steps are verified by `scripts/validate-lessons.mjs`.

## Card games (`src/cards/`)

A second wing alongside the board games, reachable at `/cards` (the "Cards" nav
item → `pages/Cards.tsx`, a lobby that dispatches to a per-game component).

- **Seeded, not deterministic-perfect-info.** Card games have hidden hands and
  randomness, so unlike the board framework there's no single `GameDefinition`
  or shared minimax. Instead: a shared `core/` (cards, `rng.ts` mulberry32 +
  shuffle, scoring helpers) and a `ui/` toolkit (cel-shaded `PlayingCard`). Each
  game has its own pure **logic** module + heuristic AI policy, and its own play
  component. Seeding (every game derives its deck from a seed) keeps games
  reproducible and archivable.
- **Logic is `.ts`, UI is `.tsx`** — same rule as the board games: logic modules
  cross-import core with **explicit `.ts` extensions** so
  `scripts/validate-cards.mjs` can drive them headlessly (AI-vs-AI / policy sims
  checking legality, termination, scoring, and 52-card conservation). In CI.
- **Games (11):** Klondike Solitaire, Blackjack, Crazy Eights, Hearts, Five-Card
  Draw + Texas Hold'em (sharing `poker/eval.ts`, a 5-card evaluator; Hold'em adds
  best-5-of-7), Gin Rummy (`gin/melds.ts` is an exact deadwood/meld optimiser via
  bitmask set-packing), Go Fish, Memory, War, Old Maid. AI seats move on a
  watchable delay (`aiThinkFloorMs`); finished games log to the shared `useArchive`.
- Two reusable cores worth knowing: `poker/eval.ts` (hand ranking) and
  `gin/melds.ts` (`bestMeld`/`bestDiscard`) — both heavily covered by the harness.
- Briscola (Italian trick-taking) uses the 40-card Italian deck + value tables in
  `cards/core/italian.ts`; 12 card games total. (Scopa is a natural next add on the
  same deck.)

## Logic Lab (`src/logic/`)

Single-player deduction puzzles at `/logic` (`pages/Logic.tsx`), separate from the
opponent-based games. Same discipline — pure logic in `.ts`, verified headlessly by
`scripts/validate-logic.mjs` (in CI).
- **Sudoku** (`sudoku.ts`): randomized-backtracking generator that removes clues
  only while a `countSolutions(…, 2)` check keeps the solution unique; `solve`,
  `isValidComplete`, and `conflicts` back the UI. Difficulty = clue count.
- **Mastermind** (`mastermind.ts`): `feedback` (black/white pegs) + a
  consistency-filter solver. The harness proves the solver always cracks ≤10.

## Gotchas

- The dev **preview/screenshot tooling was flaky** in this environment
  (screenshot capture timed out service-wide). Verify via DOM/`eval` instead.
- Reusable game loop: `useChessGame` (state) → `useBoardController` (selection/
  promotion) → feature hooks (`useBotGame`, `usePuzzle`). All four modes share it.
