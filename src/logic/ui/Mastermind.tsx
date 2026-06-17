import { useEffect, useRef, useState } from "react";
import { initMastermind, submitGuess, CODE_LENGTH, COLORS, MAX_GUESSES, type MMState } from "../mastermind";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const PEG = ["#e23b3b", "#ff9e2e", "#ffe14a", "#3ccf5a", "#3c9bff", "#b15aff"];

export function Mastermind({ onExit }: { onExit: () => void }) {
  const [mm, setMm] = useState<MMState>(() => initMastermind(randomSeed()));
  const [guess, setGuess] = useState<number[]>([]);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  useEffect(() => {
    if (mm.phase === "play" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "mastermind", gameName: "Mastermind",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: mm.phase === "won" ? "win" : "loss",
      humanSide: "solo", opponent: "Codemaker", moveCount: mm.guesses.length, moves: [],
      reason: mm.phase === "won" ? `Cracked in ${mm.guesses.length}` : "Out of guesses",
    });
  }, [mm, addRecord]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setMm(initMastermind(randomSeed()));
    setGuess([]);
  };

  const addPeg = (c: number) => {
    if (mm.phase !== "play" || guess.length >= CODE_LENGTH) return;
    setGuess((g) => [...g, c]);
  };
  const submit = () => {
    if (guess.length !== CODE_LENGTH) return;
    setMm((s) => submitGuess(s, guess));
    setGuess([]);
  };

  const rows = MAX_GUESSES;

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🎯 Mastermind</span>
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
                  <span key={i} className="mm-peg" style={{ background: pegs[i] ? PEG[pegs[i] - 1] : "transparent" }} />
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
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New code</button>
      </div>
    </div>
  );
}
