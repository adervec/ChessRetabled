import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isComplete, type Puzzle, type Grid } from "../futoshiki";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import { useSolveTrace } from "./useSolveLog";
import { useLogicSession } from "./useLogicSession";
import "./Logic.css";

const SIZE = 5;

export function Futoshiki({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [cells, setCells] = useState<Grid>(() => puzzle.puzzle.slice());
  // One line catches every entry: the working array is watched for changes
  // rather than each click handler being instrumented separately.
  const trace = useSolveTrace(cells, puzzle.solution);
  const [sel, setSel] = useState<number | null>(null);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(cells, SIZE, puzzle.constraints), [cells, puzzle]);
  const won = isComplete(cells) && bad.every((b) => !b);

  // constraint lookup by "min-max" pair
  const consMap = useMemo(() => {
    const m = new Map<string, { a: number; b: number }>();
    for (const c of puzzle.constraints) m.set([Math.min(c.a, c.b), Math.max(c.a, c.b)].join(":"), c);
    return m;
  }, [puzzle]);

  const newGame = () => {
    const p = generate(randomSeed(), SIZE);
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(p);
    setCells(p.puzzle.slice());
    setSel(null);
    setHintCell(null);
    setHintUsed(false);
  };

  // Unfinished grids survive closing the app, and show up in the bottom bar.
  useLogicSession("futoshiki", trace.events().length, won);

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "futoshiki", gameName: "Futoshiki",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Futoshiki",
      moveCount: cells.length, moves: trace.events(), reason: "Solved",
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
      if (puzzle.givens[i] || cells[i] === puzzle.solution[i]) continue;
      if (cells[i] === 0) { target = i; break; }
      if (target < 0) target = i;
    }
    if (target < 0) return;
    setHintUsed(true);
    setHintCell(target);
  };

  const place = (n: number) => {
    if (sel === null || puzzle.givens[sel]) return;
    setCells((c) => {
      const next = c.slice();
      next[sel] = next[sel] === n ? 0 : n;
      return next;
    });
  };

  const span = 2 * SIZE - 1;
  const grid = [];
  for (let gr = 0; gr < span; gr++) {
    for (let gc = 0; gc < span; gc++) {
      if (gr % 2 === 0 && gc % 2 === 0) {
        const i = (gr / 2) * SIZE + gc / 2;
        const cls = ["fut-cell"];
        if (puzzle.givens[i]) cls.push("given");
        if (i === sel) cls.push("sel");
        if (bad[i]) cls.push("bad");
        if (i === hintCell) cls.push("lhint");
        grid.push(
          <button key={`${gr}-${gc}`} className={cls.join(" ")} onClick={() => setSel(i)}>
            {cells[i] !== 0 ? cells[i] : ""}
          </button>
        );
      } else if (gr % 2 === 0 && gc % 2 === 1) {
        const left = (gr / 2) * SIZE + (gc - 1) / 2;
        const right = left + 1;
        const con = consMap.get(`${Math.min(left, right)}:${Math.max(left, right)}`);
        grid.push(<span key={`${gr}-${gc}`} className="fut-sign">{con ? (con.a === left ? "‹" : "›") : ""}</span>);
      } else if (gr % 2 === 1 && gc % 2 === 0) {
        const top = ((gr - 1) / 2) * SIZE + gc / 2;
        const bottom = top + SIZE;
        const con = consMap.get(`${Math.min(top, bottom)}:${Math.max(top, bottom)}`);
        grid.push(<span key={`${gr}-${gc}`} className="fut-sign">{con ? (con.a === top ? "˄" : "˅") : ""}</span>);
      } else {
        grid.push(<span key={`${gr}-${gc}`} />);
      }
    }
  }

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">⟨ Futoshiki ⟩</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <span className="text-muted">a‹b: left is smaller</span>
      </div>

      <div className="fut" style={{ gridTemplateColumns: `repeat(${span}, auto)` }}>{grid}</div>

      <div className="sudoku-pad" style={{ gridTemplateColumns: `repeat(${SIZE + 1}, 1fr)`, maxWidth: 360 }}>
        {Array.from({ length: SIZE }).map((_, k) => (
          <button key={k} className="btn btn--sm" onClick={() => place(k + 1)} disabled={sel === null || puzzle.givens[sel ?? 0]}>{k + 1}</button>
        ))}
        <button className="btn btn--sm btn--ghost" onClick={() => place(cells[sel ?? 0])} disabled={sel === null || puzzle.givens[sel ?? 0]}>⌫</button>
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">1–{SIZE} once per row & column; obey every ‹ ›.</span>}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintCell !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
