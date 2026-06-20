# ♞ ChessRetabled

A **cel-shaded chess club** in the browser. Play smart bots, climb an interactive
lesson curriculum, and crack tactics puzzles — all on a 2.5D board that pops off
the table.

![mode: Play • Puzzles • Learn • Practice](https://img.shields.io/badge/modes-Play%20%C2%B7%20Puzzles%20%C2%B7%20Learn%20%C2%B7%20Practice-9b6bff)

## Features

- **🎨 2.5D cel-shaded board** — a flat board tilted in CSS 3D perspective with
  upright, hand-built cel-shaded piece sprites (bold ink outlines, flat color
  fills, hard-edged shading, team-colored bases).
- **♟ Play vs Bots** — a roster of **12 characters** from a 250-rated hatchling
  to a 2850 grandmaster, powered by **Stockfish 16 (WASM)** with a built-in
  minimax AI fallback so play never breaks. Move list, eval bar, hints,
  takebacks, resign, draw offers, and rematches.
- **🧩 Tactics Puzzles** — **37 validated puzzles** (mate-in-1, mate-in-2, and
  tactical motifs) with rated training, themed sets, hints, and a personal
  puzzle rating. Every solution is *derived and verified* with chess.js, so the
  content is correct by construction.
- **🎓 Lessons** — **5 courses / 16 interactive lessons** from "how the knight
  moves" to endgame technique, mixing explanation with hands-on guided moves.
- **🎯 Practice Arena** — endgame drills (K+Q vs K, K+R vs K, two rooks, king &
  pawn, back-rank) played against the engine, with success/stalemate detection.
- **📈 Progress** — a localStorage-backed profile: level/XP, puzzle rating, day
  streak, win/loss record, lesson stars, and drills mastered.

## Tech stack

- **React 18 + TypeScript + Vite**
- **chess.js** — move generation, validation, and game state
- **Stockfish 16** (single-threaded WASM build) behind a clean engine interface
- **zustand** — persistent progress store
- **react-router** — navigation
- Plain CSS design system (cel-shaded tokens, no UI framework)

## Getting started

```bash
npm install          # also vendors the Stockfish engine into public/engine
npm run dev          # start the dev server (http://localhost:5173)
npm run build        # type-check + production build
npm run preview      # preview the production build
```

> **Note on the engine:** the Stockfish artifacts (including a ~39 MB NNUE
> evaluation net) are large, so they are **not** committed to git. They are
> copied out of the installed `stockfish` npm package into `public/engine/` by
> `scripts/setup-engine.mjs`, which runs automatically on `postinstall`,
> `predev`, and `prebuild`. If the engine ever fails to load, the app
> transparently falls back to a built-in minimax AI.

## Content is validated, not hand-typed

Chess content is easy to get subtly wrong, so it's generated and checked:

```bash
node scripts/build-puzzles.mjs     # derive + validate the puzzle set
node scripts/validate-lessons.mjs  # validate every interactive lesson move
```

- `build-puzzles.mjs` finds mating moves by scanning legal moves for checkmate
  and proves forced mate-in-2 with a small search — anything that doesn't
  validate is excluded and reported.
- `validate-lessons.mjs` confirms every lesson's FEN is legal, the side-to-move
  matches, and each accepted answer is a legal move.

## Project structure

```
src/
  chess/        chess.js wrapper, board controller, game/puzzle/bot hooks, types
  engine/       Stockfish UCI worker, minimax fallback, unified engine, bots
  components/   board (2.5D + cel-shaded pieces), game UI, play UI, nav, brand
  content/      bots, puzzles (generated), lessons, drills
  pages/        Home, Play, Puzzles, Learn, LessonPlayer, Practice, Profile
  state/        persistent progress store (zustand)
  styles/       design tokens + global cel-shaded styles
scripts/        setup-engine, build-puzzles, validate-lessons
```

## Deploying

Two GitHub Actions workflows live in `.github/workflows/`:

- **`ci.yml`** — on pull requests to `main` and pushes to other branches:
  type-checks, validates lesson content, verifies the generated puzzle set is in
  sync (re-runs `build-puzzles.mjs` and fails if the committed JSON drifts), and
  runs a production build.
- **`deploy.yml`** — on every push to `main` (or run manually): validates,
  builds, and publishes to **GitHub Pages**.

**One-time setup:** in the repo, open **Settings → Pages → Build and deployment**
and set **Source** to **GitHub Actions**. The next push to `main` then deploys to
`https://<user>.github.io/<repo>/`.

Because Pages serves the app from a project sub-path, the deploy build sets
`BASE_PATH=/<repo>/`. Vite's `base` — and everything derived from it
(`import.meta.env.BASE_URL`, the router `basename`, the favicon, and the
Stockfish worker URL) — picks that up, so assets and routes resolve under the
sub-path. Local `npm run dev` / `npm run build` leave `BASE_PATH` unset, so they
stay at `/` and are unaffected. Deploying to a custom domain or `user.github.io`
root instead? Remove the `BASE_PATH` env from `deploy.yml` to build at `/`.

## Disclaimer

ChessRetabled is a hobby project, provided **as is**, with no warranty of any
kind. It's made for **learning and fun**:

- The lessons and puzzles may contain mistakes and are **not professional chess
  instruction**. Bot "Elo" and puzzle ratings are **approximate and unofficial**
  (not FIDE/USCF ratings).
- I'm a software developer — **not a chess coach, doctor, or lawyer** — so nothing
  here is professional advice of any kind.
- Not affiliated with or endorsed by Stockfish, FIDE, chess.com, or Lichess.

## Privacy

No accounts, servers, analytics, cookies, or third-party CDNs by default. Fonts
are **self-hosted** (bundled with the app), so the page makes no request to
Google Fonts or any other outside service at runtime. Your progress (level,
ratings, streak, lesson stars, game history) is stored **only in your browser**
via `localStorage` and never leaves your device. Out of the box, the only network
request is to load the app itself; the host (GitHub Pages) serves the site and
may log standard web requests per GitHub's privacy policy.

**Optional Google Drive sync** (off by default): if you turn it on in Settings,
tick consent, and connect a Google account, your data bundle is uploaded to a
private per-app folder in *your own* Google Drive (the `drive.appdata` scope —
hidden from your normal Drive files) so you can restore it on other devices.
This is the only case where data leaves your device, it only happens after you
explicitly connect, and you can disconnect at any time. The OAuth access token is
held in memory only and never persisted.

## License

ChessRetabled is Copyright © 2026 Adam Eryavec, licensed under the **GNU General
Public License v3.0** — see [`LICENSE`](./LICENSE).

It bundles the **Stockfish 16** engine, which is also GPL-3.0. See
[`THIRD-PARTY-NOTICES.md`](./THIRD-PARTY-NOTICES.md) for every third-party
component and its license (Stockfish, chess.js, React, react-router, zustand,
fonts) and for the Stockfish corresponding-source links.
