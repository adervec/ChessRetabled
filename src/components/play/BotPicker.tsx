import { useState } from "react";
import { BOTS, type Bot } from "../../content/bots";
import type { Color } from "../../chess/types";
import "./BotPicker.css";

type ColorChoice = "w" | "b" | "random";

export function BotPicker({
  onStart,
}: {
  onStart: (bot: Bot, color: Color) => void;
}) {
  const [selected, setSelected] = useState<Bot | null>(null);
  const [color, setColor] = useState<ColorChoice>("w");

  const start = () => {
    if (!selected) return;
    const c: Color =
      color === "random" ? (Math.random() < 0.5 ? "w" : "b") : color;
    onStart(selected, c);
  };

  return (
    <div className="botpicker">
      <h1 className="toon-title">Choose your opponent</h1>
      <p className="text-dim" style={{ marginTop: 6, marginBottom: 18 }}>
        Twelve characters from total beginner to grandmaster. Pick a foe, pick a
        side, and play.
      </p>

      <div className="botpicker__grid">
        {BOTS.map((b) => (
          <button
            key={b.id}
            className={
              "botcard" + (selected?.id === b.id ? " is-selected" : "")
            }
            style={{ ["--bc-accent" as string]: b.accent }}
            onClick={() => setSelected(b)}
          >
            <div className="botcard__avatar">{b.avatar}</div>
            <div className="botcard__name">{b.name}</div>
            <div className="botcard__title">{b.title}</div>
            <div className="botcard__rating">{b.rating}</div>
            <div className="botcard__blurb">{b.blurb}</div>
          </button>
        ))}
      </div>

      <div className="botpicker__bar">
        <div className="botpicker__color">
          <span className="botpicker__label">Play as</span>
          <div className="segmented">
            {(["w", "random", "b"] as ColorChoice[]).map((c) => (
              <button
                key={c}
                className={"segmented__btn" + (color === c ? " is-on" : "")}
                onClick={() => setColor(c)}
              >
                {c === "w" ? "♔ White" : c === "b" ? "♚ Black" : "🎲 Random"}
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn btn--primary btn--lg"
          disabled={!selected}
          onClick={start}
        >
          {selected ? `Play ${selected.name} ▶` : "Select an opponent"}
        </button>
      </div>
    </div>
  );
}
