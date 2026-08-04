import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isValid, type Grid, type Puzzle } from "../binairo";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import { useSolveTrace } from "./useSolveLog";
import { useLogicSession } from "./useLogicSession";
import "./Logic.css";

type Diff = "easy" | "medium" | "hard";
const DIFFS: Diff[] = ["easy", "medium", "hard"];
const SIZE = 6;

export function Binairo({ onExit }: { onExit: () => void }) {
  const [diff, setDiff] = useState<Diff>("medium");
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE, "medium"));
  const [cells, setCells] = useState<Grid>(() => puzzle.puzzle.slice());
  // One line catches every entry: the working array is watched for changes
  // rather than each click handler being instrumented separately.
  const trace = useSolveTrace(cells, puzzle.solution);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(cells, SIZE), [cells]);
  const won = useMemo(() => cells.every((v) => v !== -1) && isValid(cells, SIZE), [cells]);

  const newGame = (d: Diff) => {
    const p = generate(randomSeed(), SIZE, d);
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(p);
    setCells(p.puzzle.slice());
    setHintCell(null);
    setHintUsed(false);
  };

  // Unfinished grids survive closing the app, and show up in the bottom bar.
  useLogicSession("binairo", trace.events().length, won);

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "binairo", gameName: "Binairo",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: `Binairo · ${diff}`,
      moveCount: cells.length, moves: trace.events(), reason: `Solved (${diff})`,
      assisted: hintUsed || undefined,
    });
  }, [won, diff, cells, hintUsed, addRecord]);

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
      if (cells[i] === -1) { target = i; break; }
      if (target < 0) target = i;
    }
    if (target < 0) return;
    setHintUsed(true);
    setHintCell(target);
  };

  const click = (i: number) => {
    if (puzzle.givens[i]) return;
    setCells((c) => {
      const next = c.slice();
      next[i] = next[i] === -1 ? 0 : next[i] === 0 ? 1 : -1; // cycle empty→0→1→empty
      return next;
    });
  };

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">⚫ Binairo</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <div className="settings__row">
          {DIFFS.map((d) => (
            <button key={d} className={"chip-btn" + (d === diff ? " is-on" : "")} onClick={() => { setDiff(d); newGame(d); }}>{d}</button>
          ))}
        </div>
      </div>

      <div className="binairo" style={{ ["--n" as string]: SIZE } as React.CSSProperties}>
        {cells.map((v, i) => {
          const cls = ["binairo-cell"];
          if (puzzle.givens[i]) cls.push("given");
          if (bad[i]) cls.push("bad");
          if (i === hintCell) cls.push("lhint");
          if (v === 0) cls.push("zero");
          if (v === 1) cls.push("one");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => click(i)} disabled={puzzle.givens[i]}>
              {v === -1 ? "" : v}
            </button>
          );
        })}
      </div>

      <div className="logic-foot">
        {won ? (
          <span className="bj-result bj-result--win">Solved! 🎉</span>
        ) : (
          <span className="text-muted">No 3 in a row · equal 0s and 1s · unique lines</span>
        )}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintCell !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={() => newGame(diff)}>↻ New puzzle</button>
      </div>
    </div>
  );
}
