import { useEffect, useMemo, useRef, useState } from "react";
import { generate, isSolved, type Puzzle } from "../shikaku";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 6;
type Rect = [number, number, number, number]; // r0,c0,r1,c1

export function Shikaku({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [rects, setRects] = useState<Record<number, Rect>>({});
  const [anchor, setAnchor] = useState<number | null>(null);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  // owner of each cell (numbered-cell id), -1 unowned, -2 overlapped
  const owner = useMemo(() => {
    const out = new Array(SIZE * SIZE).fill(-1);
    for (const [keyStr, [r0, c0, r1, c1]] of Object.entries(rects)) {
      const key = Number(keyStr);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const i = r * SIZE + c;
        out[i] = out[i] === -1 ? key : -2; // overlap
      }
    }
    return out;
  }, [rects]);

  const assign = useMemo(() => owner.map((o) => (o >= 0 ? o : -1)), [owner]);
  const won = useMemo(() => !owner.includes(-2) && !owner.includes(-1) && isSolved(assign, puzzle), [owner, assign, puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setRects({});
    setAnchor(null);
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "shikaku", gameName: "Shikaku",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Shikaku",
      moveCount: Object.keys(rects).length, moves: [], reason: "Solved",
    });
  }, [won, rects, addRecord]);

  const onClick = (i: number) => {
    if (puzzle.numbers[i] !== 0) {
      // clicking a number clears its rect and (re)arms it as the anchor
      setRects((prev) => { const n = { ...prev }; delete n[i]; return n; });
      setAnchor((a) => (a === i ? null : i));
      return;
    }
    if (anchor === null) return;
    const ar = Math.floor(anchor / SIZE), ac = anchor % SIZE;
    const r = Math.floor(i / SIZE), c = i % SIZE;
    setRects((prev) => ({ ...prev, [anchor]: [Math.min(ar, r), Math.min(ac, c), Math.max(ar, r), Math.max(ac, c)] }));
    setAnchor(null);
  };

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">▭ Shikaku</span>
        <span className="text-muted">click a number, then a corner</span>
      </div>

      <div className="shikaku" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {Array.from({ length: SIZE * SIZE }).map((_, i) => {
          const num = puzzle.numbers[i];
          const o = owner[i];
          const cls = ["shk-cell"];
          if (o === -2) cls.push("overlap");
          else if (o >= 0) cls.push("own-" + (o % 8));
          if (anchor === i) cls.push("anchor");
          // rectangle area mismatch hint
          let mismatch = false;
          if (num !== 0 && rects[i]) {
            const [r0, c0, r1, c1] = rects[i];
            mismatch = (r1 - r0 + 1) * (c1 - c0 + 1) !== num;
          }
          if (mismatch) cls.push("bad");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => onClick(i)}>
              {num !== 0 ? num : ""}
            </button>
          );
        })}
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">Each rectangle holds one number equal to its area.</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
