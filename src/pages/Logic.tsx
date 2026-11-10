import { useState } from "react";
import { Link } from "react-router-dom";
import { LOGIC_PUZZLES as PUZZLES } from "../logic/registry";
import { LOGIC_COMPONENTS } from "../logic/ui/components";
import { dailyKey, dailyPuzzleId, dailyNumber } from "../logic/daily";
import { useDaily } from "../state/useDaily";
import { useActiveGame } from "../state/activeGame";
import "../logic/ui/Logic.css";

export function Logic() {
  const [id, setId] = useState<string | null>(null);
  const exit = () => setId(null);
  useActiveGame(id);

  const todayKey = dailyKey(new Date());
  const todayId = dailyPuzzleId(todayKey);
  const doneToday = !!useDaily((s) => s.results[todayKey]);

  if (id) {
    const Puzzle = LOGIC_COMPONENTS[id];
    return <div className="page">{Puzzle ? <Puzzle onExit={exit} /> : null}</div>;
  }

  return (
    <div className="page">
      <header className="arcade__head">
        <h1 className="arcade__title">Logic Lab</h1>
        <p className="arcade__sub">
          Pure deduction — no opponent, just you and the puzzle. Every Sudoku is
          generated with a guaranteed unique solution.
        </p>
        <Link to="/guide" className="btn btn--sm btn--ghost" style={{ marginTop: "0.5rem", display: "inline-block" }}>
          📖 Read the puzzle guides
        </Link>
      </header>

      <Link to="/daily" className="daily-strip">
        <span className="daily-strip__icon">📅</span>
        <span className="daily-strip__text">
          <strong>Daily Challenge #{dailyNumber(todayKey)}</strong>
          <span className="text-muted">
            {doneToday ? "Solved today — come back tomorrow" : "One puzzle a day, the same for everyone"}
          </span>
        </span>
        <span className={"tag" + (doneToday ? " tag--gold" : "")}>{doneToday ? "✓ done" : "play"}</span>
      </Link>

      <div className="arcade__grid">
        {PUZZLES.map((p) => (
          <button key={p.id} className="arcade-card" onClick={() => setId(p.id)}>
            <span className="arcade-card__icon">{p.icon}</span>
            <span className="arcade-card__name">{p.name}</span>
            <span className="arcade-card__blurb">{p.blurb}</span>
            {p.id === todayId && <span className="arcade-card__badge">📅 today</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
