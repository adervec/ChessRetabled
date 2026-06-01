import "./EvalBar.css";
import type { Orientation } from "../../chess/types";

/** Vertical evaluation bar. cp/mate are from White's perspective. */
export function EvalBar({
  cp,
  mate,
  orientation = "white",
  loading = false,
}: {
  cp?: number;
  mate?: number;
  orientation?: Orientation;
  loading?: boolean;
}) {
  // map to a 0..100 "white share" using a smooth squash of centipawns
  let whiteShare = 50;
  if (mate != null) {
    whiteShare = mate > 0 ? 100 : 0;
  } else if (cp != null) {
    const x = Math.max(-1000, Math.min(1000, cp));
    whiteShare = 50 + 50 * Math.tanh(x / 400);
  }

  // bottom of the bar = side that is at the bottom of the board (orientation)
  const bottomIsWhite = orientation === "white";
  const bottomShare = bottomIsWhite ? whiteShare : 100 - whiteShare;

  const label =
    mate != null
      ? `M${Math.abs(mate)}`
      : cp != null
      ? (cp >= 0 ? "+" : "") + (cp / 100).toFixed(1)
      : "–";

  return (
    <div className="evalbar" title="Evaluation (White advantage)">
      <div className="evalbar__track">
        <div
          className="evalbar__fill-white"
          style={{ height: `${bottomShare}%` }}
        />
        {loading && <div className="evalbar__pulse" />}
      </div>
      <div
        className={
          "evalbar__label" +
          ((mate != null ? mate < 0 : (cp ?? 0) < 0) ? " dark" : "")
        }
      >
        {label}
      </div>
    </div>
  );
}
