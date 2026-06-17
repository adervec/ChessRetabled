import { useState } from "react";
import { Sudoku } from "../logic/ui/Sudoku";
import { Mastermind } from "../logic/ui/Mastermind";
import { Nonogram } from "../logic/ui/Nonogram";
import { LightsOut } from "../logic/ui/LightsOut";
import { Binairo } from "../logic/ui/Binairo";
import "../logic/ui/Logic.css";

const PUZZLES = [
  { id: "sudoku", name: "Sudoku", icon: "🔢", blurb: "Fill the 9×9 so every row, column, and box holds 1–9. Unique solution, always." },
  { id: "nonogram", name: "Nonogram", icon: "🖼", blurb: "Reveal the hidden picture from the row and column run clues." },
  { id: "binairo", name: "Binairo", icon: "⚫", blurb: "Fill 0s and 1s: no three in a row, balanced lines, all rows unique." },
  { id: "lightsout", name: "Lights Out", icon: "💡", blurb: "Tap to toggle crosses of lights — turn the whole board off." },
  { id: "mastermind", name: "Mastermind", icon: "🎯", blurb: "Crack the hidden 4-colour code from the black/white peg clues." },
];

export function Logic() {
  const [id, setId] = useState<string | null>(null);
  const exit = () => setId(null);

  if (id) {
    return (
      <div className="page">
        {id === "sudoku" && <Sudoku onExit={exit} />}
        {id === "nonogram" && <Nonogram onExit={exit} />}
        {id === "binairo" && <Binairo onExit={exit} />}
        {id === "lightsout" && <LightsOut onExit={exit} />}
        {id === "mastermind" && <Mastermind onExit={exit} />}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="arcade__head">
        <h1 className="arcade__title">Logic Lab</h1>
        <p className="arcade__sub">
          Pure deduction — no opponent, just you and the puzzle. Every Sudoku is
          generated with a guaranteed unique solution.
        </p>
      </header>
      <div className="arcade__grid">
        {PUZZLES.map((p) => (
          <button key={p.id} className="arcade-card" onClick={() => setId(p.id)}>
            <span className="arcade-card__icon">{p.icon}</span>
            <span className="arcade-card__name">{p.name}</span>
            <span className="arcade-card__blurb">{p.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
