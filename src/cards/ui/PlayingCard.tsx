import type { Card } from "../core/cards";
import { SUIT_SYMBOL, isRed, rankLabel } from "../core/cards";
import { playSfx } from "../../state/sfx";
import "./PlayingCard.css";

// A cel-shaded playing card: thick ink outline, flat fills, hard corner indices,
// a bold centre symbol, and a patterned back. Themed colours come from CSS vars,
// so cards re-skin with the app theme like everything else.

export function PlayingCard({
  card,
  faceUp = true,
  selected = false,
  dimmed = false,
  className = "",
  onClick,
  style,
}: {
  card?: Card;
  faceUp?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const cls = [
    "pcard",
    faceUp ? "is-up" : "is-down",
    selected ? "is-selected" : "",
    dimmed ? "is-dimmed" : "",
    onClick ? "is-clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      style={style}
      // Every card game routes its taps through this component, so one line
      // here is the whole card room's "card flicked" cue.
      onClick={onClick && (() => { playSfx("deal"); onClick(); })}
      role={onClick ? "button" : undefined}
    >
      {faceUp && card ? <CardFace card={card} /> : <CardBack />}
    </div>
  );
}

function CardFace({ card }: { card: Card }) {
  const red = isRed(card.suit);
  const sym = SUIT_SYMBOL[card.suit];
  const label = rankLabel(card.rank);
  return (
    <svg viewBox="0 0 100 140" className={"pcard__svg" + (red ? " red" : " black")} width="100%" height="100%">
      <rect x="2.5" y="2.5" width="95" height="135" rx="10" className="pcard__bg" />
      {/* top-left index */}
      <g className="pcard__index">
        <text x="11" y="24" className="pcard__rank">{label}</text>
        <text x="11" y="38" className="pcard__suit-sm">{sym}</text>
      </g>
      {/* bottom-right index (rotated) */}
      <g className="pcard__index" transform="rotate(180 50 70)">
        <text x="11" y="24" className="pcard__rank">{label}</text>
        <text x="11" y="38" className="pcard__suit-sm">{sym}</text>
      </g>
      {/* centre pip */}
      <text x="50" y="86" className="pcard__center">{sym}</text>
    </svg>
  );
}

function CardBack() {
  return (
    <svg viewBox="0 0 100 140" className="pcard__svg" width="100%" height="100%">
      <rect x="2.5" y="2.5" width="95" height="135" rx="10" className="pcard__back-bg" />
      <rect x="9" y="9" width="82" height="122" rx="6" className="pcard__back-panel" />
      <circle cx="50" cy="70" r="20" className="pcard__back-emblem" />
      <text x="50" y="79" className="pcard__back-mark">♛</text>
    </svg>
  );
}
