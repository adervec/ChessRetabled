import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isSolved, type Puzzle } from "../hitori";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 6;

export function Hitori({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [mask, setMask] = useState<boolean[]>(() => new Array(SIZE * SIZE).fill(false));
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(puzzle.board, mask, SIZE), [puzzle, mask]);
  const won = useMemo(() => isSolved(puzzle.board, mask, SIZE), [puzzle, mask]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setMask(new Array(SIZE * SIZE).fill(false));
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "hitori", gameName: "Hitori",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Hitori",
      moveCount: mask.filter(Boolean).length, moves: [], reason: "Solved",
    });
  }, [won, mask, addRecord]);

  const toggle = (i: number) => setMask((m) => { const next = m.slice(); next[i] = !next[i]; return next; });

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">▦ Hitori</span>
        <span className="text-muted">shade out the duplicates</span>
      </div>

      <div className="hitori" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {puzzle.board.map((v, i) => {
          const cls = ["hit-cell"];
          if (mask[i]) cls.push("shaded");
          else if (bad[i]) cls.push("bad");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => toggle(i)}>
              {mask[i] ? "" : v}
            </button>
          );
        })}
      </div>

      <div className="logic-foot">
        {won ? (
          <span className="bj-result bj-result--win">Solved! 🎉</span>
        ) : (
          <span className="text-muted">No repeats left unshaded · no two shaded touch · keep the rest connected.</span>
        )}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
