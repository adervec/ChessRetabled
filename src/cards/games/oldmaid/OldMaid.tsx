import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { sortHand } from "../../core/helpers";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import { initOldMaid, step, type OMState } from "./logic";

const NAMES = ["You", "Bot Lee", "Bot Mae"];

export function OldMaid({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<OMState>(() => initOldMaid(randomSeed()));
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const aiToken = useRef(0);

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "oldmaid", gameName: "Old Maid",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.loser === 0 ? "loss" : "win",
      humanSide: "0", opponent: "2 AI", moveCount: s.draws, moves: [], reason: s.message,
    });
  }, [s, addRecord]);

  useEffect(() => {
    if (s.phase !== "play" || s.turn === 0) return;
    const token = ++aiToken.current;
    const t = setTimeout(() => {
      if (token !== aiToken.current) return;
      setS((cur) => (cur.phase === "play" && cur.turn !== 0 ? step(cur) : cur));
    }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(t);
  }, [s, animSpeed]);

  const yourTurn = s.phase === "play" && s.turn === 0;
  const target = (s.turn + 1) % 3;
  const newGame = () => { recordedRef.current = false; setS(initOldMaid(randomSeed())); };

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "52px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">👵 Old Maid</span>
        <button className="btn btn--sm" onClick={newGame}>↻ New</button>
      </div>

      <div className="gf-info">
        {[1, 2].map((seat) => (
          <span key={seat} className={s.turn === seat && s.phase === "play" ? "is-turn" : ""}>
            {NAMES[seat]} · {s.hands[seat].length}🂠
          </span>
        ))}
      </div>

      <div className="bj-msg">{s.message}</div>

      <div className={"c8-hand" + (yourTurn ? " is-turn" : "")}>
        {s.hands[0].length === 0 ? <span className="c8-hint">You're safe — out of cards!</span> : sortHand(s.hands[0]).map((c) => <PlayingCard key={c.id} card={c} />)}
      </div>

      <div className="cardtable__controls">
        {yourTurn && s.hands[0].length > 0 && (
          <button className="btn btn--mint" onClick={() => setS(step)}>Draw from {NAMES[target]}</button>
        )}
        {s.phase === "done" && (
          <>
            <span className={"bj-result bj-result--" + (s.loser === 0 ? "loss" : "win")}>{s.message}</span>
            <button className="btn btn--sm btn--mint" onClick={newGame}>↻ New game</button>
          </>
        )}
      </div>
    </div>
  );
}
