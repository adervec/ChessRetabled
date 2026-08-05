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
Four, Gomoku, Nine Men's Morris, Kōnane, Breakthrough, Surakarta, Fanorona, Lines
of Action, Hex, Tic-Tac-Toe) living **beside** the chess app, reachable at
`/games` (the "Games" nav item → `pages/Arcade.tsx`).

- **Adding a game is one `defs/*.ts` file + a registry line.** `Arcade.tsx`
  renders any `GameDefinition` generically (board via grid or `points` geometry),
  so obscure games drop straight in: Hex uses a generated rhombus of `points` with
  a 0–1 BFS completion heuristic; Surakarta simulates the corner-loop capture
  circuits with a loop-transition table; Fanorona enumerates approach/withdrawal
  capture chains as atomic moves (like checkers multi-jumps). When a game can run
  forever without progress (LOA, Surakarta, Fanorona) it carries a `ply` cap that
  draws — a `ponytail:` termination backstop, since `validate-games` requires
  random playouts to terminate.

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
- **Cloud sync (Google Drive)** (`state/cloud/`): a real `SyncAdapter` over the
  Drive REST API using the **GIS OAuth2 token model** (same approach as the
  GymTracker app) — `cloud/googleDrive.ts` requests only the `drive.appdata` scope
  (a private, hidden per-app folder) and keeps the whole `DataBundle` as one JSON
  file (`chessretabled-state.json`). The access token is **in memory only, never
  persisted**. Mirrors Tachyread's `syncProviders.js`, deliberately:
  - **Built-in OAuth client id** (`BUILTIN_GOOGLE_CLIENT_ID`), shared with
    Tachyread/GymTracker — Google authorises a client per **origin**, not per
    path, and all three deploy under `https://adervec.github.io`, so the
    registered origin already covers this app. Two gates: Google refuses it off
    a registered origin, and `driveOriginAllowed` refuses it app-side too, so a
    fork elsewhere gets a clear "supply your own id" instead of a confusing
    failure from Google. A user-supplied id always wins.
  - **Silent, then consent.** `ensureAccessToken(id, interactive)` tries
    `prompt:''` first (an existing grant + live session returns a token with no
    UI, which is what lets sync resume on boot) and only falls back to the
    consent popup when the call came from a click. `error_callback` goes in the
    GIS config, or a dismissed popup leaves the promise hanging forever.
  - **Resumable upload past 4 MB.** A simple upload caps at 5 MB and this bundle
    is not small — a thousand archived games carry their move lists.
  - `remoteStamp()` is the cheap change probe: one metadata query, no body. **Privacy-gated**: `cloud/policy.ts` (`chooseAdapterKind`) is the
  single chokepoint — cloud is OFF by default and nothing uploads until the user
  opts in, **consents**, and supplies an OAuth client id; otherwise the local
  mirror is used. `state/cloudConfig.ts` (persisted: provider/consent/clientId/
  account only) registers the adapter via `applyCloudConfig()` (app start + every
  change). Bring-your-own OAuth client id (an identifier, not a secret); the GIS
  script loads lazily only on connect. Pure pieces (gate, serialize/parse, LWW)
  covered by `scripts/validate-sync.mjs` — including the origin gate, and that
  a built-in client id does **not** remove the consent requirement. Easy
  sign-in must not become automatic sign-in. NB: TS **parameter properties** break
  Node type-stripping — assign fields explicitly in `.ts` constructors.

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
- Briscola **and Scopa** use the 40-card Italian deck + value tables in
  `cards/core/italian.ts`. 16 card games total, including **Cribbage** (own
  `scoring.ts` — countHand for the show, pegPoints for the play, verified by the
  perfect 29 hand; a `cribStep` drives all forced/AI transitions), **Durak**
  (36-card, trump, attack/defend), and **Euchre** (24-card partnership with
  bowers — `effSuit`/`strength` model the right/left bower, `euchreStep` drives
  the three AI seats; bidding incl. order-up/dealer-discard/stick-the-dealer).
  Multi-seat games with bidding/pegging expose a `*Step(state)` reducer that
  advances one AI/forced action so the UI only prompts on the human's decisions.

## Logic Lab (`src/logic/`)

Single-player deduction puzzles at `/logic` (`pages/Logic.tsx`), separate from the
opponent-based games. Same discipline — pure logic in `.ts`, verified headlessly by
`scripts/validate-logic.mjs` (in CI).
- **Sudoku** (`sudoku.ts`): randomized-backtracking generator that removes clues
  only while a `countSolutions(…, 2)` check keeps the solution unique; `solve`,
  `isValidComplete`, and `conflicts` back the UI. Difficulty = clue count.
- **Mastermind** (`mastermind.ts`): `feedback` (black/white pegs) + a
  consistency-filter solver. The harness proves the solver always cracks ≤10.
- **Loop/path puzzles** share one trick: a loop on a grid is the boundary of an
  inside region, so **Slitherlink** and **Masyu** generate by growing a
  simply-connected region and verify uniqueness with a face-colour backtracker
  (Masyu adds white=straight / black=turn pearl constraints). **Nurikabe** (island
  /sea shading, sea-connectivity kept as a generation invariant), **Bridges**
  (edge-degree island solver), **Tents** (row/col counts + a tent↔tree matching),
  and **Numberlink** (edge-degree path cover, Hamiltonian-cut generation, lax/flow
  rules with a path-drawing UI) round out the set. Each puzzle is a `generate`/
  `countSolutions`/`isSolved` module + a `.tsx`; the loop/path ones use bespoke
  segment- or path-drawing UIs rather than the shading grid.

## PWA, hints, archetype & coach

- **PWA**: `public/manifest.webmanifest` uses **relative URLs** (`./`) so the
  Pages sub-path needs no build-time templating; `public/sw.js` is network-first
  for navigations (new deploys win) and cache-first for assets/engine (offline
  play, the NNUE included). Registered in `main.tsx` **PROD-only**. Bump the
  `CACHE` name in sw.js when cache semantics change. Icons are SVG-only
  (`favicon.svg` + `icon-maskable.svg`); no PNG fallback by design.
- **Progressive hints**: convention is *nudge → reveal*; any press sets a sticky
  `hintUsed`, and finished games log `assisted: true` on the `GameRecord`
  (optional field, no storage-key bump). Implementations: `useGenericGame`
  (`requestHint`/`hintCells`/`hintNote`, search at the game's strongest
  difficulty with randomness 0 — covers all 12 board games), `useBotGame`
  (`Hint.stage`, engine bestMove — covers Play + Practice), per-component wiring
  in cards (shared `cards/ui/useCardHint.ts`; War/Old Maid/Memory skipped — no
  meaningful decision) and logic (solutions are already stored on each puzzle,
  so hints never re-solve). Puzzles keep their pre-existing hint → "not clean"
  rating path. Simul deliberately has no hints.
- **Archetype** (`state/archetype.ts`): pure, total function DashboardData →
  archetype (first-match rule chain; `ARCHETYPE_IDS` is the closed id set).
  **Coach** (`state/coach.ts` + `pages/Coach.tsx`, route `/coach`): builds a
  markdown coaching brief from stats+archetype+progress; optional live chat
  POSTs directly to the Anthropic Messages API with a user-supplied key
  (in-memory only, explicit consent checkbox, CORS via the
  `anthropic-dangerous-direct-browser-access` header). Both pure modules are
  covered by `validate-stats.mjs` (archetype totality fuzz + brief
  no-`undefined` smoke).

## Review, sessions & the abandon policy

- **`/review` (`pages/Review.tsx`) is the only place games are looked at again.**
  Two tabs: your archive (filter by category/game; delete one match, one game,
  one category or everything) and the seeded library.
- **`src/review/` rates moves on one scale everywhere: the share of winning
  chances given up (0–1), turned into a verdict by `rate.ts`.**
  - chess → engine eval before/after each ply through the logistic in
    `winChance`; a second search only on bad moves, to say what was better.
  - board → **the game's own engine at full strength is the referee**
    (`refereeFor`). Three attempts to get here: a private depth-2 search called
    the shipped AI's own Reversi openings blunders; depth-5 cost 4m26s and still
    disagreed on Hex/LOA. Judging a player with a weaker judge is the bug, and
    chess-calibrated thresholds don't transfer to a differently scaled quantity.
    Don't reintroduce a bespoke search here.
  - logic → each entry vs the generator's unique solution. `useSolveTrace`
    watches the puzzle's working array and derives the log from state changes —
    one line per puzzle instead of instrumenting every click handler, which is
    how all 25 got covered. Where a puzzle keeps its answer in another shape
    (loops, paths), entries are recorded and marked **unverifiable** rather than
    guessed at; Mastermind rates a guess on consistency with its own feedback,
    Slide on whether a tile reached home.
  - cards → refused on purpose: hidden deal, so per-move verdicts are guesswork.
- **`state/cowork.ts`** builds the markdown brief (copy / download / take to
  Coach). Pure string building — nothing leaves the device unless the user sends it.
- **`content/famous.ts`** is the library; `validate-famous.mjs` replays every
  chess move list through chess.js and confirms claimed mates, so a mistyped SAN
  fails the build. Non-chess entries are `kind: "note"` — solved-game results and
  theory, not invented games.
- **Sessions (`state/useSessions.ts`)**: an unfinished game is written as you
  play and offered back by the bottom bar (`components/ui/SessionBar.tsx`).
  **Device-local on purpose** — absent from `dataTransfer.ts` and the cloud
  bundle, because a half-finished game is a fact about this device; only the
  resolved record syncs. Three wirings, one per shape: `useGameSession` (chess +
  the 12 board games, which have a move log to count), `logic/ui/useLogicSession`
  (all 25 puzzles, counting entries), and `cards/ui/useCardSession` (all 18 card
  games from the lobby — their state lives inside each component, so time at the
  table is the engagement signal instead of a move count).
- **Resume rebuilds the position, it doesn't just reopen the screen.**
  `games/core/replay.ts` `foldMoves()` folds a logged move list back into a
  state, stopping at the first move the current rules reject rather than
  inventing the rest; `useGenericGame` and the review scrubber both use it, and
  `useChessGame` does the same with SAN. `validate-sessions` plays each game,
  then proves the resumed board matches the played one **at every ply**.
- **`state/abandon.ts`** decides what leaving costs: under 4 moves *and* 90s it
  is a misclick and nothing is recorded; a solo puzzle is logged `abandoned`,
  never a loss (or the solo win rate means nothing); a versus game you were
  actually playing is a resignation. Covered by `validate-sessions.mjs`.
- **Academy absorbed Learn.** `/learn` redirects to `/academy`, which lists the
  chess curriculum and the game paths together. `/learn/:courseId/:lessonId`
  still serves the player. `/puzzles` points at the Logic Lab, the board-game
  challenges and the drills, so "puzzles" means all of them.

## Brand & landing page

- **The mark is `<category icon>Retabled`**, not a knight: `NavBar.brandIcon()`
  maps the route to ♟ / 🎲 / 🃏 / 💡 and falls back to a neutral ▦, `Logo` takes
  an `icon` prop and renders the badge (`.brandmark`) plus the "Retabled"
  wordmark. The knight SVG survives as `KnightLogo` for the icon-less case.
- **`pages/Home.tsx` is category-agnostic** — four equal wings built from
  `CATEGORY_ORDER` with counts derived from `CATALOG` (so a new game updates the
  page for free), agnostic stats (played / tried / streak / level, not puzzle
  rating and bot record), and the chess-specific modes demoted to the `.home__more`
  chip row. Don't reintroduce a chess-first hero.

## Nav, sound & "What now?"

- **NavBar** keeps only the first four links in the bar; **all twelve live in the
  ☰ dropdown** (`.nav__menu`, fixed panel under the bar, `hidden` when closed,
  scrollable, scrim + Escape to close). Twelve labelled pills needed ~1750px of
  bar and used to shove the menu button off-screen — don't put links back inline.
- **Sound** (`state/sfx.ts`): oscillator-synthesised cues, **no audio assets** —
  one lazy `AudioContext`, a `VOICES` table of note/duration/gain, a 40 ms
  same-cue throttle, and a master trim × the user's volume. Gated on
  `useSettings.sound` (on by default) + `volume`. Four wire points cover the
  whole app: `useChessGame.move` (chess everywhere), `useGenericGame.commit` +
  select/hint (12 board games), `cards/ui/PlayingCard` onClick (all card games),
  and **`useArchive.add`** (every mode's end-of-game fanfare). `installUiSfx()`
  in `App.tsx` is one delegated listener giving `.btn/.chip-btn/a[href]` a click
  cue; game surfaces are excluded on purpose (they have specific sounds).
- **`state/suggest.ts`** — pure `suggestActivities(DashboardData, {lessons,
  streak, now, seed})` → 3 `Suggestion`s from a fixed rule set (streak nudge,
  momentum, needs-work, never-tried, dropped, next lesson, favourite). `seed`
  **rotates** the list so "🎲 Something else" walks all rules instead of
  reshuffling. Rendered by `components/ui/WhatNow.tsx` on Home + Dashboard.
  Covered by `validate-stats.mjs` (shape, rule triggers, 200-archive totality).

## The app owns its scrolling

- **`html`/`body` are `overflow: hidden`; `.app-shell` is `height: 100dvh`; the
  scroll lives on `main.grow`** (`overflow-y: auto; min-height: 0`). Letting the
  *document* scroll on a phone gives the browser chrome a vote in the layout —
  the URL bar retracts, `height: 100%` resolves against a viewport that is no
  longer there, and the nav ends up half off the top of the screen. That was the
  reported bug; `min-height` on the shell is what to avoid reintroducing.
- The nav and the session bar are **flex rows of the shell**, not `sticky`/`fixed`
  overlays, so neither can be scrolled away or cover the end of a page.
- **`App.tsx` resets `main.scrollTop` on navigation** — the document scroll used
  to do that for free.
- **Scrollbars are therefore all ours, and all themed**: `scrollbar-color` plus
  the `::-webkit-scrollbar*` rules at the end of `global.css`, built from tokens
  so they re-skin with everything else. Don't hardcode a colour there.
- `validate-responsive.mjs` covers every one of these, and the negative control
  (putting `min-height: 100%` back) was checked to fail.

## Mobile vs desktop (`src/styles/responsive.css`)

- **Width picks the layout, `(pointer: coarse)` / `(hover: none)` pick the
  interaction.** Boards were already fluid (`width:100%` + `max-width:
  var(--board-max)`), so this sheet only fixes what width alone can't.
- **Portrait/landscape is per game, not the accelerometer.**
  `state/orientation.ts` (pure) owns the decision: `resolveLayout()` takes the
  game's pin (`useSettings.gameOrientation[id]`) → the app-wide
  `useSettings.orientation` → **`logicalOrientation(id)`** → and only with *no*
  game open, the device. `state/activeGame.ts` holds which game is on screen
  (`useActiveGame(id)`, called by the 8 game screens); `App.tsx` is the single
  writer of `<html data-orient>`. The nav's `LayoutToggle` pins the current game.
  - `logicalOrientation` is derived, not tabled: a board game answers from its
    own geometry — **square board → `landscape`** (it's height-bound on a wide
    screen, so the spare width takes the panel), **wide board → `portrait`** (the
    board wants that width). Cards: only the seven-column tables are `portrait`.
  - There must be **no `@media (orientation: …)` in the CSS** — that would flip
    the layout behind the user's choice. `validate-responsive.mjs` fails on one;
    `validate-orientation.mjs` proves the device can't change a game's layout in
    any pin state (56 games × 4 pins × 3 globals).
- **Boards are capped on both axes.** `--board-max: min(100%, calc((100dvh -
  <chrome>) / 1.12))` — width-only caps let boards spill off short screens *and*
  kept them at 560px when there was room. The `/1.12` is `.board3d-scene`'s
  `padding-top`.
- **`touch-action: none` on the board surface** (`.board3d`, `.gboard3d`,
  `.gpoints__svg`). `manipulation` still hands drags/pinches to the browser, so
  touching a piece scrolled the page instead of moving it. Everything else keeps
  `manipulation`.
- **It is imported LAST in `main.tsx`** (below `App`, below `global.css`) because
  most of its rules beat the per-page sheets on source order, not specificity.
  `scripts/validate-responsive.mjs` greps the built CSS and fails if that order
  breaks or a rule goes missing — run it after `npm run build`.
- What it covers: hover-lift resets on touch (`:hover` latches to the last tap),
  44px tap targets, `touch-action: manipulation` (kills the double-tap delay
  *without* disabling pinch-zoom — the viewport meta allows zoom on purpose),
  safe-area insets, `100dvh` for the nav menu, and the landscape layout
  (stacking a board + panel on a short screen pushes the board off it, so they
  stay side-by-side with `--board-max: min(62vh, 58vw)`).
- **Card tables scale, they don't reflow.** Each card game sets `--card-w` inline
  in px (52–84px, desk-sized); `.cardtable` derives **`--cw: calc(var(--card-w) *
  var(--card-scale))`** and *everything that reserves card-sized space must use
  `--cw`* — slots, min-heights, pile overlaps, fan offsets. A raw `var(--card-w)`
  leaves that slot at its desktop footprint while the card inside shrinks;
  `validate-responsive.mjs` fails on one. `responsive.css` steps `--card-scale`
  down (0.85 → 0.7); the floor is legibility, so the 7-column tableaux fit by
  taking the grid column's width instead of shrinking further.
- **Overlaps are fractions, never px.** Klondike (`-0.81` / `-0.62` × `--cw`),
  Golf (`-0.7`), Pyramid (`-0.54`) and the Crazy Eights fan (`-0.61`) used fixed
  px, which at phone sizes covered the whole card — a pile of unidentifiable
  slivers. The visible strip must stay above the index baseline (`y=53` of the
  140-unit viewBox, i.e. `0.53 × --cw`).
- **The corner index is the card.** In an overlapped pile or a fan it's all you
  can see, so `PlayingCard`'s index is sized in viewBox units (24/100 of the card
  width, up from 17) and the centre pip gave up room for it.

## Game guides (`src/content/guides/`)

- **One deep Markdown guide per game**, filename = the catalog/`GameRecord.gameId`
  (`chess.md`, `nine-mens-morris.md`, `sudoku.md`, …). They are **standalone files**
  ("separately readable") *and* rendered in-app ("integrated"). Adding a guide is
  literally dropping a `<id>.md` in this folder.
- `content/guides.ts` globs them with Vite's `import.meta.glob("./guides/*.md",
  { query: "?raw", import: "default", eager: true })`, keys by filename→id, and
  reuses `src/catalog.ts` for grouping/order. The H1 (`# …`) is the title.
- `components/ui/Markdown.tsx` is a **hand-rolled** md→React renderer (headings,
  lists, tables, blockquotes, fenced code, inline bold/italic/code/links) — no
  markdown dependency, no `dangerouslySetInnerHTML`. It covers the guide subset;
  swap in a lib only if guides need full GFM.
- `pages/Guide.tsx` renders the library at `/guide` (search + category sections
  from `guideLibrary()`) and a single deep-linkable guide at `/guide/:id` (prev/
  next via `GUIDE_ENTRIES`, a "▶ Play" jump to the game's catalog `path`). Entry
  points: the **Guides** nav item, a header link in each lobby (Play/Cards/
  Games/Logic), and a per-game "📖 Full guide" link on the board-game setup screen.
- Guides follow one skeleton (What it is / Goal / setup / Rules / **How it works
  in ChessRetabled** / Strategy Beginner→Advanced / Traps / worked example /
  Glossary / Where to go next). Keep the "How it works" section accurate to the
  app (difficulty tiers, the 💡 nudge→reveal hint + assisted flag, seeded decks,
  unique-solution generators, archive logging).

## Gotchas

- The dev **preview/screenshot tooling was flaky** in this environment
  (screenshot capture timed out service-wide). Verify via DOM/`eval` instead.
- Reusable game loop: `useChessGame` (state) → `useBoardController` (selection/
  promotion) → feature hooks (`useBotGame`, `usePuzzle`). All four modes share it.
