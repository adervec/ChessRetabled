import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { SUITS, SUIT_SYMBOL } from "../../core/cards";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initEuchre, applyBid, euchreStep, playCard, legalPlays, nextHand, effSuit, type EuchreState,
} from "./logic";

const SEAT_LABEL = ["You", "Left", "Partner", "Right"];

const needsAuto = (s: EuchreState): boolean => {
  if (s.phase === "bid1" || s.phase === "bid2") return s.bidder !== 0;
  if (s.phase === "discard") return s.dealer !== 0;
  if (s.phase === "play") return s.turn !== 0;
  return false;
};

export function Euchre({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<EuchreState>(() => initEuchre(randomSeed()));
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const tok = useRef(0);

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "euchre", gameName: "Euchre",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.winner === 0 ? "win" : "loss", humanSide: "0", opponent: "AI",
      moveCount: s.handNo + 1, moves: [], reason: `${s.scores[0]}–${s.scores[1]}`,
    });
  }, [s, addRecord]);

  useEffect(() => {
    if (!needsAuto(s)) return;
    const t = ++tok.current;
    const id = setTimeout(() => { if (t === tok.current) setS((cur) => (needsAuto(cur) ? euchreStep(cur) : cur)); }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(id);
  }, [s, animSpeed]);

  const newGame = () => { recordedRef.current = false; startedRef.current = new Date().toISOString(); setS(initEuchre(randomSeed())); };

  const myBid = (s.phase === "bid1" || s.phase === "bid2") && s.bidder === 0;
  const myDiscard = s.phase === "discard" && s.dealer === 0;
  const myPlay = s.phase === "play" && s.turn === 0;
  const trump = s.trump;
  const led = s.phase === "play" && s.trick.length && trump ? effSuit(s.trick[0].card, trump) : null;
  const legalIds = myPlay && trump ? new Set(legalPlays(s.hands[0], led, trump).map((c) => c.id)) : new Set<string>();
  const downSuit = s.upCard.suit;

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "56px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🍁 Euchre</span>
        <button className="btn btn--sm" onClick={newGame}>↻ New</button>
      </div>

      <div className="gf-info">
        <span>Them {s.scores[1]}/10</span>
        <span>{trump ? `Trump ${SUIT_SYMBOL[trump]}` : "no trump yet"} · {SEAT_LABEL[s.dealer]} deals</span>
        <span>Us {s.scores[0]}/10</span>
      </div>

      <div className="euchre-mid">
        {(s.phase === "bid1" || s.phase === "bid2") && (
          <div className="euchre-up">
            <span className="c8-pile__label">{s.phase === "bid1" ? "Up" : "(turned down)"}</span>
            <PlayingCard card={s.upCard} dimmed={s.phase === "bid2"} />
          </div>
        )}
        {s.phase !== "bid1" && s.phase !== "bid2" && (
          <div className="euchre-trick">
            {s.trick.length === 0 && <span className="text-muted">{s.phase === "play" ? "—" : ""}</span>}
            {s.trick.map((t) => (
              <div key={t.card.id} className="euchre-trickcard">
                <span className="c8-pile__label">{SEAT_LABEL[t.seat]}</span>
                <PlayingCard card={t.card} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bj-msg">{s.message} {s.phase === "play" || s.phase === "handdone" ? `· tricks ${s.tricks[0]}–${s.tricks[1]}` : ""}</div>

      <div className={"c8-hand" + (myPlay || myDiscard ? " is-turn" : "")}>
        {s.hands[0].map((c) => {
          const clickable = myDiscard || (myPlay && legalIds.has(c.id));
          const onClick = myDiscard ? () => setS(applyBid(s, { type: "discard", cardId: c.id }))
            : myPlay && legalIds.has(c.id) ? () => setS(playCard(s, c.id)) : undefined;
          return <PlayingCard key={c.id} card={c} dimmed={myPlay && !legalIds.has(c.id)} onClick={clickable ? onClick : undefined} />;
        })}
      </div>

      <div className="cardtable__controls">
        {myBid && s.phase === "bid1" && (
          <>
            <button className="btn btn--sm btn--mint" onClick={() => setS(applyBid(s, { type: "orderup" }))}>Order up {SUIT_SYMBOL[s.upCard.suit]}</button>
            <button className="btn btn--sm btn--ghost" onClick={() => setS(applyBid(s, { type: "pass" }))}>Pass</button>
          </>
        )}
        {myBid && s.phase === "bid2" && (
          <>
            {SUITS.filter((x) => x !== downSuit).map((suit) => (
              <button key={suit} className="btn btn--sm btn--mint" onClick={() => setS(applyBid(s, { type: "name", suit }))}>Make {SUIT_SYMBOL[suit]}</button>
            ))}
            {s.bidder !== s.dealer && <button className="btn btn--sm btn--ghost" onClick={() => setS(applyBid(s, { type: "pass" }))}>Pass</button>}
          </>
        )}
        {s.phase === "handdone" && <button className="btn btn--sm btn--sky" onClick={() => setS(nextHand(s))}>Next hand →</button>}
        {s.phase === "done" && (
          <>
            <span className={"bj-result bj-result--" + (s.winner === 0 ? "win" : "loss")}>{s.message}</span>
            <button className="btn btn--sm btn--mint" onClick={newGame}>↻ New game</button>
          </>
        )}
      </div>
    </div>
  );
}
