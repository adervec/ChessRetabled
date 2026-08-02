import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { randomSeed } from "../../core/rng";
import { useArchive, newId } from "../../../state/useArchive";
import { initWar, step, type WarState } from "./logic";

export function War({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<WarState>(() => initWar(randomSeed()));
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(),
      gameId: "war",
      gameName: "War",
      startedISO: startedRef.current,
      endedISO: new Date().toISOString(),
      outcome: s.winner === 0 ? "win" : s.winner === 1 ? "loss" : "draw",
      humanSide: "0",
      opponent: "Rival",
      moveCount: s.rounds,
      moves: [],
      reason: s.message,
    });
  }, [s, addRecord]);

  const b = s.lastBattle;
  const newGame = () => { recordedRef.current = false; setS(initWar(randomSeed())); };

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "84px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">⚔️ War</span>
        <button className="btn btn--sm" onClick={newGame}>↻ New</button>
      </div>

      <div className="war-row">
        <div className="war-side">
          <div className="bj-label">Rival · {s.decks[1].length} cards</div>
          {b && b.stake1.length > 0 ? <PlayingCard card={b.stake1[b.stake1.length - 1]} /> : <PlayingCard faceUp={false} />}
        </div>
        <div className="war-vs">{b && b.wars > 0 ? `WAR ×${b.wars}` : "vs"}</div>
        <div className="war-side">
          <div className="bj-label">You · {s.decks[0].length} cards</div>
          {b && b.stake0.length > 0 ? <PlayingCard card={b.stake0[b.stake0.length - 1]} /> : <PlayingCard faceUp={false} />}
        </div>
      </div>

      <div className="bj-msg">{s.message}</div>

      <div className="cardtable__controls">
        {s.phase === "play" ? (
          <button className="btn btn--mint" onClick={() => setS(step)}>⚔️ Flip</button>
        ) : (
          <>
            <span className={"bj-result bj-result--" + (s.winner === 0 ? "win" : s.winner === 1 ? "loss" : "push")}>{s.message}</span>
            <button className="btn btn--sm btn--mint" onClick={newGame}>↻ New game</button>
          </>
        )}
      </div>
    </div>
  );
}
