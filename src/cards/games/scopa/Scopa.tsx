import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { cardCode } from "../../core/cards";
import { COINS } from "../../core/italian";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import { initScopa, applyMove, aiMove, captureOptions, bestCapture, type ScopaState } from "./logic";

export function Scopa({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<ScopaState>(() => initScopa(randomSeed()));
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const aiToken = useRef(0);

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "scopa", gameName: "Scopa",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.winner === 0 ? "win" : s.winner === 1 ? "loss" : "draw",
      humanSide: "0", opponent: "AI", moveCount: 40, moves: s.captured[0].map(cardCode),
      reason: `${s.scores[0]}–${s.scores[1]}`,
    });
  }, [s, addRecord]);

  useEffect(() => {
    if (s.phase !== "play" || s.turn !== 1) return;
    const token = ++aiToken.current;
    const t = setTimeout(() => {
      if (token !== aiToken.current) return;
      setS((cur) => (cur.phase === "play" && cur.turn === 1 ? applyMove(cur, aiMove(cur, 1)) : cur));
    }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(t);
  }, [s, animSpeed]);

  const yourTurn = s.phase === "play" && s.turn === 0;
  const coins = (cards: ScopaState["captured"][number]) => cards.filter((c) => c.suit === COINS).length;
  const play = (cardId: string) => setS((cur) => {
    const card = cur.hands[0].find((c) => c.id === cardId);
    if (!card) return cur;
    const opts = captureOptions(cur.table, card);
    const captureIds = opts.length ? bestCapture(opts).map((c) => c.id) : [];
    return applyMove(cur, { cardId, captureIds });
  });
  const newGame = () => { recordedRef.current = false; startedRef.current = new Date().toISOString(); setS(initScopa(randomSeed())); };

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "60px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🇮🇹 Scopa</span>
        <button className="btn btn--sm" onClick={newGame}>↻ New</button>
      </div>

      <div className="gf-info">
        <span className={s.turn === 1 && s.phase === "play" ? "is-turn" : ""}>Rival · {s.hands[1].length} in hand · {s.captured[1].length} taken ({coins(s.captured[1])}♦) · scope {s.scopas[1]}</span>
        <span>stock {s.stock.length}</span>
      </div>

      <div className="scopa-table">
        {s.table.length === 0 && <span className="text-muted">table is empty</span>}
        {s.table.map((c) => <PlayingCard key={c.id} card={c} />)}
      </div>

      <div className="bj-msg">{s.message}{s.breakdown ? ` — ${s.breakdown}` : ""}</div>
      <div className="gf-info"><span>You · {s.captured[0].length} taken ({coins(s.captured[0])}♦) · scope {s.scopas[0]}</span></div>

      <div className={"c8-hand" + (yourTurn ? " is-turn" : "")}>
        {s.hands[0].map((c) => (
          <PlayingCard key={c.id} card={c} onClick={yourTurn ? () => play(c.id) : undefined} />
        ))}
      </div>

      {s.phase === "done" && (
        <div className="cardtable__controls">
          <span className={"bj-result bj-result--" + (s.winner === 0 ? "win" : s.winner === 1 ? "loss" : "push")}>{s.message}</span>
          <button className="btn btn--sm btn--mint" onClick={newGame}>↻ New game</button>
        </div>
      )}
    </div>
  );
}
