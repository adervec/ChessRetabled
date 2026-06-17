import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, type Grid, type Puzzle } from "../sudoku";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

type Diff = "easy" | "medium" | "hard";
const DIFFS: Diff[] = ["easy", "medium", "hard"];

export function Sudoku({ onExit }: { onExit: () => void }) {
  const [diff, setDiff] = useState<Diff>("medium");
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), "medium"));
  const [cells, setCells] = useState<Grid>(() => puzzle.puzzle.slice());
  const [sel, setSel] = useState<number | null>(null);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(cells), [cells]);
  const filled = cells.every((v) => v !== 0);
  const won = filled && bad.every((b) => !b);

  const newGame = (d: Diff) => {
    const p = generate(randomSeed(), d);
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
      id: newId(), gameId: "sudoku", gameName: "Sudoku",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: `Sudoku · ${diff}`,
      moveCount: cells.filter((v) => v !== 0).length, moves: [], reason: `Solved (${diff})`,
    });
  }, [won, diff, cells, addRecord]);

  const place = (n: number) => {
    if (sel === null || puzzle.givens[sel]) return;
    setCells((c) => {
      const next = c.slice();
      next[sel] = next[sel] === n ? 0 : n;
      return next;
    });
  };

  const selR = sel === null ? -1 : Math.floor(sel / 9);
  const selC = sel === null ? -1 : sel % 9;
  const selVal = sel === null ? 0 : cells[sel];

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🔢 Sudoku</span>
        <div className="settings__row">
          {DIFFS.map((d) => (
            <button key={d} className={"chip-btn" + (d === diff ? " is-on" : "")} onClick={() => { setDiff(d); newGame(d); }}>{d}</button>
          ))}
        </div>
      </div>

      <div className="sudoku-grid">
        {cells.map((v, i) => {
          const r = Math.floor(i / 9);
          const c = i % 9;
          const cls = ["sudoku-cell"];
          if (puzzle.givens[i]) cls.push("given");
          if (i === sel) cls.push("sel");
          else if (r === selR || c === selC || (Math.floor(r / 3) === Math.floor(selR / 3) && Math.floor(c / 3) === Math.floor(selC / 3))) cls.push("peer");
          if (v !== 0 && v === selVal) cls.push("same");
          if (bad[i]) cls.push("bad");
          if (c % 3 === 2 && c !== 8) cls.push("box-r");
          if (r % 3 === 2 && r !== 8) cls.push("box-b");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => setSel(i)}>
              {v !== 0 ? v : ""}
            </button>
          );
        })}
      </div>

      <div className="sudoku-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} className="btn btn--sm" onClick={() => place(n)} disabled={sel === null || puzzle.givens[sel ?? 0]}>{n}</button>
        ))}
        <button className="btn btn--sm btn--ghost" onClick={() => place(cells[sel ?? 0])} disabled={sel === null || puzzle.givens[sel ?? 0]}>⌫</button>
      </div>

      <div className="logic-foot">
        {won ? (
          <span className="bj-result bj-result--win">Solved! 🎉</span>
        ) : (
          <span className="text-muted">{cells.filter((v) => v !== 0).length}/81 filled</span>
        )}
        <button className="btn btn--sm btn--sky" onClick={() => newGame(diff)}>↻ New puzzle</button>
      </div>
    </div>
  );
}
