import { useArchive, summarise } from "../../state/useArchive";
import { GAMES } from "../../games/registry";
import "./GameHistory.css";

const ICONS: Record<string, string> = {
  chess: "♟",
  ...Object.fromEntries(GAMES.map((g) => [g.id, g.icon])),
};

const OUTCOME_LABEL: Record<string, string> = {
  win: "Win",
  loss: "Loss",
  draw: "Draw",
  abandoned: "Left",
};

export function GameHistory() {
  const records = useArchive((s) => s.records);
  const clear = useArchive((s) => s.clear);

  if (records.length === 0) {
    return (
      <section className="history">
        <h2 className="history__title">🗂 Game History</h2>
        <p className="history__empty">
          No games recorded yet. Every chess and arcade game you finish is logged
          here with its full move list.
        </p>
      </section>
    );
  }

  const summary = summarise(records);

  return (
    <section className="history">
      <div className="history__head">
        <h2 className="history__title">🗂 Game History</h2>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => {
            if (window.confirm("Clear all recorded games? Export first if you want a backup.")) {
              clear();
            }
          }}
        >
          Clear
        </button>
      </div>

      <div className="history__summary">
        {Object.entries(summary).map(([id, s]) => (
          <div className="history-sum" key={id}>
            <span className="history-sum__icon">{ICONS[id] ?? "🎲"}</span>
            <span className="history-sum__name">{s.name}</span>
            <span className="history-sum__rec">
              {s.won}<span>W</span> {s.drawn}<span>D</span> {s.lost}<span>L</span>
            </span>
          </div>
        ))}
      </div>

      <ul className="history__list">
        {records.slice(0, 25).map((r) => (
          <li className={"history-row outcome-" + r.outcome} key={r.id}>
            <span className="history-row__icon">{ICONS[r.gameId] ?? "🎲"}</span>
            <span className="history-row__main">
              <span className="history-row__name">{r.gameName}</span>
              <span className="history-row__sub">
                vs {r.opponent} · {r.moveCount} moves
                {r.reason ? ` · ${r.reason}` : ""}
              </span>
            </span>
            <span className={"history-row__badge badge-" + r.outcome}>
              {OUTCOME_LABEL[r.outcome] ?? r.outcome}
            </span>
            <span className="history-row__date">
              {new Date(r.endedISO).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
