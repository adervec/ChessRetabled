import { useEffect, useMemo, useRef, useState } from "react";
import { generate, isSolved, endpointPairs, type Puzzle } from "../numberlink";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 5;
const COLORS = ["#e0533d", "#3b82f6", "#3aa856", "#e6a817", "#9b6bff", "#e85d9e"];

export function Numberlink({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [paths, setPaths] = useState<number[][]>(() => puzzle.solutionPaths.map(() => []));
  const [active, setActive] = useState<number | null>(null);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const endpointColor = useMemo(() => puzzle.endpoint, [puzzle]);
  const pairs = useMemo(() => endpointPairs(puzzle.endpoint), [puzzle]);

  // which colour owns each cell (from the drawn paths)
  const owner = useMemo(() => {
    const o = new Array<number>(SIZE * SIZE).fill(0);
    paths.forEach((p, c) => p.forEach((cell) => { o[cell] = c + 1; }));
    return o;
  }, [paths]);

  const won = useMemo(() => isSolved(paths, puzzle.endpoint, SIZE), [paths, puzzle]);

  const reset = (p: Puzzle) => { setPuzzle(p); setPaths(p.solutionPaths.map(() => [])); setActive(null); };
  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    reset(generate(randomSeed(), SIZE));
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "numberlink", gameName: "Numberlink",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Numberlink",
      moveCount: paths.reduce((a, p) => a + p.length, 0), moves: [], reason: "All linked",
    });
  }, [won, paths, addRecord]);

  const ortho = (a: number, b: number) => {
    const ar = Math.floor(a / SIZE), ac = a % SIZE, br = Math.floor(b / SIZE), bc = b % SIZE;
    return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
  };

  const click = (cell: number) => {
    const ce = endpointColor[cell];
    if (ce !== 0 && ce !== active) { setActive(ce); setPaths((ps) => ps.map((p, c) => (c === ce - 1 ? [cell] : p))); return; }
    if (active === null) return;
    const path = paths[active - 1];
    const i = path.indexOf(cell);
    if (i >= 0) { setPaths((ps) => ps.map((p, c) => (c === active - 1 ? path.slice(0, i + 1) : p))); return; } // trim back
    const head = path[path.length - 1];
    if (head === undefined) return;
    if (ortho(cell, head) && (owner[cell] === 0 || owner[cell] === active)) {
      setPaths((ps) => ps.map((p, c) => (c === active - 1 ? [...path, cell] : p)));
    }
  };

  const tiles = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    const col = owner[i];
    const isEnd = endpointColor[i] !== 0;
    const style: React.CSSProperties = {};
    if (col > 0) style.background = `color-mix(in srgb, ${COLORS[(col - 1) % COLORS.length]} 42%, var(--surface))`;
    const cls = ["nl-cell"];
    if (active && (endpointColor[i] === active || (paths[active - 1] && paths[active - 1][paths[active - 1].length - 1] === i))) cls.push("head");
    if (isEnd) {
      const c = endpointColor[i];
      style.background = COLORS[(c - 1) % COLORS.length];
      tiles.push(<button key={i} className={cls.join(" ") + " nl-end"} style={style} onClick={() => click(i)}>{c}</button>);
    } else {
      tiles.push(<button key={i} className={cls.join(" ")} style={style} onClick={() => click(i)} aria-label="cell" />);
    }
  }

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🔗 Numberlink</span>
        <span className="text-muted">join the pairs, fill the grid</span>
      </div>

      <div className="numberlink" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>{tiles}</div>

      <div className="logic-foot">
        {won
          ? <span className="bj-result bj-result--win">Solved! 🎉</span>
          : <span className="text-muted">Tap a number, then step through neighbours to its twin. Fill every cell; tap back to undo.</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
      <p className="text-muted" style={{ textAlign: "center", fontSize: ".82rem" }}>{pairs.length} pairs to connect</p>
    </div>
  );
}
