import { useEffect, useMemo, useRef, useState } from "react";
import { generate, counts, isSolved, type Puzzle } from "../tents";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 7;

// Non-tree cells cycle: 0 = empty, 1 = tent ⛺, 2 = grass · (just a marker).
export function Tents({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  const [state, setState] = useState<number[]>(() => new Array(SIZE * SIZE).fill(0));
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const tents = useMemo(() => state.map((s) => s === 1), [state]);
  const live = useMemo(() => counts(tents, SIZE), [tents]);
  const won = useMemo(() => isSolved(tents, puzzle.tree, SIZE, puzzle.rowClue, puzzle.colClue), [tents, puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setState(new Array(SIZE * SIZE).fill(0));
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "tents", gameName: "Tents",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Tents",
      moveCount: tents.filter(Boolean).length, moves: [], reason: "Camp pitched",
    });
  }, [won, tents, addRecord]);

  const click = (i: number) => {
    if (puzzle.tree[i]) return;
    setState((a) => a.map((s, k) => (k === i ? (s + 1) % 3 : s)));
  };

  const span = SIZE + 1;
  const tiles = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const i = r * SIZE + c;
      if (puzzle.tree[i]) {
        tiles.push(<span key={i} className="te-cell te-tree">🌳</span>);
      } else {
        const s = state[i];
        tiles.push(
          <button key={i} className={`te-cell${s === 1 ? " tent" : s === 2 ? " grass" : ""}`} onClick={() => click(i)}>
            {s === 1 ? "⛺" : s === 2 ? "·" : ""}
          </button>,
        );
      }
    }
    const ok = live.row[r] === puzzle.rowClue[r];
    tiles.push(<span key={`rc${r}`} className={"te-clue" + (live.row[r] > puzzle.rowClue[r] ? " over" : ok ? " ok" : "")}>{puzzle.rowClue[r]}</span>);
  }
  for (let c = 0; c < SIZE; c++) {
    const ok = live.col[c] === puzzle.colClue[c];
    tiles.push(<span key={`cc${c}`} className={"te-clue" + (live.col[c] > puzzle.colClue[c] ? " over" : ok ? " ok" : "")}>{puzzle.colClue[c]}</span>);
  }
  tiles.push(<span key="corner" />);

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">⛺ Tents</span>
        <span className="text-muted">one tent per tree</span>
      </div>

      <div className="tents" style={{ gridTemplateColumns: `repeat(${span}, 1fr)` }}>{tiles}</div>

      <div className="logic-foot">
        {won
          ? <span className="bj-result bj-result--win">Solved! 🎉</span>
          : <span className="text-muted">Pitch a tent beside each tree (one-to-one), no two tents touching. Tap twice to mark grass.</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
