import { useEffect, useMemo, useRef, useState } from "react";
import { generate, isSolved, hSegCount, vSegCount, solutionEdges, WHITE, BLACK, type Puzzle } from "../masyu";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import { useSolveTrace } from "./useSolveLog";
import { useLogicSession } from "./useLogicSession";
import "./Logic.css";

const ROWS = 6, COLS = 6;

export function Masyu({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), ROWS, COLS));
  const [h, setH] = useState<boolean[]>(() => new Array(hSegCount(ROWS, COLS)).fill(false));
  // One line catches every entry: the working array is watched for changes
  // rather than each click handler being instrumented separately.
  const trace = useSolveTrace(h, undefined);
  const [v, setV] = useState<boolean[]>(() => new Array(vSegCount(ROWS, COLS)).fill(false));
  const [hintSeg, setHintSeg] = useState<{ dir: "h" | "v"; i: number } | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const won = useMemo(() => isSolved(h, v, puzzle.pearl, ROWS, COLS), [h, v, puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), ROWS, COLS));
    setH(new Array(hSegCount(ROWS, COLS)).fill(false));
    setV(new Array(vSegCount(ROWS, COLS)).fill(false));
    setHintSeg(null);
    setHintUsed(false);
  };

  // Unfinished grids survive closing the app, and show up in the bottom bar.
  useLogicSession("masyu", trace.events().length, won);

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "masyu", gameName: "Masyu",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Masyu",
      moveCount: h.filter(Boolean).length + v.filter(Boolean).length, moves: trace.events(), reason: "Loop closed",
      assisted: hintUsed || undefined,
    });
  }, [won, h, v, hintUsed, addRecord]);

  const toggleH = (i: number) => setH((a) => a.map((s, k) => (k === i ? !s : s)));
  const toggleV = (i: number) => setV((a) => a.map((s, k) => (k === i ? !s : s)));

  // Stage 1 highlights a loop segment still missing; stage 2 draws it.
  const sol = useMemo(() => solutionEdges(puzzle), [puzzle]);
  const hint = () => {
    if (won) return;
    if (hintSeg !== null) {
      const { dir, i } = hintSeg;
      if (dir === "h") setH((a) => a.map((s, k) => (k === i ? true : s)));
      else setV((a) => a.map((s, k) => (k === i ? true : s)));
      setHintSeg(null);
      return;
    }
    const hi = sol.h.findIndex((need, i) => need && !h[i]);
    if (hi >= 0) { setHintUsed(true); setHintSeg({ dir: "h", i: hi }); return; }
    const vi = sol.v.findIndex((need, i) => need && !v[i]);
    if (vi >= 0) { setHintUsed(true); setHintSeg({ dir: "v", i: vi }); }
  };
  const hintH = hintSeg !== null && hintSeg.dir === "h" ? hintSeg.i : -1;
  const hintV = hintSeg !== null && hintSeg.dir === "v" ? hintSeg.i : -1;

  const grid = [];
  for (let gr = 0; gr <= 2 * (ROWS - 1); gr++) {
    for (let gc = 0; gc <= 2 * (COLS - 1); gc++) {
      const evenR = gr % 2 === 0, evenC = gc % 2 === 0;
      if (evenR && evenC) {
        const p = puzzle.pearl[(gr / 2) * COLS + gc / 2];
        const cls = ["ms-cell"];
        if (p === WHITE) cls.push("ms-pearl--w");
        else if (p === BLACK) cls.push("ms-pearl--b");
        grid.push(<span key={`c${gr}-${gc}`} className={cls.join(" ")} />);
      } else if (evenR && !evenC) {
        const i = (gr / 2) * (COLS - 1) + (gc - 1) / 2;
        grid.push(<button key={`h${i}`} className={`ms-seg ms-seg--h${h[i] ? " on" : ""}${i === hintH ? " lhint" : ""}`} onClick={() => toggleH(i)} aria-label="horizontal segment" />);
      } else if (!evenR && evenC) {
        const i = ((gr - 1) / 2) * COLS + gc / 2;
        grid.push(<button key={`v${i}`} className={`ms-seg ms-seg--v${v[i] ? " on" : ""}${i === hintV ? " lhint" : ""}`} onClick={() => toggleV(i)} aria-label="vertical segment" />);
      } else {
        grid.push(<span key={`f${gr}-${gc}`} className="ms-face" />);
      }
    }
  }

  const cols = Array.from({ length: 2 * COLS - 1 }, (_, i) => (i % 2 === 0 ? "40px" : "26px")).join(" ");
  const rows = Array.from({ length: 2 * ROWS - 1 }, (_, i) => (i % 2 === 0 ? "40px" : "26px")).join(" ");

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">⚪ Masyu</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <span className="text-muted">pearls on one loop</span>
      </div>

      <div className="masyu" style={{ gridTemplateColumns: cols, gridTemplateRows: rows }}>{grid}</div>

      <div className="logic-foot">
        {won
          ? <span className="bj-result bj-result--win">Solved! 🎉</span>
          : <span className="text-muted">Click between cells to draw the loop. ⚪ go straight (turn beside it); ● turn (straight beside it).</span>}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintSeg !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
