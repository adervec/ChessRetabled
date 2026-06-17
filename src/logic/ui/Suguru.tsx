import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isSolved, type Puzzle, type Grid } from "../suguru";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 6;

export function Suguru({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [cells, setCells] = useState<Grid>(() => puzzle.puzzle.slice());
  const [sel, setSel] = useState<number | null>(null);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(cells, SIZE, puzzle.regionId, puzzle.regionSize), [cells, puzzle]);
  const won = useMemo(() => isSolved(cells, SIZE, puzzle.regionId, puzzle.regionSize), [cells, puzzle]);
  const maxRegion = useMemo(() => Math.max(...puzzle.regionSize), [puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    const p = generate(randomSeed(), SIZE);
    setPuzzle(p);
    setCells(p.puzzle.slice());
    setSel(null);
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "suguru", gameName: "Suguru",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Suguru",
      moveCount: cells.length, moves: [], reason: "Solved",
    });
  }, [won, cells, addRecord]);

  const place = (n: number) => {
    if (sel === null || puzzle.givens[sel]) return;
    setCells((c) => { const next = c.slice(); next[sel] = next[sel] === n ? 0 : n; return next; });
  };

  const rid = puzzle.regionId;
  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🧩 Suguru</span>
        <span className="text-muted">fill each cage 1…size</span>
      </div>

      <div className="suguru" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {cells.map((v, i) => {
          const r = Math.floor(i / SIZE);
          const c = i % SIZE;
          const cls = ["sg-cell"];
          if (r === 0 || rid[i - SIZE] !== rid[i]) cls.push("edge-t");
          if (c === 0 || rid[i - 1] !== rid[i]) cls.push("edge-l");
          if (c === SIZE - 1 || rid[i + 1] !== rid[i]) cls.push("edge-r");
          if (r === SIZE - 1 || rid[i + SIZE] !== rid[i]) cls.push("edge-b");
          if (puzzle.givens[i]) cls.push("given");
          if (i === sel) cls.push("sel");
          if (bad[i]) cls.push("bad");
          return (
            <button key={i} className={cls.join(" ")} disabled={puzzle.givens[i]} onClick={() => setSel(i)}>
              {v !== 0 ? v : ""}
            </button>
          );
        })}
      </div>

      <div className="sudoku-pad" style={{ gridTemplateColumns: `repeat(${maxRegion + 1}, 1fr)`, maxWidth: 320 }}>
        {Array.from({ length: maxRegion }).map((_, k) => (
          <button key={k} className="btn btn--sm" onClick={() => place(k + 1)} disabled={sel === null || puzzle.givens[sel ?? 0]}>{k + 1}</button>
        ))}
        <button className="btn btn--sm btn--ghost" onClick={() => place(cells[sel ?? 0])} disabled={sel === null || puzzle.givens[sel ?? 0]}>⌫</button>
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">No equal digits may touch — even diagonally.</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
