import { useEffect, useRef, useState } from "react";
import { generate, toggle, isSolved, type LightsPuzzle } from "../lightsout";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import { useSolveTrace } from "./useSolveLog";
import { useLogicSession } from "./useLogicSession";
import "./Logic.css";

type Diff = "easy" | "medium" | "hard";
const PRESSES: Record<Diff, number> = { easy: 4, medium: 7, hard: 11 };
const DIFFS: Diff[] = ["easy", "medium", "hard"];
const SIZE = 5;

export function LightsOut({ onExit }: { onExit: () => void }) {
  const [diff, setDiff] = useState<Diff>("medium");
  const [puzzle, setPuzzle] = useState<LightsPuzzle>(() => generate(randomSeed(), SIZE, PRESSES.medium));
  const [grid, setGrid] = useState<number[]>(() => puzzle.grid.slice());
  // One line catches every entry: the working array is watched for changes
  // rather than each click handler being instrumented separately.
  const trace = useSolveTrace(grid, undefined);
  const [moves, setMoves] = useState(0);
  // Parity of presses per cell — lets the hint compute the remaining solving
  // presses (solution XOR pressed-so-far) without re-solving the board.
  const [parity, setParity] = useState<boolean[]>(() => new Array(SIZE * SIZE).fill(false));
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const won = isSolved(grid);

  const newGame = (d: Diff) => {
    const p = generate(randomSeed(), SIZE, PRESSES[d]);
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(p);
    setGrid(p.grid.slice());
    setMoves(0);
    setParity(new Array(SIZE * SIZE).fill(false));
    setHintCell(null);
    setHintUsed(false);
  };

  // Unfinished grids survive closing the app, and show up in the bottom bar.
  useLogicSession("lightsout", moves, won);

  useEffect(() => {
    if (!won || recordedRef.current || moves === 0) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "lightsout", gameName: "Lights Out",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: `Lights Out · ${diff}`,
      moveCount: moves, moves: trace.events(), reason: `Cleared in ${moves} taps`,
      assisted: hintUsed || undefined,
    });
  }, [won, moves, diff, hintUsed, addRecord]);

  const press = (i: number) => {
    setGrid((g) => toggle(g, SIZE, i));
    setParity((p) => p.map((v, k) => (k === i ? !v : v)));
    setMoves((m) => m + 1);
  };
  const click = (i: number) => {
    if (won) return;
    setHintCell(null);
    press(i);
  };

  // A cell still needs a press iff it's in the generating solution an odd number
  // of times relative to what's been pressed. Stage 1 points at one; stage 2
  // presses it.
  const hint = () => {
    if (won) return;
    if (hintCell !== null) {
      press(hintCell);
      setHintCell(null);
      return;
    }
    const need = new Array(SIZE * SIZE).fill(false);
    for (const c of puzzle.solution) need[c] = !need[c];
    const target = need.findIndex((n, i) => n !== parity[i]);
    if (target < 0) return;
    setHintUsed(true);
    setHintCell(target);
  };

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">💡 Lights Out</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <div className="settings__row">
          {DIFFS.map((d) => (
            <button key={d} className={"chip-btn" + (d === diff ? " is-on" : "")} onClick={() => { setDiff(d); newGame(d); }}>{d}</button>
          ))}
        </div>
      </div>

      <div className="lights" style={{ ["--n" as string]: SIZE } as React.CSSProperties}>
        {grid.map((v, i) => (
          <button key={i} className={"lights-cell" + (v === 1 ? " on" : "") + (i === hintCell ? " lhint" : "")} onClick={() => click(i)} aria-label={v === 1 ? "on" : "off"} />
        ))}
      </div>

      <div className="logic-foot">
        {won && moves > 0 ? (
          <span className="bj-result bj-result--win">All out in {moves} taps! 🎉</span>
        ) : (
          <span className="text-muted">{moves} taps · click to toggle a cross of lights</span>
        )}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintCell !== null ? "💡 Press it" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={() => newGame(diff)}>↻ New puzzle</button>
      </div>
    </div>
  );
}
