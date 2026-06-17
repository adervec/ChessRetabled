import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { SUITS, SUIT_SYMBOL, cardCode, type Suit } from "../../core/cards";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initCrazyEights, applyMove, aiMove, legalPlays, options, topCard, type C8State,
} from "./logic";

const SEAT_NAMES = ["You", "West", "North", "East"];

export function CrazyEights({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<C8State>(() => initCrazyEights(randomSeed()));
  const [pendingEight, setPendingEight] = useState<string | null>(null);
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const aiToken = useRef(0);

  // archive on finish
  useEffect(() => {
    if (s.phase !== "done" || s.winner === null || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(),
      gameId: "crazy-eights",
      gameName: "Crazy Eights",
      startedISO: startedRef.current,
      endedISO: new Date().toISOString(),
      outcome: s.winner === 0 ? "win" : "loss",
      humanSide: "0",
      opponent: "3 AI",
      moveCount: s.discard.length,
      moves: s.discard.map(cardCode),
      reason: `${SEAT_NAMES[s.winner]} went out`,
    });
  }, [s, addRecord]);

  // AI seats play with a watchable delay
  useEffect(() => {
    if (s.phase !== "play" || s.turn === 0) return;
    const token = ++aiToken.current;
    const t = setTimeout(() => {
      if (token !== aiToken.current) return;
      setS((cur) => (cur.phase === "play" && cur.turn !== 0 ? applyMove(cur, aiMove(cur, cur.turn)) : cur));
    }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(t);
  }, [s, animSpeed]);

  const yourTurn = s.phase === "play" && s.turn === 0;
  const opt = yourTurn ? options(s, 0) : null;
  const playable = new Set(legalPlays(s, 0).map((c) => c.id));
  const top = topCard(s);

  const playCard = (cardId: string, suit?: Suit) => {
    setS((cur) => applyMove(cur, { type: "play", cardId, suit }));
    setPendingEight(null);
  };

  const onCardClick = (cardId: string, rank: number) => {
    if (!yourTurn || opt !== "play" || !playable.has(cardId)) return;
    if (rank === 8) setPendingEight(cardId);
    else playCard(cardId);
  };

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "62px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">8️⃣ Crazy Eights</span>
        <button className="btn btn--sm" onClick={() => { recordedRef.current = false; setS(initCrazyEights(randomSeed())); }}>↻ New</button>
      </div>

      <div className="c8-opponents">
        {[1, 2, 3].map((seat) => (
          <div key={seat} className={"c8-opp" + (s.turn === seat && s.phase === "play" ? " is-turn" : "")}>
            <div className="c8-opp__name">{SEAT_NAMES[seat]} · {s.hands[seat].length}</div>
            <div className="c8-opp__cards">
              {s.hands[seat].slice(0, 8).map((c) => (
                <PlayingCard key={c.id} faceUp={false} style={{ marginLeft: -38 }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="c8-center">
        <div className="c8-pile">
          <div className="c8-pile__label">Deck · {s.stock.length}</div>
          <PlayingCard faceUp={false} />
        </div>
        <div className="c8-pile">
          <div className="c8-pile__label">Suit: {SUIT_SYMBOL[s.activeSuit]}</div>
          <PlayingCard card={top} />
        </div>
      </div>

      <div className="c8-handzone">
        <div className={"c8-hand" + (yourTurn ? " is-turn" : "")}>
          {s.hands[0].map((c) => (
            <PlayingCard
              key={c.id}
              card={c}
              dimmed={yourTurn && opt === "play" && !playable.has(c.id)}
              onClick={yourTurn && opt === "play" ? () => onCardClick(c.id, c.rank) : undefined}
            />
          ))}
        </div>

        <div className="cardtable__controls">
          {s.phase === "done" && (
            <span className={"bj-result bj-result--" + (s.winner === 0 ? "win" : "loss")}>
              {s.winner === 0 ? "You went out — you win! 🎉" : `${SEAT_NAMES[s.winner ?? 0]} wins.`}
            </span>
          )}
          {yourTurn && opt === "draw" && (
            <button className="btn btn--sm btn--sky" onClick={() => setS((c) => applyMove(c, { type: "draw" }))}>
              Draw a card
            </button>
          )}
          {yourTurn && opt === "pass" && (
            <button className="btn btn--sm" onClick={() => setS((c) => applyMove(c, { type: "pass" }))}>
              Pass
            </button>
          )}
          {yourTurn && opt === "play" && <span className="c8-hint">Play a card matching {SUIT_SYMBOL[s.activeSuit]} or rank {top.rank === 8 ? "8" : top.rank}.</span>}
        </div>
      </div>

      {pendingEight && (
        <div className="c8-suitpick">
          <div className="c8-suitpick__card">
            <p>Choose a suit for your 8:</p>
            <div className="c8-suitpick__suits">
              {SUITS.map((su) => (
                <button key={su} className={"c8-suitbtn " + (su === "H" || su === "D" ? "red" : "black")} onClick={() => playCard(pendingEight, su)}>
                  {SUIT_SYMBOL[su]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
