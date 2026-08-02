import type { Color } from "../../chess/types";
import "./GameOverModal.css";

const REASON_TEXT: Record<string, string> = {
  checkmate: "by checkmate",
  stalemate: "by stalemate",
  threefold: "by threefold repetition",
  insufficient: "insufficient material",
  fiftymove: "by the fifty-move rule",
  draw: "drawn",
  resign: "by resignation",
  agreement: "by agreement",
  timeout: "on time",
};

export function GameOverModal({
  winner,
  reason,
  humanColor,
  botName,
  onRematch,
  onNewOpponent,
  onClose,
}: {
  winner: Color | null;
  reason: string | null;
  humanColor: Color;
  botName: string;
  onRematch: () => void;
  onNewOpponent: () => void;
  onClose: () => void;
}) {
  const outcome =
    winner == null ? "draw" : winner === humanColor ? "win" : "loss";
  const title =
    outcome === "win" ? "Victory!" : outcome === "loss" ? "Defeat" : "Draw";
  const emoji = outcome === "win" ? "🏆" : outcome === "loss" ? "💀" : "🤝";
  const sub =
    outcome === "win"
      ? `You beat ${botName} ${REASON_TEXT[reason ?? "draw"] ?? ""}`
      : outcome === "loss"
      ? `${botName} wins ${REASON_TEXT[reason ?? "draw"] ?? ""}`
      : `Game ${REASON_TEXT[reason ?? "draw"] ?? "drawn"}`;

  return (
    <div className="gameover-overlay" onClick={onClose}>
      <div
        className={"gameover pop-in gameover--" + outcome}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Game over"
      >
        <div className="gameover__emoji">{emoji}</div>
        <h2 className="toon-title gameover__title">{title}</h2>
        <p className="gameover__sub">{sub}</p>
        <div className="gameover__actions">
          <button className="btn btn--primary" onClick={onRematch}>
            ↻ Rematch
          </button>
          <button className="btn" onClick={onNewOpponent}>
            New opponent
          </button>
        </div>
        <button className="gameover__close" onClick={onClose} aria-label="Close">
          Review board
        </button>
      </div>
    </div>
  );
}
