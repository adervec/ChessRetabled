import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isComplete, type Puzzle, type Grid } from "../futoshiki";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 5;

export function Futoshiki({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [cells, setCells] = useState<Grid>(() => puzzle.puzzle.slice());
  const [sel, setSel] = useState<number | null>(null);
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
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "futoshiki", gameName: "Futoshiki",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Futoshiki",
      moveCount: cells.length, moves: [], reason: "Solved",
    });
  }, [won, cells, addRecord]);

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
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
