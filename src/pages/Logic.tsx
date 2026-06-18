import { useState } from "react";
import { Sudoku } from "../logic/ui/Sudoku";
import { Mastermind } from "../logic/ui/Mastermind";
import { Nonogram } from "../logic/ui/Nonogram";
import { LightsOut } from "../logic/ui/LightsOut";
import { Binairo } from "../logic/ui/Binairo";
import { Futoshiki } from "../logic/ui/Futoshiki";
import { SlidePuzzle } from "../logic/ui/SlidePuzzle";
import { KenKen } from "../logic/ui/KenKen";
import { Hitori } from "../logic/ui/Hitori";
import { Skyscrapers } from "../logic/ui/Skyscrapers";
import { Hidato } from "../logic/ui/Hidato";
import { Kakurasu } from "../logic/ui/Kakurasu";
import { Akari } from "../logic/ui/Akari";
import { Suguru } from "../logic/ui/Suguru";
import { Kakuro } from "../logic/ui/Kakuro";
import { StarBattle } from "../logic/ui/StarBattle";
import { Shikaku } from "../logic/ui/Shikaku";
import "../logic/ui/Logic.css";

const PUZZLES = [
  { id: "sudoku", name: "Sudoku", icon: "🔢", blurb: "Fill the 9×9 so every row, column, and box holds 1–9. Unique solution, always." },
  { id: "kenken", name: "KenKen", icon: "✳", blurb: "A Latin square split into arithmetic cages — hit every cage's target." },
  { id: "futoshiki", name: "Futoshiki", icon: "⟨⟩", blurb: "A 5×5 Latin square that also obeys the greater-than signs between cells." },
  { id: "nonogram", name: "Nonogram", icon: "🖼", blurb: "Reveal the hidden picture from the row and column run clues." },
  { id: "binairo", name: "Binairo", icon: "⚫", blurb: "Fill 0s and 1s: no three in a row, balanced lines, all rows unique." },
  { id: "hitori", name: "Hitori", icon: "▦", blurb: "Shade out duplicates so no number repeats — and the rest stays joined." },
  { id: "skyscrapers", name: "Skyscrapers", icon: "🏙", blurb: "A Latin square of heights; each edge clue counts the buildings you can see." },
  { id: "hidato", name: "Hidato", icon: "🐍", blurb: "Fill 1…36 so consecutive numbers are always neighbours (diagonals count)." },
  { id: "akari", name: "Akari", icon: "🔦", blurb: "Place bulbs to light every square; numbers count adjacent bulbs." },
  { id: "kakuro", name: "Kakuro", icon: "➗", blurb: "Fill runs with distinct digits 1–9 that add up to each crossing clue." },
  { id: "suguru", name: "Suguru", icon: "🧩", blurb: "Fill each cage 1…size; no equal digits may touch, even diagonally." },
  { id: "starbattle", name: "Star Battle", icon: "⭐", blurb: "One star per row, column, and region — and no two may touch." },
  { id: "shikaku", name: "Shikaku", icon: "▭", blurb: "Cut the grid into rectangles, each holding one number = its area." },
  { id: "kakurasu", name: "Kakurasu", icon: "➕", blurb: "Shade cells so each row and column hits its weighted-sum clue." },
  { id: "lightsout", name: "Lights Out", icon: "💡", blurb: "Tap to toggle crosses of lights — turn the whole board off." },
  { id: "slide", name: "15-Puzzle", icon: "🧩", blurb: "Slide the tiles through the gap to put them back in order." },
  { id: "mastermind", name: "Mastermind", icon: "🎯", blurb: "Crack the hidden 4-colour code from the black/white peg clues." },
];

export function Logic() {
  const [id, setId] = useState<string | null>(null);
  const exit = () => setId(null);

  if (id) {
    return (
      <div className="page">
        {id === "sudoku" && <Sudoku onExit={exit} />}
        {id === "kenken" && <KenKen onExit={exit} />}
        {id === "futoshiki" && <Futoshiki onExit={exit} />}
        {id === "nonogram" && <Nonogram onExit={exit} />}
        {id === "binairo" && <Binairo onExit={exit} />}
        {id === "hitori" && <Hitori onExit={exit} />}
        {id === "skyscrapers" && <Skyscrapers onExit={exit} />}
        {id === "hidato" && <Hidato onExit={exit} />}
        {id === "akari" && <Akari onExit={exit} />}
        {id === "kakuro" && <Kakuro onExit={exit} />}
        {id === "suguru" && <Suguru onExit={exit} />}
        {id === "starbattle" && <StarBattle onExit={exit} />}
        {id === "shikaku" && <Shikaku onExit={exit} />}
        {id === "kakurasu" && <Kakurasu onExit={exit} />}
        {id === "lightsout" && <LightsOut onExit={exit} />}
        {id === "slide" && <SlidePuzzle onExit={exit} />}
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
