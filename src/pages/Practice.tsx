import { useEffect, useMemo, useRef, useState } from "react";
import { Board } from "../components/board/Board";
import { PromotionDialog } from "../components/board/PromotionDialog";
import { useBotGame } from "../chess/useBotGame";
import { getEngine } from "../engine";
import { DRILLS, type Drill } from "../content/drills";
import type { Bot } from "../content/bots";
import { useProgress } from "../state/useProgress";
import "./Practice.css";

export function Practice() {
  const [drill, setDrill] = useState<Drill | null>(null);
  const [runKey, setRunKey] = useState(0);
  const drills = useProgress((s) => s.drills);

  useEffect(() => {
    getEngine().init();
  }, []);

  if (!drill) {
    return (
      <div className="page">
        <h1 className="toon-title">Practice Arena</h1>
        <p className="text-dim" style={{ margin: "6px 0 22px" }}>
          Master the essential endgames against the engine. Repeat until the
          technique is second nature.
        </p>
        <div className="drills__grid">
          {DRILLS.map((d) => (
            <button
              key={d.id}
              className="drillcard"
              style={{ ["--d-accent" as string]: d.accent }}
              onClick={() => {
                setDrill(d);
                setRunKey((k) => k + 1);
              }}
            >
              <div className="drillcard__icon">{d.icon}</div>
              <div className="drillcard__title">{d.title}</div>
              <div className="drillcard__desc">{d.description}</div>
              <div className="drillcard__foot">
                <span className="tag">{d.difficulty}</span>
                {drills[d.id]?.completed && (
                  <span className="tag tag--mint">✓ done</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <DrillRunner
        key={runKey}
        drill={drill}
        onRestart={() => setRunKey((k) => k + 1)}
        onExit={() => setDrill(null)}
      />
    </div>
  );
}

function DrillRunner({
  drill,
  onRestart,
  onExit,
}: {
  drill: Drill;
  onRestart: () => void;
  onExit: () => void;
}) {
  const completeDrill = useProgress((s) => s.completeDrill);
  const defender = useMemo<Bot>(
    () => ({
      id: "defender",
      name: "Defender",
      title: "",
      rating: 0,
      avatar: "🛡️",
      accent: drill.accent,
      blurb: "",
      level: drill.level,
      blunder: 0,
    }),
    [drill]
  );

  const g = useBotGame(defender, drill.humanColor, drill.fen);
  const [outcome, setOutcome] = useState<"playing" | "success" | "fail">(
    "playing"
  );
  const recordedRef = useRef(false);

  useEffect(() => {
    if (outcome !== "playing") return;
    // success: promotion goal
    if (
      drill.goal === "promote" &&
      g.history.some((m) => m.color === drill.humanColor && m.flags.includes("p"))
    ) {
      setOutcome("success");
      if (!recordedRef.current) {
        recordedRef.current = true;
        completeDrill(drill.id, g.history.length);
      }
      return;
    }
    if (g.result.over) {
      const won =
        g.result.winner === drill.humanColor && g.result.reason === "checkmate";
      if (drill.goal === "checkmate" && won) {
        setOutcome("success");
        if (!recordedRef.current) {
          recordedRef.current = true;
          completeDrill(drill.id, g.history.length);
        }
      } else {
        setOutcome("fail");
      }
    }
  }, [g.history, g.result, outcome, drill, completeDrill]);

  const goalText =
    drill.goal === "checkmate" ? "Checkmate the king" : "Promote your pawn";
  const banner =
    outcome === "success"
      ? "✓ Solved! Technique mastered."
      : outcome === "fail"
      ? g.result.reason === "stalemate"
        ? "✗ Stalemate! That's only a draw — try again."
        : "✗ Drew the position — try again."
      : `Goal: ${goalText}`;

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn btn--sm btn--ghost" onClick={onExit}>
          ← Drills
        </button>
        <span className="tag" style={{ background: drill.accent, color: "var(--text-on-light)" }}>
          {drill.icon} {drill.title}
        </span>
        <span className="tag">{drill.difficulty}</span>
        <span className="spacer" />
        <button className="btn btn--sm btn--ghost" onClick={g.flip}>
          ⇅ Flip
        </button>
      </div>

      <div className="drill">
        <div>
          <Board
            placed={g.game.placed}
            orientation={g.orientation}
            interactive={
              outcome === "playing" &&
              !g.thinking &&
              g.game.turn === drill.humanColor &&
              !g.gameOver
            }
            selected={g.controller.selected}
            targets={g.controller.targets}
            lastMove={g.game.lastMove}
            checkSquare={g.game.checkSquare}
            onSquareClick={g.controller.onSquareClick}
          />
        </div>

        <aside className="drill__side">
          <div className={"drill__goal " + outcome}>{banner}</div>
          <div className="drill__tip">💡 {drill.tip}</div>
          <div className="game__status">
            {g.thinking
              ? "Defender is thinking…"
              : g.game.turn === drill.humanColor
              ? g.game.inCheck
                ? "Your move — you're in check!"
                : "Your move"
              : "Defender to move"}
          </div>
          <div className="drill__controls">
            <button className="btn btn--sm btn--primary" onClick={onRestart}>
              ↻ Restart
            </button>
            <button className="btn btn--sm" onClick={onExit}>
              New drill
            </button>
          </div>
        </aside>
      </div>

      {g.controller.promotion && (
        <PromotionDialog
          color={g.controller.promotion.color}
          onChoose={g.controller.choosePromotion}
          onCancel={g.controller.cancelPromotion}
        />
      )}
    </div>
  );
}
