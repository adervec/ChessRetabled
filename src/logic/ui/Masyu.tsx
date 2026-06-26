import { useEffect, useMemo, useRef, useState } from "react";
import { generate, isSolved, hSegCount, vSegCount, WHITE, BLACK, type Puzzle } from "../masyu";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const ROWS = 6, COLS = 6;

export function Masyu({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), ROWS, COLS));
  const [h, setH] = useState<boolean[]>(() => new Array(hSegCount(ROWS, COLS)).fill(false));
  const [v, setV] = useState<boolean[]>(() => new Array(vSegCount(ROWS, COLS)).fill(false));
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
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "masyu", gameName: "Masyu",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Masyu",
      moveCount: h.filter(Boolean).length + v.filter(Boolean).length, moves: [], reason: "Loop closed",
    });
  }, [won, h, v, addRecord]);

  const toggleH = (i: number) => setH((a) => a.map((s, k) => (k === i ? !s : s)));
  const toggleV = (i: number) => setV((a) => a.map((s, k) => (k === i ? !s : s)));

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
        grid.push(<button key={`h${i}`} className={`ms-seg ms-seg--h${h[i] ? " on" : ""}`} onClick={() => toggleH(i)} aria-label="horizontal segment" />);
      } else if (!evenR && evenC) {
        const i = ((gr - 1) / 2) * COLS + gc / 2;
        grid.push(<button key={`v${i}`} className={`ms-seg ms-seg--v${v[i] ? " on" : ""}`} onClick={() => toggleV(i)} aria-label="vertical segment" />);
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
        <span className="text-muted">pearls on one loop</span>
      </div>

      <div className="masyu" style={{ gridTemplateColumns: cols, gridTemplateRows: rows }}>{grid}</div>

      <div className="logic-foot">
        {won
          ? <span className="bj-result bj-result--win">Solved! 🎉</span>
          : <span className="text-muted">Click between cells to draw the loop. ⚪ go straight (turn beside it); ● turn (straight beside it).</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
