import { useEffect, useMemo, useRef, useState } from "react";
import { generate, isSolved, hCount, vCount, type Puzzle } from "../slitherlink";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const ROWS = 6, COLS = 6;

// Edge UI states: 0 = blank, 1 = line (part of the loop), 2 = cross (ruled out).
export function Slitherlink({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), ROWS, COLS));
  const [hState, setHState] = useState<number[]>(() => new Array(hCount(ROWS, COLS)).fill(0));
  const [vState, setVState] = useState<number[]>(() => new Array(vCount(ROWS, COLS)).fill(0));
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
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "slitherlink", gameName: "Slitherlink",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Slitherlink",
      moveCount: hState.filter((s) => s === 1).length + vState.filter((s) => s === 1).length,
      moves: [], reason: "Loop closed",
    });
  }, [won, hState, vState, addRecord]);

  const cycleH = (i: number) => setHState((a) => a.map((s, k) => (k === i ? (s + 1) % 3 : s)));
  const cycleV = (i: number) => setVState((a) => a.map((s, k) => (k === i ? (s + 1) % 3 : s)));

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
          <button key={`h${i}`} className={`sl-edge sl-edge--h s${st}`} onClick={() => cycleH(i)} aria-label="horizontal edge">
            {st === 2 ? "×" : ""}
          </button>,
        );
      } else if (!evenR && evenC) {
        const i = ((gr - 1) / 2) * (COLS + 1) + gc / 2;
        const st = vState[i];
        cells.push(
          <button key={`v${i}`} className={`sl-edge sl-edge--v s${st}`} onClick={() => cycleV(i)} aria-label="vertical edge">
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
        <span className="text-muted">one single loop</span>
      </div>

      <div className="slither" style={{ gridTemplateColumns: cols, gridTemplateRows: rows }}>{cells}</div>

      <div className="logic-foot">
        {won
          ? <span className="bj-result bj-result--win">Solved! 🎉</span>
          : <span className="text-muted">Click an edge to add a line; click again for ✕ then blank. Each number = lines on its sides.</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
