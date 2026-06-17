import { useEffect, useRef, useState } from "react";
import { generate, toggle, isSolved, type LightsPuzzle } from "../lightsout";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

type Diff = "easy" | "medium" | "hard";
const PRESSES: Record<Diff, number> = { easy: 4, medium: 7, hard: 11 };
const DIFFS: Diff[] = ["easy", "medium", "hard"];
const SIZE = 5;

export function LightsOut({ onExit }: { onExit: () => void }) {
  const [diff, setDiff] = useState<Diff>("medium");
  const [puzzle, setPuzzle] = useState<LightsPuzzle>(() => generate(randomSeed(), SIZE, PRESSES.medium));
  const [grid, setGrid] = useState<number[]>(() => puzzle.grid.slice());
  const [moves, setMoves] = useState(0);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const won = isSolved(grid);

  const newGame = (d: Diff) => {
    const p = generate(randomSeed(), SIZE, PRESSES[d]);
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(p);
    setGrid(p.grid.slice());
    setMoves(0);
  };

  useEffect(() => {
    if (!won || recordedRef.current || moves === 0) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "lightsout", gameName: "Lights Out",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: `Lights Out · ${diff}`,
      moveCount: moves, moves: [], reason: `Cleared in ${moves} taps`,
    });
  }, [won, moves, diff, addRecord]);

  const click = (i: number) => {
    if (won) return;
    setGrid((g) => toggle(g, SIZE, i));
    setMoves((m) => m + 1);
  };

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">💡 Lights Out</span>
        <div className="settings__row">
          {DIFFS.map((d) => (
            <button key={d} className={"chip-btn" + (d === diff ? " is-on" : "")} onClick={() => { setDiff(d); newGame(d); }}>{d}</button>
          ))}
        </div>
      </div>

      <div className="lights" style={{ ["--n" as string]: SIZE } as React.CSSProperties}>
        {grid.map((v, i) => (
          <button key={i} className={"lights-cell" + (v === 1 ? " on" : "")} onClick={() => click(i)} aria-label={v === 1 ? "on" : "off"} />
        ))}
      </div>

      <div className="logic-foot">
        {won && moves > 0 ? (
          <span className="bj-result bj-result--win">All out in {moves} taps! 🎉</span>
        ) : (
          <span className="text-muted">{moves} taps · click to toggle a cross of lights</span>
        )}
        <button className="btn btn--sm btn--sky" onClick={() => newGame(diff)}>↻ New puzzle</button>
      </div>
    </div>
  );
}
