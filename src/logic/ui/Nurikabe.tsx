import { useEffect, useMemo, useRef, useState } from "react";
import { generate, isSolved, type Puzzle } from "../nurikabe";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 6;

export function Nurikabe({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE, SIZE));
  const [sea, setSea] = useState<boolean[]>(() => new Array(SIZE * SIZE).fill(false));
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const clueAt = useMemo(() => {
    const m = new Map<number, number>();
    puzzle.clues.forEach((c) => m.set(c.cell, c.size));
    return m;
  }, [puzzle]);

  const won = useMemo(() => isSolved(sea, puzzle.clues, SIZE, SIZE), [sea, puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE, SIZE));
    setSea(new Array(SIZE * SIZE).fill(false));
    setHintCell(null);
    setHintUsed(false);
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "nurikabe", gameName: "Nurikabe",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Nurikabe",
      moveCount: sea.filter(Boolean).length, moves: [], reason: "Sea shaded",
      assisted: hintUsed || undefined,
    });
  }, [won, sea, hintUsed, addRecord]);

  const toggle = (i: number) => {
    if (clueAt.has(i)) return; // clue cells are always island
    setSea((a) => a.map((s, k) => (k === i ? !s : s)));
  };

  // Stage 1 highlights a wrongly-shaded cell; stage 2 sets it to the solution.
  const hint = () => {
    if (won) return;
    if (hintCell !== null) {
      const t = hintCell;
      setSea((a) => a.map((s, k) => (k === t ? puzzle.solution[t] : s)));
      setHintCell(null);
      return;
    }
    const t = puzzle.solution.findIndex((want, i) => !clueAt.has(i) && sea[i] !== want);
    if (t < 0) return;
    setHintUsed(true);
    setHintCell(t);
  };

  const tiles = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    const clue = clueAt.get(i);
    if (clue !== undefined) {
      tiles.push(<span key={i} className="nk-cell nk-clue">{clue}</span>);
    } else {
      tiles.push(<button key={i} className={`nk-cell${sea[i] ? " sea" : ""}${i === hintCell ? " lhint" : ""}`} onClick={() => toggle(i)} aria-label="cell" />);
    }
  }

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🌊 Nurikabe</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <span className="text-muted">islands in a connected sea</span>
      </div>

      <div className="nurikabe" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>{tiles}</div>

      <div className="logic-foot">
        {won
          ? <span className="bj-result bj-result--win">Solved! 🎉</span>
          : <span className="text-muted">Shade the sea so each number is an island of that size — no island touches, no 2×2 sea.</span>}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintCell !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
