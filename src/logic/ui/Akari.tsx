import { useEffect, useMemo, useRef, useState } from "react";
import { generate, isSolved, litCells, bulbConflicts, WHITE, WALL, type Puzzle } from "../akari";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 7;

export function Akari({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [bulbs, setBulbs] = useState<boolean[]>(() => new Array(SIZE * SIZE).fill(false));
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const lit = useMemo(() => litCells(puzzle.walls, bulbs, SIZE), [puzzle, bulbs]);
  const bad = useMemo(() => bulbConflicts(puzzle.walls, bulbs, SIZE), [puzzle, bulbs]);
  const won = useMemo(() => isSolved(puzzle.walls, bulbs, SIZE), [puzzle, bulbs]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setBulbs(new Array(SIZE * SIZE).fill(false));
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "akari", gameName: "Akari",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Akari",
      moveCount: bulbs.filter(Boolean).length, moves: [], reason: "Board lit",
    });
  }, [won, bulbs, addRecord]);

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">💡 Akari</span>
        <span className="text-muted">light every white square</span>
      </div>

      <div className="akari" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {puzzle.walls.map((w, i) => {
          if (w !== WHITE) {
            return (
              <div key={i} className={"ak-cell wall" + (w === WALL ? "" : " numbered")}>
                {w >= 0 ? w : ""}
              </div>
            );
          }
          const cls = ["ak-cell", "white"];
          if (lit[i]) cls.push("lit");
          if (bulbs[i]) cls.push("bulb");
          if (bad[i]) cls.push("bad");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => setBulbs((b) => { const n = b.slice(); n[i] = !n[i]; return n; })}>
              {bulbs[i] ? "💡" : ""}
            </button>
          );
        })}
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Lit up! 🎉</span> : <span className="text-muted">Bulbs can't see each other; numbers count adjacent bulbs.</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
