import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Mosaic } from "../logic/ui/Mosaic";
import { Aquarium } from "../logic/ui/Aquarium";
import { Slitherlink } from "../logic/ui/Slitherlink";
import { Masyu } from "../logic/ui/Masyu";
import { Nurikabe } from "../logic/ui/Nurikabe";
import { Bridges } from "../logic/ui/Bridges";
import { Tents } from "../logic/ui/Tents";
import { Numberlink } from "../logic/ui/Numberlink";
import { LOGIC_PUZZLES as PUZZLES } from "../logic/registry";
import "../logic/ui/Logic.css";

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
        {id === "mosaic" && <Mosaic onExit={exit} />}
        {id === "aquarium" && <Aquarium onExit={exit} />}
        {id === "kakurasu" && <Kakurasu onExit={exit} />}
        {id === "lightsout" && <LightsOut onExit={exit} />}
        {id === "slide" && <SlidePuzzle onExit={exit} />}
        {id === "mastermind" && <Mastermind onExit={exit} />}
        {id === "slitherlink" && <Slitherlink onExit={exit} />}
        {id === "masyu" && <Masyu onExit={exit} />}
        {id === "nurikabe" && <Nurikabe onExit={exit} />}
        {id === "bridges" && <Bridges onExit={exit} />}
        {id === "tents" && <Tents onExit={exit} />}
        {id === "numberlink" && <Numberlink onExit={exit} />}
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
        <Link to="/guide" className="btn btn--sm btn--ghost" style={{ marginTop: "0.5rem", display: "inline-block" }}>
          📖 Read the puzzle guides
        </Link>
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
