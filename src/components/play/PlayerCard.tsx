import type { Color } from "../../chess/types";
import "./PlayerCard.css";

const GLYPH: Record<string, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
};

export function PlayerCard({
  name,
  title,
  rating,
  avatar,
  accent,
  color,
  captured,
  advantage,
  active,
  thinking,
}: {
  name: string;
  title?: string;
  rating?: number;
  avatar: string;
  accent?: string;
  color: Color;
  captured: string[]; // opponent piece types this player has captured
  advantage: number;
  active?: boolean;
  thinking?: boolean;
}) {
  // captured pieces belong to the opposite color
  const capColorClass = color === "w" ? "cap-dark" : "cap-light";
  const order = ["q", "r", "b", "n", "p"];
  const sorted = [...captured].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b)
  );

  return (
    <div
      className={"playercard" + (active ? " is-active" : "")}
      style={{ ["--pc-accent" as string]: accent ?? "var(--violet)" }}
    >
      <div className="playercard__avatar">{avatar}</div>
      <div className="playercard__main">
        <div className="playercard__top">
          <span className="playercard__name">{name}</span>
          {rating != null && <span className="tag">{rating}</span>}
          {thinking && <span className="playercard__thinking">thinking…</span>}
        </div>
        <div className="playercard__sub">
          {title && <span className="playercard__title">{title}</span>}
          <span className={"playercard__captured " + capColorClass}>
            {sorted.map((t, i) => (
              <span key={i}>{GLYPH[t]}</span>
            ))}
            {advantage > 0 && (
              <span className="playercard__adv">+{advantage}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
