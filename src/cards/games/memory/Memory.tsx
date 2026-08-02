import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs, ANIM_MS } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import { initMemory, reveal, resolve, aiPick, type MemState } from "./logic";

export function Memory({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<MemState>(() => initMemory(randomSeed()));
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const aiToken = useRef(0);

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "memory", gameName: "Memory",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.scores[0] > s.scores[1] ? "win" : s.scores[1] > s.scores[0] ? "loss" : "draw",
      humanSide: "0", opponent: "AI", moveCount: s.scores[0] + s.scores[1],
      moves: [], reason: `Pairs ${s.scores[0]}–${s.scores[1]}`,
    });
  }, [s, addRecord]);

  // flip mismatched cards back after a beat (both players)
  useEffect(() => {
    if (s.phase !== "resolve") return;
    const t = setTimeout(() => setS((cur) => resolve(cur)), Math.max(700, ANIM_MS[animSpeed] + 400));
    return () => clearTimeout(t);
  }, [s, animSpeed]);

  // AI takes its turn
  useEffect(() => {
    if (s.phase !== "pick" || s.turn !== 1) return;
    const token = ++aiToken.current;
    const t = setTimeout(() => {
      if (token !== aiToken.current) return;
      setS((cur) => (cur.phase === "pick" && cur.turn === 1 ? reveal(cur, aiPick(cur)) : cur));
    }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(t);
  }, [s, animSpeed]);

  const yourTurn = s.phase === "pick" && s.turn === 0;
  const newGame = () => { recordedRef.current = false; setS(initMemory(randomSeed())); };

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "62px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🧠 Memory</span>
        <button className="btn btn--sm" onClick={newGame}>↻ New</button>
      </div>

      <div className="gf-info">
        <span className={s.turn === 0 && s.phase !== "done" ? "is-turn" : ""}>You · {s.scores[0]} pairs</span>
        <span className={s.turn === 1 && s.phase !== "done" ? "is-turn" : ""}>AI · {s.scores[1]} pairs</span>
      </div>

      <div className="mem-grid">
        {s.cards.map((c, i) => {
          const up = s.matched[i] || s.faceUp.includes(i);
          const clickable = yourTurn && !up;
          return (
            <PlayingCard
              key={c.id}
              card={c}
              faceUp={up}
              dimmed={s.matched[i]}
              onClick={clickable ? () => setS((cur) => reveal(cur, i)) : undefined}
            />
          );
        })}
      </div>

      <div className="cardtable__controls">
        {s.phase === "done" ? (
          <>
            <span className={"bj-result bj-result--" + (s.scores[0] > s.scores[1] ? "win" : s.scores[0] < s.scores[1] ? "loss" : "push")}>{s.message}</span>
            <button className="btn btn--sm btn--mint" onClick={newGame}>↻ New game</button>
          </>
        ) : (
          <span className="c8-hint">{s.message}</span>
        )}
      </div>
    </div>
  );
}
