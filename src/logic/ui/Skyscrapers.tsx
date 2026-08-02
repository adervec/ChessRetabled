import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isSolved, type Puzzle, type Grid } from "../skyscrapers";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 5;

export function Skyscrapers({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [cells, setCells] = useState<Grid>(() => new Array(SIZE * SIZE).fill(0));
  const [sel, setSel] = useState<number | null>(null);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(cells, SIZE, puzzle.clues), [cells, puzzle]);
  const won = useMemo(() => isSolved(cells, SIZE, puzzle.clues), [cells, puzzle]);

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
      id: newId(), gameId: "skyscrapers", gameName: "Skyscrapers",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Skyscrapers",
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

  const { top, bottom, left, right } = puzzle.clues;
  const span = SIZE + 2;
  const tiles = [];
  for (let gr = 0; gr < span; gr++) {
    for (let gc = 0; gc < span; gc++) {
      const edge = gr === 0 || gr === span - 1 || gc === 0 || gc === span - 1;
      if (edge) {
        let n = 0;
        if (gr === 0 && gc > 0 && gc <= SIZE) n = top[gc - 1];
        else if (gr === span - 1 && gc > 0 && gc <= SIZE) n = bottom[gc - 1];
        else if (gc === 0 && gr > 0 && gr <= SIZE) n = left[gr - 1];
        else if (gc === span - 1 && gr > 0 && gr <= SIZE) n = right[gr - 1];
        tiles.push(<span key={`${gr}-${gc}`} className="sky-clue">{n || ""}</span>);
      } else {
        const i = (gr - 1) * SIZE + (gc - 1);
        const cls = ["sky-cell"];
        if (i === sel) cls.push("sel");
        if (bad[i]) cls.push("bad");
        if (i === hintCell) cls.push("lhint");
        tiles.push(<button key={`${gr}-${gc}`} className={cls.join(" ")} onClick={() => setSel(i)}>{cells[i] !== 0 ? cells[i] : ""}</button>);
      }
    }
  }

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🏙 Skyscrapers</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <span className="text-muted">edge clue = buildings visible</span>
      </div>

      <div className="sky" style={{ gridTemplateColumns: `repeat(${span}, 1fr)` }}>{tiles}</div>

      <div className="sudoku-pad" style={{ gridTemplateColumns: `repeat(${SIZE + 1}, 1fr)`, maxWidth: 360 }}>
        {Array.from({ length: SIZE }).map((_, k) => (
          <button key={k} className="btn btn--sm" onClick={() => place(k + 1)} disabled={sel === null}>{k + 1}</button>
        ))}
        <button className="btn btn--sm btn--ghost" onClick={() => place(cells[sel ?? 0])} disabled={sel === null}>⌫</button>
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">1–{SIZE} per row & column; match every edge clue.</span>}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintCell !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
