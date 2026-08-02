import { useEffect, useMemo, useRef, useState } from "react";
import { generate, satisfies, type NonoPuzzle } from "../nonogram";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 10;

export function Nonogram({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<NonoPuzzle>(() => generate(randomSeed(), SIZE));
  const [cells, setCells] = useState<number[]>(() => new Array(SIZE * SIZE).fill(0)); // 0 empty,1 fill,2 cross
  const [mode, setMode] = useState<"fill" | "cross">("fill");
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const won = useMemo(() => satisfies(cells, puzzle), [cells, puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setCells(new Array(SIZE * SIZE).fill(0));
    setHintCell(null);
    setHintUsed(false);
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "nonogram", gameName: "Nonogram",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Nonogram",
      moveCount: cells.filter((v) => v === 1).length, moves: [], reason: "Picture complete",
      assisted: hintUsed || undefined,
    });
  }, [won, cells, hintUsed, addRecord]);

  // Stage 1 highlights a cell whose fill state is wrong; stage 2 sets it right
  // (fill if the picture needs it, clear otherwise).
  const hint = () => {
    if (won) return;
    if (hintCell !== null) {
      const t = hintCell;
      setCells((c) => c.map((v, k) => (k === t ? (puzzle.solution[t] === 1 ? 1 : 0) : v)));
      setHintCell(null);
      return;
    }
    let target = -1;
    for (let i = 0; i < cells.length; i++) {
      if ((cells[i] === 1) !== (puzzle.solution[i] === 1)) { target = i; break; }
    }
    if (target < 0) return;
    setHintUsed(true);
    setHintCell(target);
  };

  const click = (i: number) => {
    setCells((c) => {
      const next = c.slice();
      if (mode === "fill") next[i] = next[i] === 1 ? 0 : 1;
      else next[i] = next[i] === 2 ? 0 : 2;
      return next;
    });
  };

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🖼 Nonogram</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <div className="settings__row">
          <button className={"chip-btn" + (mode === "fill" ? " is-on" : "")} onClick={() => setMode("fill")}>▣ Fill</button>
          <button className={"chip-btn" + (mode === "cross" ? " is-on" : "")} onClick={() => setMode("cross")}>✕ Mark</button>
        </div>
      </div>

      <div className="nono" style={{ ["--n" as string]: SIZE } as React.CSSProperties}>
        <div className="nono-corner" />
        {puzzle.cols.map((clue, c) => (
          <div key={"c" + c} className="nono-colclue">{clue.map((n, k) => <span key={k}>{n}</span>)}</div>
        ))}
        {Array.from({ length: SIZE }).map((_, r) => (
          <Row key={r} r={r} clue={puzzle.rows[r]} cells={cells} hintCell={hintCell} onClick={click} />
        ))}
      </div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">Match every row and column clue.</span>}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintCell !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}

function Row({ r, clue, cells, hintCell, onClick }: { r: number; clue: number[]; cells: number[]; hintCell: number | null; onClick: (i: number) => void }) {
  return (
    <>
      <div className="nono-rowclue">{clue.map((n, k) => <span key={k}>{n}</span>)}</div>
      {Array.from({ length: SIZE }).map((_, c) => {
        const i = r * SIZE + c;
        const v = cells[i];
        return (
          <button
            key={c}
            className={"nono-cell" + (v === 1 ? " fill" : v === 2 ? " cross" : "") + (c % 5 === 0 ? " block-l" : "") + (r % 5 === 0 ? " block-t" : "") + (i === hintCell ? " lhint" : "")}
            onClick={() => onClick(i)}
          >
            {v === 2 ? "✕" : ""}
          </button>
        );
      })}
    </>
  );
}
