import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { randomSeed } from "../../core/rng";
import { useArchive, newId } from "../../../state/useArchive";
import { initPoker, deal, draw, nextRound, type PokerState } from "./logic";

export function Poker({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<PokerState>(() => initPoker(randomSeed()));
  const [sel, setSel] = useState<number[]>([]);
  const addRecord = useArchive((a) => a.add);
  const startedRef = useRef(new Date().toISOString());

  useEffect(() => {
    if (s.phase !== "showdown" || s.result === null) return;
    addRecord({
      id: newId(), gameId: "poker", gameName: "Five-Card Draw",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.result === "win" ? "win" : s.result === "push" ? "draw" : "loss",
      humanSide: "player", opponent: "Dealer", moveCount: s.round + 1,
      moves: [], reason: s.message,
    });
  }, [s.phase, s.result, s.round, s.message, addRecord]);

  const onDeal = () => { setSel([]); setS(deal); };
  const onDraw = () => { setS((cur) => draw(cur, sel)); setSel([]); };
  const toggle = (i: number) =>
    setSel((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : cur.length < 3 ? [...cur, i] : cur));

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "76px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🂫 Five-Card Draw</span>
        <span className="chips">💰 {s.chips}{s.pot ? ` · pot ${s.pot}` : ""}</span>
      </div>

      <div className="bj-side">
        <div className="bj-label">Dealer {s.phase === "showdown" && s.aiRank ? `· ${s.aiRank.name}` : ""}</div>
        <div className="hand-row">
          {s.ai.length === 0 && <div className="pcard-slot" />}
          {s.ai.map((c) => <PlayingCard key={c.id} card={c} faceUp={s.phase === "showdown"} />)}
        </div>
      </div>

      <div className="bj-msg">{s.message}</div>

      <div className="bj-side">
        <div className="bj-label">You {s.phase === "showdown" && s.playerRank ? `· ${s.playerRank.name}` : s.phase === "draw" ? `· pick up to 3 to discard` : ""}</div>
        <div className="hand-row">
          {s.player.length === 0 && <div className="pcard-slot" />}
          {s.player.map((c, i) => (
            <PlayingCard
              key={c.id}
              card={c}
              selected={sel.includes(i)}
              onClick={s.phase === "draw" ? () => toggle(i) : undefined}
            />
          ))}
        </div>
      </div>

      <div className="cardtable__controls">
        {s.phase === "draw" && (
          <button className="btn btn--sm btn--mint" onClick={onDraw}>
            {sel.length ? `Discard ${sel.length} & draw` : "Stand pat"}
          </button>
        )}
        {(s.phase === "done") && s.chips >= s.ante && (
          <button className="btn btn--sm btn--gold" onClick={onDeal}>Ante {s.ante} & deal</button>
        )}
        {s.phase === "showdown" && (
          <>
            <span className={"bj-result bj-result--" + (s.result === "win" ? "win" : s.result === "push" ? "push" : "loss")}>{s.message}</span>
            <button className="btn btn--sm btn--mint" onClick={() => setS(nextRound)}>Next hand</button>
          </>
        )}
        {s.phase === "done" && s.chips < s.ante && (
          <button className="btn btn--sm btn--coral" onClick={() => setS(initPoker(randomSeed()))}>New stack (100)</button>
        )}
      </div>
    </div>
  );
}
