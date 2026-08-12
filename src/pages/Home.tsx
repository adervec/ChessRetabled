import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress, useLevel } from "../state/useProgress";
import { useArchive } from "../state/useArchive";
import { buildDashboard } from "../state/stats";
import { CATALOG, CATEGORY_LABEL, CATEGORY_ORDER, type CatalogCategory } from "../catalog";
import { WhatNow } from "../components/ui/WhatNow";
import "./Home.css";

// The landing page is deliberately category-agnostic: chess is one of four
// wings, not the front door. Counts come from the catalogue, so adding a game
// updates this page for free.

const WING: Record<CatalogCategory, { to: string; ico: string; blurb: string; accent: string }> = {
  chess: {
    to: "/play",
    ico: "♟",
    blurb: "Twelve bots from hatchling to grandmaster, plus puzzles, lessons and endgame drills.",
    accent: "var(--gold)",
  },
  board: {
    to: "/games",
    ico: "🎲",
    blurb: "Checkers, Reversi, Hex, Fanorona and more — perfect-information classics with a real AI.",
    accent: "var(--mint)",
  },
  cards: {
    to: "/cards",
    ico: "🃏",
    blurb: "Solitaire, poker, cribbage, Durak, Scopa — seeded decks and opponents who actually play.",
    accent: "var(--coral)",
  },
  logic: {
    to: "/logic",
    ico: "💡",
    blurb: "Sudoku, Slitherlink, Nurikabe, Nonogram — every puzzle generated with a unique solution.",
    accent: "var(--sky)",
  },
};

const MORE = [
  { to: "/puzzles", ico: "🧩", label: "Tactics puzzles" },
  { to: "/learn", ico: "🎓", label: "Chess lessons" },
  { to: "/academy", ico: "📚", label: "Games Academy" },
  { to: "/practice", ico: "🎯", label: "Endgame drills" },
  { to: "/simul", ico: "♞", label: "Simul" },
  { to: "/guide", ico: "📖", label: "Guides" },
  { to: "/dashboard", ico: "📊", label: "Dashboard" },
  { to: "/coach", ico: "🧑‍🏫", label: "Coach" },
];

export function Home() {
  const nav = useNavigate();
  const streak = useProgress((s) => s.streak.count);
  const { level, into, need } = useLevel();
  const records = useArchive((a) => a.records);
  const now = useMemo(() => Date.now(), []);
  const d = useMemo(() => buildDashboard(records, now), [records, now]);

  const counts = useMemo(() => {
    const c = {} as Record<CatalogCategory, number>;
    for (const e of CATALOG) c[e.category] = (c[e.category] ?? 0) + 1;
    return c;
  }, []);

  return (
    <div className="page">
      <section className="home__hero">
        <div className="home__hero-copy">
          <h1 className="toon-title">
            {CATALOG.length} games.
            <br />
            <span style={{ color: "var(--gold)" }}>One table.</span>
          </h1>
          <p>
            A hand-inked, cel-shaded games room: chess against real engines, board
            games, a card room and a lab full of logic puzzles. No accounts, no
            servers — it all runs in this browser, offline included.
          </p>
          <div className="home__hero-cta">
            <button className="btn btn--primary btn--lg" onClick={() => nav("/games")}>
              ▶ Start playing
            </button>
            <button className="btn btn--lg" onClick={() => nav("/guide")}>
              📖 How to play anything
            </button>
          </div>
        </div>
        <div className="home__pieces" aria-hidden>
          <span className="glyph" style={{ left: "12%", top: "8%", animationDelay: "0s" }}>♟</span>
          <span className="glyph" style={{ left: "46%", top: "30%", animationDelay: "0.6s", color: "var(--gold)" }}>🎲</span>
          <span className="glyph" style={{ left: "70%", top: "4%", animationDelay: "1.2s" }}>🃏</span>
          <span className="glyph" style={{ left: "26%", top: "52%", animationDelay: "1.8s", color: "var(--coral)" }}>💡</span>
        </div>
      </section>

      <WhatNow />

      <section className="home__progress">
        <div className="home__stat">
          <div className="big" style={{ color: "var(--violet)" }}>Lv {level}</div>
          <div className="lbl">Level</div>
          <div className="bar" style={{ marginTop: 10 }}>
            <span style={{ width: `${Math.round((into / need) * 100)}%` }} />
          </div>
        </div>
        <div className="home__stat">
          <div className="big" style={{ color: "var(--gold)" }}>🎮 {d.totalPlayed}</div>
          <div className="lbl">Games played</div>
        </div>
        <div className="home__stat">
          <div className="big" style={{ color: "var(--coral)" }}>🔥 {streak}</div>
          <div className="lbl">Day streak</div>
        </div>
        <div className="home__stat">
          <div className="big" style={{ color: "var(--mint)" }}>
            {d.triedCount}/{d.catalogCount}
          </div>
          <div className="lbl">Games tried</div>
        </div>
      </section>

      <h2 className="home__sectiontitle toon-title">Four ways to play</h2>
      <section className="home__modes">
        {CATEGORY_ORDER.map((cat) => {
          const w = WING[cat];
          return (
            <div
              key={cat}
              className="mode-card"
              style={{ ["--accent" as string]: w.accent }}
              onClick={() => nav(w.to)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" ? nav(w.to) : null)}
            >
              <div className="mode-card__ico" aria-hidden>{w.ico}</div>
              <h3>{CATEGORY_LABEL[cat]}</h3>
              <p>{w.blurb}</p>
              <div className="mode-card__foot">
                <span className="tag">{counts[cat]} {counts[cat] === 1 ? "game" : "games"}</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="home__more">
        {MORE.map((m) => (
          <button key={m.to} className="chip-btn" onClick={() => nav(m.to)}>
            <span aria-hidden>{m.ico}</span> {m.label}
          </button>
        ))}
      </section>

      <footer className="home__fineprint">
        <p>
          <strong>ChessRetabled</strong> is a free, open-source hobby project ·{" "}
          <a
            href="https://github.com/adervec/ChessRetabled"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source &amp; license (GPL-3.0)
          </a>{" "}
          ·{" "}
          <a
            href="https://adervec.github.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            More apps by this maker
          </a>
        </p>
        <p>
          For learning and fun — not professional instruction; bot and puzzle
          ratings are approximate and unofficial. Made by a developer (not a
          coach, doctor, or lawyer). No accounts and no tracking — your progress
          is saved only in your browser. Chess engine: Stockfish (GPL). Not
          affiliated with Stockfish, FIDE, chess.com, or Lichess.
        </p>
      </footer>
    </div>
  );
}
