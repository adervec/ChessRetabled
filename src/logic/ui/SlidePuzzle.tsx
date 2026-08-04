import { useEffect, useRef, useState } from "react";
import { initSlide, slide, neighbors, isSolved, solvedTiles, type SlideState } from "../slide";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import { useLogicSession } from "./useLogicSession";
import { useSolveTrace } from "./useSolveLog";
import "./Logic.css";

const SIZE = 4;

export function SlidePuzzle({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<SlideState>(() => initSlide(randomSeed(), SIZE));
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const won = isSolved(s);
  // The tiles are the working array and the solved order is the answer, so the
  // generic trace scores every slide: a tile that lands where it belongs is a
  // good move, one that leaves home is not.
  const trace = useSolveTrace(s.tiles, solvedTiles(SIZE));
  const movable = new Set(neighbors(s.blank, SIZE));

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setS(initSlide(randomSeed(), SIZE));
  };

  // Unfinished puzzles survive closing the app, and show up in the bottom bar.
  useLogicSession("slide", s.moves, won);

  useEffect(() => {
    if (!won || recordedRef.current || s.moves === 0) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "slide", gameName: "15-Puzzle",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "15-Puzzle",
      moveCount: s.moves, moves: trace.events(), reason: `Solved in ${s.moves} slides`,
    });
  }, [won, s.moves, addRecord]);

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🔢 15-Puzzle</span>
        <span className="text-muted">{s.moves} slides</span>
      </div>

      <div className="slide" style={{ ["--n" as string]: SIZE } as React.CSSProperties}>
        {s.tiles.map((v, i) => (
          <button
            key={i}
            className={"slide-tile" + (v === 0 ? " blank" : "") + (movable.has(i) && !won ? " movable" : "")}
            onClick={() => { if (movable.has(i) && !won) setS((cur) => slide(cur, i)); }}
            disabled={v === 0 || won}
          >
            {v !== 0 ? v : ""}
          </button>
        ))}
      </div>

      <div className="logic-foot">
        {won && s.moves > 0 ? (
          <span className="bj-result bj-result--win">Solved in {s.moves} slides! 🎉</span>
        ) : (
          <span className="text-muted">Slide tiles into the gap to order 1–15.</span>
        )}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ Shuffle</button>
      </div>
    </div>
  );
}
