import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isSolved, type Puzzle, type Grid } from "../hidato";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 6;
const N = SIZE * SIZE;

export function Hidato({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [cells, setCells] = useState<Grid>(() => puzzle.board.slice());
  const [sel, setSel] = useState<number | null>(null);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(cells, SIZE), [cells]);
  const won = useMemo(() => isSolved(cells, SIZE), [cells]);

  const newGame = () => {
    const p = generate(randomSeed(), SIZE);
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(p);
    setCells(p.board.slice());
    setSel(null);
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "hidato", gameName: "Hidato",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Hidato",
      moveCount: N, moves: [], reason: "Path complete",
    });
  }, [won, addRecord]);

  const typeDigit = (d: number) => {
    if (sel === null || puzzle.givens[sel]) return;
    setCells((c) => {
      const next = c.slice();
      const grown = next[sel] * 10 + d;
      next[sel] = grown >= 1 && grown <= N ? grown : d >= 1 && d <= N ? d : 0;
      return next;
    });
  };
  const clear = () => {
    if (sel === null || puzzle.givens[sel]) return;
    setCells((c) => { const next = c.slice(); next[sel] = 0; return next; });
  };

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🐍 Hidato</span>
        <span className="text-muted">1…{N} in a connected chain</span>
      </div>

      <div className="hidato" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {cells.map((v, i) => {
          const cls = ["hidato-cell"];
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

      <div className="sudoku-pad" style={{ gridTemplateColumns: "repeat(6, 1fr)", maxWidth: 320 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
          <button key={d} className="btn btn--sm" onClick={() => typeDigit(d)} disabled={sel === null || puzzle.givens[sel ?? 0]}>{d}</button>
        ))}
        <button className="btn btn--sm btn--ghost" onClick={clear} disabled={sel === null || puzzle.givens[sel ?? 0]}>⌫</button>
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">Type numbers so each is next to the one before & after.</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
