import type { Color, PieceSymbol } from "../../chess/types";
import { PieceArt } from "./pieces";
import "./PromotionDialog.css";

const CHOICES: PieceSymbol[] = ["q", "r", "b", "n"];

export function PromotionDialog({
  color,
  onChoose,
  onCancel,
}: {
  color: Color;
  onChoose: (type: PieceSymbol) => void;
  onCancel: () => void;
}) {
  return (
    <div className="promo-overlay" onClick={onCancel}>
      <div
        className="promo pop-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Choose promotion piece"
      >
        <div className="promo__title">Promote to…</div>
        <div className="promo__row">
          {CHOICES.map((t) => (
            <button
              key={t}
              className="promo__choice"
              onClick={() => onChoose(t)}
              aria-label={t}
            >
              <PieceArt type={t} color={color} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
