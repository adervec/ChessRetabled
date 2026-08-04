import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isSolved, type Puzzle } from "../starbattle";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import { useSolveTrace } from "./useSolveLog";
import { useLogicSession } from "./useLogicSession";
import "./Logic.css";

const SIZE = 6;

export function StarBattle({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [stars, setStars] = useState<boolean[]>(() => new Array(SIZE * SIZE).fill(false));
  // One line catches every entry: the working array is watched for changes
  // rather than each click handler being instrumented separately.
  const trace = useSolveTrace(stars, puzzle.solution);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(stars, SIZE), [stars]);
  const won = useMemo(() => isSolved(stars, puzzle.regionId, SIZE), [stars, puzzle]);
  const placed = stars.filter(Boolean).length;

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setStars(new Array(SIZE * SIZE).fill(false));
    setHintCell(null);
    setHintUsed(false);
  };

  // Unfinished grids survive closing the app, and show up in the bottom bar.
  useLogicSession("starbattle", trace.events().length, won);

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "starbattle", gameName: "Star Battle",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Star Battle",
      moveCount: placed, moves: trace.events(), reason: "Solved",
      assisted: hintUsed || undefined,
    });
  }, [won, placed, hintUsed, addRecord]);

  // Stage 1 highlights a cell that's wrong vs the solution; stage 2 fixes it.
  const hint = () => {
    if (won) return;
    if (hintCell !== null) {
      const t = hintCell;
      setStars((s) => s.map((v, k) => (k === t ? puzzle.solution[t] : v)));
      setHintCell(null);
      return;
    }
    const target = stars.findIndex((v, i) => v !== puzzle.solution[i]);
    if (target < 0) return;
    setHintUsed(true);
    setHintCell(target);
  };

  const rid = puzzle.regionId;
  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">⭐ Star Battle</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <span className="text-muted">{placed}/{SIZE} stars</span>
      </div>

      <div className="starbattle" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {Array.from({ length: SIZE * SIZE }).map((_, i) => {
          const r = Math.floor(i / SIZE);
          const c = i % SIZE;
          const cls = ["sb-cell", "reg-" + (rid[i] % 6)];
          if (r === 0 || rid[i - SIZE] !== rid[i]) cls.push("edge-t");
          if (c === 0 || rid[i - 1] !== rid[i]) cls.push("edge-l");
          if (c === SIZE - 1 || rid[i + 1] !== rid[i]) cls.push("edge-r");
          if (r === SIZE - 1 || rid[i + SIZE] !== rid[i]) cls.push("edge-b");
          if (bad[i]) cls.push("bad");
          if (i === hintCell) cls.push("lhint");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => setStars((s) => { const n = s.slice(); n[i] = !n[i]; return n; })}>
              {stars[i] ? "★" : ""}
            </button>
          );
        })}
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">One star per row, column, and region — none touching.</span>}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintCell !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
