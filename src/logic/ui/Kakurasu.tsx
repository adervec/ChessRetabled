import { useEffect, useMemo, useRef, useState } from "react";
import { generate, conflicts, isSolved, type Puzzle } from "../kakurasu";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 5;

export function Kakurasu({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [shaded, setShaded] = useState<boolean[]>(() => new Array(SIZE * SIZE).fill(false));
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const bad = useMemo(() => conflicts(shaded, SIZE, puzzle.rowTargets, puzzle.colTargets), [shaded, puzzle]);
  const won = useMemo(() => isSolved(shaded, SIZE, puzzle.rowTargets, puzzle.colTargets), [shaded, puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setShaded(new Array(SIZE * SIZE).fill(false));
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "kakurasu", gameName: "Kakurasu",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Kakurasu",
      moveCount: shaded.filter(Boolean).length, moves: [], reason: "Solved",
    });
  }, [won, shaded, addRecord]);

  const tiles = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const i = r * SIZE + c;
      const cls = ["kkr-cell"];
      if (shaded[i]) cls.push("on");
      if (bad[i]) cls.push("bad");
      tiles.push(
        <button key={i} className={cls.join(" ")} onClick={() => setShaded((s) => { const n = s.slice(); n[i] = !n[i]; return n; })}>
          {shaded[i] ? c + 1 : ""}
        </button>
      );
    }
    tiles.push(<span key={`rt${r}`} className="kkr-target row">{puzzle.rowTargets[r]}</span>);
  }
  for (let c = 0; c < SIZE; c++) tiles.push(<span key={`ct${c}`} className="kkr-target col">{puzzle.colTargets[c]}</span>);
  tiles.push(<span key="corner" />);

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">➕ Kakurasu</span>
        <span className="text-muted">shaded cells sum to the clues</span>
      </div>

      <div className="kakurasu" style={{ gridTemplateColumns: `repeat(${SIZE + 1}, 1fr)` }}>{tiles}</div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">Row clue uses column weights 1–{SIZE}; column clue uses row weights.</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
