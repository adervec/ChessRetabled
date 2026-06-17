import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { sortHand } from "../../core/helpers";
import { rankLabel, type Rank } from "../../core/cards";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import { initGoFish, applyMove, aiMove, legalRanks, type GFState } from "./logic";

export function GoFish({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<GFState>(() => initGoFish(randomSeed()));
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const aiToken = useRef(0);

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "gofish", gameName: "Go Fish",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.winner === 0 ? "win" : s.winner === 1 ? "loss" : "draw",
      humanSide: "0", opponent: "AI", moveCount: s.books[0].length + s.books[1].length,
      moves: [], reason: s.message,
    });
  }, [s, addRecord]);

  useEffect(() => {
    if (s.phase !== "ask" || s.turn !== 1) return;
    const token = ++aiToken.current;
    const t = setTimeout(() => {
      if (token !== aiToken.current) return;
      setS((cur) => (cur.phase === "ask" && cur.turn === 1 ? applyMove(cur, aiMove(cur, 1)) : cur));
    }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(t);
  }, [s, animSpeed]);

  const yourTurn = s.phase === "ask" && s.turn === 0;
  const ranks = yourTurn ? legalRanks(s, 0) : [];
  const newGame = () => { recordedRef.current = false; setS(initGoFish(randomSeed())); };

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "58px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🐟 Go Fish</span>
        <button className="btn btn--sm" onClick={newGame}>↻ New</button>
      </div>

      <div className="gf-info">
        <span className={s.turn === 1 && s.phase === "ask" ? "is-turn" : ""}>Rival · {s.hands[1].length} cards · {s.books[1].length} books</span>
        <span>Ocean: {s.stock.length}</span>
      </div>

      <div className="bj-msg">{s.message}</div>

      <div className="gf-books">
        {s.books[0].map((r) => <span key={"p" + r} className="gf-book gf-book--you">{rankLabel(r)}</span>)}
        {s.books[1].map((r) => <span key={"o" + r} className="gf-book gf-book--opp">{rankLabel(r)}</span>)}
      </div>

      <div className={"c8-hand" + (yourTurn ? " is-turn" : "")}>
        {sortHand(s.hands[0]).map((c) => <PlayingCard key={c.id} card={c} />)}
      </div>

      <div className="cardtable__controls">
        {yourTurn && <span className="bj-betlabel">Ask for:</span>}
        {yourTurn && ranks.map((r) => (
          <button key={r} className="btn btn--sm btn--gold" onClick={() => setS((cur) => applyMove(cur, { rank: r as Rank }))}>
            {rankLabel(r)}
          </button>
        ))}
        {s.phase === "done" && (
          <>
            <span className={"bj-result bj-result--" + (s.winner === 0 ? "win" : s.winner === 1 ? "loss" : "push")}>{s.message}</span>
            <button className="btn btn--sm btn--mint" onClick={newGame}>↻ New game</button>
          </>
        )}
      </div>
    </div>
  );
}
