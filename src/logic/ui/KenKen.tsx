import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isSolved, type Puzzle, type Grid } from "../kenken";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 5;

export function KenKen({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [cells, setCells] = useState<Grid>(() => new Array(SIZE * SIZE).fill(0));
  const [sel, setSel] = useState<number | null>(null);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(cells, puzzle), [cells, puzzle]);
  const won = useMemo(() => isSolved(cells, puzzle), [cells, puzzle]);

  // label cell + text per cage
  const labels = useMemo(() => {
    const out: Record<number, string> = {};
    puzzle.cages.forEach((cage) => {
      const head = Math.min(...cage.cells);
      out[head] = cage.op === "=" ? `${cage.target}` : `${cage.target}${cage.op}`;
    });
    return out;
  }, [puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setCells(new Array(SIZE * SIZE).fill(0));
    setSel(null);
    setHintCell(null);
    setHintUsed(false);
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "kenken", gameName: "KenKen",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "KenKen",
      moveCount: cells.length, moves: [], reason: "Solved",
      assisted: hintUsed || undefined,
    });
  }, [won, cells, hintUsed, addRecord]);

  // Stage 1 highlights a wrong/missing cell; stage 2 reveals its solution value.
  const hint = () => {
    if (won) return;
    if (hintCell !== null) {
      const t = hintCell;
      setCells((c) => c.map((v, k) => (k === t ? puzzle.solution[t] : v)));
      setHintCell(null);
      return;
    }
    let target = -1;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === puzzle.solution[i]) continue;
      if (cells[i] === 0) { target = i; break; }
      if (target < 0) target = i;
    }
    if (target < 0) return;
    setHintUsed(true);
    setHintCell(target);
  };

  const place = (n: number) => {
    if (sel === null) return;
    setCells((c) => { const next = c.slice(); next[sel] = next[sel] === n ? 0 : n; return next; });
  };

  const cc = puzzle.cellCage;
  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">✳ KenKen</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <span className="text-muted">1–{SIZE} per row & column</span>
      </div>

      <div className="kenken" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {cells.map((v, i) => {
          const r = Math.floor(i / SIZE);
          const c = i % SIZE;
          const cls = ["kk-cell"];
          if (r === 0 || cc[i - SIZE] !== cc[i]) cls.push("edge-t");
          if (c === 0 || cc[i - 1] !== cc[i]) cls.push("edge-l");
          if (c === SIZE - 1 || cc[i + 1] !== cc[i]) cls.push("edge-r");
          if (r === SIZE - 1 || cc[i + SIZE] !== cc[i]) cls.push("edge-b");
          if (i === sel) cls.push("sel");
          if (bad[i]) cls.push("bad");
          if (i === hintCell) cls.push("lhint");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => setSel(i)}>
              {labels[i] && <span className="kk-label">{labels[i]}</span>}
              {v !== 0 ? v : ""}
            </button>
          );
        })}
      </div>

      <div className="sudoku-pad" style={{ gridTemplateColumns: `repeat(${SIZE + 1}, 1fr)`, maxWidth: 360 }}>
        {Array.from({ length: SIZE }).map((_, k) => (
          <button key={k} className="btn btn--sm" onClick={() => place(k + 1)} disabled={sel === null}>{k + 1}</button>
        ))}
        <button className="btn btn--sm btn--ghost" onClick={() => place(cells[sel ?? 0])} disabled={sel === null}>⌫</button>
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">Each cage must hit its target.</span>}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintCell !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
