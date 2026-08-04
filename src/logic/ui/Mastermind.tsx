import { useEffect, useRef, useState } from "react";
import { initMastermind, submitGuess, feedback, CODE_LENGTH, COLORS, MAX_GUESSES, type MMState } from "../mastermind";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import { useLogicSession } from "./useLogicSession";
import "./Logic.css";

const PEG = ["#e23b3b", "#ff9e2e", "#ffe14a", "#3ccf5a", "#3c9bff", "#b15aff"];

export function Mastermind({ onExit }: { onExit: () => void }) {
  const [mm, setMm] = useState<MMState>(() => initMastermind(randomSeed()));
  const [guess, setGuess] = useState<number[]>([]);
  const [hintSlot, setHintSlot] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  // Unfinished games survive closing the app, and show up in the bottom bar.
  useLogicSession("mastermind", mm.guesses.length, mm.phase !== "play");

  // A guess is rated on whether it could still be the answer given every reply
  // so far. Guessing a code your own feedback has already ruled out throws away
  // a turn, and that is the mistake worth showing back to the player.
  const solveLog = mm.guesses.map((g, i) => {
    const before = mm.guesses.slice(0, i);
    const possible = before.every((p) => {
      const fb = feedback(p.guess, g.guess);
      return fb.black === p.fb.black && fb.white === p.fb.white;
    });
    return {
      i,
      v: g.guess.join(""),
      ok: possible,
      undid: undefined,
    };
  });

  useEffect(() => {
    if (mm.phase === "play" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "mastermind", gameName: "Mastermind",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: mm.phase === "won" ? "win" : "loss",
      humanSide: "solo", opponent: "Codemaker", moveCount: mm.guesses.length, moves: solveLog,
      reason: mm.phase === "won" ? `Cracked in ${mm.guesses.length}` : "Out of guesses",
      assisted: hintUsed || undefined,
    });
  }, [mm, hintUsed, addRecord]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setMm(initMastermind(randomSeed()));
    setGuess([]);
    setHintSlot(null);
    setHintUsed(false);
  };

  const addPeg = (c: number) => {
    if (mm.phase !== "play" || guess.length >= CODE_LENGTH) return;
    setGuess((g) => [...g, c]);
  };
  const submit = () => {
    if (guess.length !== CODE_LENGTH) return;
    setMm((s) => submitGuess(s, guess));
    setGuess([]);
    setHintSlot(null);
  };

  // Stage 1 highlights the first wrong/missing slot of the working guess; stage 2 reveals it.
  const hint = () => {
    if (mm.phase !== "play") return;
    if (hintSlot !== null) {
      const t = Math.min(hintSlot, guess.length); // guess may have shrunk since stage 1
      const next = guess.slice();
      next[t] = mm.secret[t];
      setGuess(next);
      setHintSlot(null);
      return;
    }
    let t = 0;
    while (t < CODE_LENGTH && guess[t] === mm.secret[t]) t++;
    if (t >= CODE_LENGTH) return; // the working guess already is the code
    setHintUsed(true);
    setHintSlot(t);
  };

  const rows = MAX_GUESSES;

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🎯 Mastermind</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <span className="text-muted">{mm.guesses.length}/{rows}</span>
      </div>

      <div className="mm-board">
        {Array.from({ length: rows }).map((_, r) => {
          const past = mm.guesses[r];
          const isCurrent = r === mm.guesses.length && mm.phase === "play";
          const pegs = past ? past.guess : isCurrent ? guess : [];
          return (
            <div key={r} className={"mm-row" + (isCurrent ? " is-current" : "")}>
              <div className="mm-pegs">
                {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                  <span key={i} className={"mm-peg" + (isCurrent && i === hintSlot ? " lhint" : "")} style={{ background: pegs[i] ? PEG[pegs[i] - 1] : "transparent" }} />
                ))}
              </div>
              {past && (
                <div className="mm-fb">
                  {Array.from({ length: past.fb.black }).map((_, i) => <span key={"b" + i} className="mm-fbdot black" />)}
                  {Array.from({ length: past.fb.white }).map((_, i) => <span key={"w" + i} className="mm-fbdot white" />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {mm.phase !== "play" && (
        <div className="mm-secret">
          Code: {mm.secret.map((c, i) => <span key={i} className="mm-peg" style={{ background: PEG[c - 1] }} />)}
        </div>
      )}

      <div className="mm-palette">
        {Array.from({ length: COLORS }).map((_, i) => (
          <button key={i} className="mm-swatch" style={{ background: PEG[i] }} onClick={() => addPeg(i + 1)} disabled={mm.phase !== "play"} aria-label={`colour ${i + 1}`} />
        ))}
      </div>

      <div className="logic-foot">
        {mm.phase === "won" && <span className="bj-result bj-result--win">Cracked it in {mm.guesses.length}! 🎉</span>}
        {mm.phase === "lost" && <span className="bj-result bj-result--loss">Out of guesses.</span>}
        {mm.phase === "play" && (
          <>
            <button className="btn btn--sm" onClick={() => setGuess((g) => g.slice(0, -1))} disabled={guess.length === 0}>⌫</button>
            <button className="btn btn--sm btn--mint" onClick={submit} disabled={guess.length !== CODE_LENGTH}>Guess</button>
          </>
        )}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={mm.phase !== "play"}>{hintSlot !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New code</button>
      </div>
    </div>
  );
}
