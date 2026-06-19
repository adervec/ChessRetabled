import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isSolved, type Puzzle } from "../mosaic";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 7;

export function Mosaic({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [shaded, setShaded] = useState<boolean[]>(() => new Array(SIZE * SIZE).fill(false));
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(shaded, puzzle.clues, SIZE), [shaded, puzzle]);
  const won = useMemo(() => isSolved(shaded, puzzle.clues, SIZE), [shaded, puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setShaded(new Array(SIZE * SIZE).fill(false));
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "mosaic", gameName: "Mosaic",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Mosaic",
      moveCount: shaded.filter(Boolean).length, moves: [], reason: "Picture complete",
    });
  }, [won, shaded, addRecord]);

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🖌 Mosaic</span>
        <span className="text-muted">shade each 3×3 to its count</span>
      </div>

      <div className="mosaic" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {puzzle.clues.map((clue, i) => {
          const cls = ["mos-cell"];
          if (shaded[i]) cls.push("on");
          if (bad[i]) cls.push("bad");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => setShaded((s) => { const n = s.slice(); n[i] = !n[i]; return n; })}>
              {clue}
            </button>
          );
        })}
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">Each number = shaded cells in its 3×3 (itself included).</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
