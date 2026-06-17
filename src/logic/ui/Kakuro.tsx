import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isSolved, type Puzzle } from "../kakuro";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 7;

export function Kakuro({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [cells, setCells] = useState<number[]>(() => new Array(SIZE * SIZE).fill(0));
  const [sel, setSel] = useState<number | null>(null);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(cells, puzzle), [cells, puzzle]);
  const won = useMemo(() => isSolved(cells, puzzle), [cells, puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setCells(new Array(SIZE * SIZE).fill(0));
    setSel(null);
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "kakuro", gameName: "Kakuro",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Kakuro",
      moveCount: cells.filter((v) => v !== 0).length, moves: [], reason: "Solved",
    });
  }, [won, cells, addRecord]);

  const place = (n: number) => {
    if (sel === null || puzzle.kind[sel] !== 0) return;
    setCells((c) => { const next = c.slice(); next[sel] = next[sel] === n ? 0 : n; return next; });
  };

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">➗ Kakuro</span>
        <span className="text-muted">runs of distinct digits sum to the clues</span>
      </div>

      <div className="kakuro-grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {puzzle.kind.map((k, i) => {
          if (k !== 0) {
            const right = puzzle.right[i];
            const down = puzzle.down[i];
            return (
              <div key={i} className="kku-clue">
                <span className="kku-slash" />
                {right > 0 && <span className="kku-right">{right}</span>}
                {down > 0 && <span className="kku-down">{down}</span>}
              </div>
            );
          }
          const cls = ["kku-white"];
          if (i === sel) cls.push("sel");
          if (bad[i]) cls.push("bad");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => setSel(i)}>
              {cells[i] !== 0 ? cells[i] : ""}
            </button>
          );
        })}
      </div>

      <div className="sudoku-pad" style={{ gridTemplateColumns: "repeat(10, 1fr)", maxWidth: 380 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} className="btn btn--sm" onClick={() => place(n)} disabled={sel === null || puzzle.kind[sel ?? 0] !== 0}>{n}</button>
        ))}
        <button className="btn btn--sm btn--ghost" onClick={() => place(cells[sel ?? 0])} disabled={sel === null || puzzle.kind[sel ?? 0] !== 0}>⌫</button>
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">Each run has no repeats and hits its sum.</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
