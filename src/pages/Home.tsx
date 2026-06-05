import { useNavigate } from "react-router-dom";
import { useProgress, useLevel } from "../state/useProgress";
import "./Home.css";

type Mode = {
  to: string;
  ico: string;
  title: string;
  blurb: string;
  accent: string;
  foot: React.ReactNode;
};

export function Home() {
  const nav = useNavigate();
  const progress = useProgress();
  const { level, into, need } = useLevel();

  const modes: Mode[] = [
    {
      to: "/play",
      ico: "♟",
      title: "Play Bots",
      blurb: "Face a roster of characters from total beginner to grandmaster.",
      accent: "var(--gold)",
      foot: <span className="tag tag--gold">12 opponents</span>,
    },
    {
      to: "/puzzles",
      ico: "🧩",
      title: "Puzzles",
      blurb: "Sharpen tactics — forks, pins, mates. Build your rating.",
      accent: "var(--mint)",
      foot: <span className="tag tag--mint">Rating {progress.puzzle.rating}</span>,
    },
    {
      to: "/learn",
      ico: "🎓",
      title: "Learn",
      blurb: "Guided lessons from how-the-pieces-move to deep strategy.",
      accent: "var(--sky)",
      foot: <span className="tag tag--sky">Courses & lessons</span>,
    },
    {
      to: "/practice",
      ico: "🎯",
      title: "Practice",
      blurb: "Drill endgames and key positions against the engine.",
      accent: "var(--coral)",
      foot: <span className="tag tag--coral">Endgame drills</span>,
    },
  ];

  return (
    <div className="page">
      <section className="home__hero">
        <div className="home__hero-copy">
          <h1 className="toon-title">
            Master chess.
            <br />
            <span style={{ color: "var(--gold)" }}>Beautifully.</span>
          </h1>
          <p>
            A hand-inked, cel-shaded chess club. Play smart bots, climb through
            lessons, and crack tactics puzzles — all on a board that pops off the
            table.
          </p>
          <div className="home__hero-cta">
            <button
              className="btn btn--primary btn--lg"
              onClick={() => nav("/play")}
            >
              ▶ Play now
            </button>
            <button
              className="btn btn--lg"
              onClick={() => nav("/puzzles")}
            >
              🧩 Daily tactics
            </button>
          </div>
        </div>
        <div className="home__pieces" aria-hidden>
          <span className="glyph" style={{ left: "12%", top: "8%", animationDelay: "0s" }}>
            ♞
          </span>
          <span className="glyph" style={{ left: "46%", top: "30%", animationDelay: "0.6s", color: "var(--gold)" }}>
            ♛
          </span>
          <span className="glyph" style={{ left: "70%", top: "4%", animationDelay: "1.2s" }}>
            ♝
          </span>
          <span className="glyph" style={{ left: "26%", top: "52%", animationDelay: "1.8s", color: "var(--coral)" }}>
            ♜
          </span>
        </div>
      </section>

      <section className="home__progress">
        <div className="home__stat">
          <div className="big" style={{ color: "var(--violet)" }}>
            Lv {level}
          </div>
          <div className="lbl">Level</div>
          <div className="bar" style={{ marginTop: 10 }}>
            <span style={{ width: `${Math.round((into / need) * 100)}%` }} />
          </div>
        </div>
        <div className="home__stat">
          <div className="big" style={{ color: "var(--gold)" }}>
            ⚡ {progress.puzzle.rating}
          </div>
          <div className="lbl">Puzzle rating</div>
        </div>
        <div className="home__stat">
          <div className="big" style={{ color: "var(--coral)" }}>
            🔥 {progress.streak.count}
          </div>
          <div className="lbl">Day streak</div>
        </div>
        <div className="home__stat">
          <div className="big" style={{ color: "var(--mint)" }}>
            {progress.games.won}-{progress.games.drawn}-{progress.games.lost}
          </div>
          <div className="lbl">Bot record (W-D-L)</div>
        </div>
      </section>

      <h2 className="home__sectiontitle toon-title">Choose your mode</h2>
      <section className="home__modes">
        {modes.map((m) => (
          <div
            key={m.to}
            className="mode-card"
            style={{ ["--accent" as string]: m.accent }}
            onClick={() => nav(m.to)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" ? nav(m.to) : null)}
          >
            <div className="mode-card__ico" aria-hidden>
              {m.ico}
            </div>
            <h3>{m.title}</h3>
            <p>{m.blurb}</p>
            <div className="mode-card__foot">{m.foot}</div>
          </div>
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
          </a>
        </p>
        <p>
          For learning and fun — not professional chess instruction; bot and
          puzzle ratings are approximate and unofficial. Made by a developer (not
          a coach, doctor, or lawyer). No accounts and no tracking — your progress
          is saved only in your browser. Chess engine: Stockfish (GPL). Not
          affiliated with Stockfish, FIDE, chess.com, or Lichess.
        </p>
      </footer>
    </div>
  );
}
