import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isSolved, type Puzzle } from "../mosaic";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import { useSolveTrace } from "./useSolveLog";
import { useLogicSession } from "./useLogicSession";
import "./Logic.css";

const SIZE = 7;

export function Mosaic({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [shaded, setShaded] = useState<boolean[]>(() => new Array(SIZE * SIZE).fill(false));
  // One line catches every entry: the working array is watched for changes
  // rather than each click handler being instrumented separately.
  const trace = useSolveTrace(shaded, puzzle.solution);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(shaded, puzzle.clues, SIZE), [shaded, puzzle]);
  const won = useMemo(() => isSolved(shaded, puzzle.clues, SIZE), [shaded, puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setShaded(new Array(SIZE * SIZE).fill(false));
    setHintCell(null);
    setHintUsed(false);
  };

  // Unfinished grids survive closing the app, and show up in the bottom bar.
  useLogicSession("mosaic", trace.events().length, won);

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "mosaic", gameName: "Mosaic",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Mosaic",
      moveCount: shaded.filter(Boolean).length, moves: trace.events(), reason: "Picture complete",
      assisted: hintUsed || undefined,
    });
  }, [won, shaded, hintUsed, addRecord]);

  // Stage 1 highlights a mis-shaded cell; stage 2 sets it to match the solution.
  const hint = () => {
    if (won) return;
    if (hintCell !== null) {
      const t = hintCell;
      setShaded((s) => s.map((v, k) => (k === t ? puzzle.solution[t] : v)));
      setHintCell(null);
      return;
    }
    const target = shaded.findIndex((v, i) => v !== puzzle.solution[i]);
    if (target < 0) return;
    setHintUsed(true);
    setHintCell(target);
  };

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🖌 Mosaic</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <span className="text-muted">shade each 3×3 to its count</span>
      </div>

      <div className="mosaic" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {puzzle.clues.map((clue, i) => {
          const cls = ["mos-cell"];
          if (shaded[i]) cls.push("on");
          if (bad[i]) cls.push("bad");
          if (i === hintCell) cls.push("lhint");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => setShaded((s) => { const n = s.slice(); n[i] = !n[i]; return n; })}>
              {clue}
            </button>
          );
        })}
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">Each number = shaded cells in its 3×3 (itself included).</span>}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintCell !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
