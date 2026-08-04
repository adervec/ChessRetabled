import { useEffect, useMemo, useRef, useState } from "react";
import { generate, isSolved, hCount, vCount, solutionEdges, type Puzzle } from "../slitherlink";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import { useSolveTrace } from "./useSolveLog";
import { useLogicSession } from "./useLogicSession";
import "./Logic.css";

const ROWS = 6, COLS = 6;

// Edge UI states: 0 = blank, 1 = line (part of the loop), 2 = cross (ruled out).
export function Slitherlink({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), ROWS, COLS));
  const [hState, setHState] = useState<number[]>(() => new Array(hCount(ROWS, COLS)).fill(0));
  // One line catches every entry: the working array is watched for changes
  // rather than each click handler being instrumented separately.
  const trace = useSolveTrace(hState, undefined);
  const [vState, setVState] = useState<number[]>(() => new Array(vCount(ROWS, COLS)).fill(0));
  const [hintEdge, setHintEdge] = useState<{ dir: "h" | "v"; i: number } | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const won = useMemo(
    () => isSolved(hState.map((s) => s === 1), vState.map((s) => s === 1), puzzle.clue, ROWS, COLS),
    [hState, vState, puzzle],
  );

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), ROWS, COLS));
    setHState(new Array(hCount(ROWS, COLS)).fill(0));
    setVState(new Array(vCount(ROWS, COLS)).fill(0));
    setHintEdge(null);
    setHintUsed(false);
  };

  // Unfinished grids survive closing the app, and show up in the bottom bar.
  useLogicSession("slitherlink", trace.events().length, won);

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "slitherlink", gameName: "Slitherlink",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Slitherlink",
      moveCount: hState.filter((s) => s === 1).length + vState.filter((s) => s === 1).length,
      moves: trace.events(), reason: "Loop closed",
      assisted: hintUsed || undefined,
    });
  }, [won, hState, vState, hintUsed, addRecord]);

  const cycleH = (i: number) => setHState((a) => a.map((s, k) => (k === i ? (s + 1) % 3 : s)));
  const cycleV = (i: number) => setVState((a) => a.map((s, k) => (k === i ? (s + 1) % 3 : s)));

  // Stage 1 highlights a loop edge that is still blank/crossed; stage 2 draws it.
  const sol = useMemo(() => solutionEdges(puzzle), [puzzle]);
  const hint = () => {
    if (won) return;
    if (hintEdge !== null) {
      const { dir, i } = hintEdge;
      if (dir === "h") setHState((a) => a.map((s, k) => (k === i ? 1 : s)));
      else setVState((a) => a.map((s, k) => (k === i ? 1 : s)));
      setHintEdge(null);
      return;
    }
    const hi = sol.h.findIndex((need, i) => need && hState[i] !== 1);
    if (hi >= 0) { setHintUsed(true); setHintEdge({ dir: "h", i: hi }); return; }
    const vi = sol.v.findIndex((need, i) => need && vState[i] !== 1);
    if (vi >= 0) { setHintUsed(true); setHintEdge({ dir: "v", i: vi }); }
  };
  const hintH = hintEdge !== null && hintEdge.dir === "h" ? hintEdge.i : -1;
  const hintV = hintEdge !== null && hintEdge.dir === "v" ? hintEdge.i : -1;

  // Build the interleaved dot/edge/cell lattice: (2*ROWS+1) × (2*COLS+1).
  const cells = [];
  for (let gr = 0; gr <= 2 * ROWS; gr++) {
    for (let gc = 0; gc <= 2 * COLS; gc++) {
      const evenR = gr % 2 === 0, evenC = gc % 2 === 0;
      if (evenR && evenC) {
        cells.push(<span key={`d${gr}-${gc}`} className="sl-dot" />);
      } else if (evenR && !evenC) {
        const i = (gr / 2) * COLS + (gc - 1) / 2;
        const st = hState[i];
        cells.push(
          <button key={`h${i}`} className={`sl-edge sl-edge--h s${st}${i === hintH ? " lhint" : ""}`} onClick={() => cycleH(i)} aria-label="horizontal edge">
            {st === 2 ? "×" : ""}
          </button>,
        );
      } else if (!evenR && evenC) {
        const i = ((gr - 1) / 2) * (COLS + 1) + gc / 2;
        const st = vState[i];
        cells.push(
          <button key={`v${i}`} className={`sl-edge sl-edge--v s${st}${i === hintV ? " lhint" : ""}`} onClick={() => cycleV(i)} aria-label="vertical edge">
            {st === 2 ? "×" : ""}
          </button>,
        );
      } else {
        const r = (gr - 1) / 2, c = (gc - 1) / 2;
        const k = puzzle.clue[r * COLS + c];
        cells.push(<span key={`c${r}-${c}`} className="sl-cell">{k >= 0 ? k : ""}</span>);
      }
    }
  }

  const cols = Array.from({ length: 2 * COLS + 1 }, (_, i) => (i % 2 === 0 ? "16px" : "1fr")).join(" ");
  const rows = Array.from({ length: 2 * ROWS + 1 }, (_, i) => (i % 2 === 0 ? "16px" : "40px")).join(" ");

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">➰ Slitherlink</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <span className="text-muted">one single loop</span>
      </div>

      <div className="slither" style={{ gridTemplateColumns: cols, gridTemplateRows: rows }}>{cells}</div>

      <div className="logic-foot">
        {won
          ? <span className="bj-result bj-result--win">Solved! 🎉</span>
          : <span className="text-muted">Click an edge to add a line; click again for ✕ then blank. Each number = lines on its sides.</span>}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintEdge !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
