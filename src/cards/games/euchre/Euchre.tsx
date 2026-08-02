import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { SUITS, SUIT_SYMBOL } from "../../core/cards";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initEuchre, applyBid, euchreStep, playCard, legalPlays, nextHand, effSuit, aiBid, aiPlay,
  type EuchreState, type EuchreBid,
} from "./logic";
import { useCardHint } from "../../ui/useCardHint";

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
  const { hint, used, request, clear, resetUsed } = useCardHint<EuchreBid | { type: "play"; cardId: string }>();

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "euchre", gameName: "Euchre",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.winner === 0 ? "win" : "loss", humanSide: "0", opponent: "AI",
      moveCount: s.handNo + 1, moves: [], reason: `${s.scores[0]}–${s.scores[1]}`,
      assisted: used || undefined,
    });
  }, [s, addRecord, used]);

  useEffect(() => {
    if (!needsAuto(s)) return;
    const t = ++tok.current;
    const id = setTimeout(() => { if (t === tok.current) setS((cur) => (needsAuto(cur) ? euchreStep(cur) : cur)); }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(id);
  }, [s, animSpeed]);

  const newGame = () => { recordedRef.current = false; startedRef.current = new Date().toISOString(); resetUsed(); setS(initEuchre(randomSeed())); };

  const myBid = (s.phase === "bid1" || s.phase === "bid2") && s.bidder === 0;
  const myDiscard = s.phase === "discard" && s.dealer === 0;
  const myPlay = s.phase === "play" && s.turn === 0;
  const trump = s.trump;
  const led = s.phase === "play" && s.trick.length && trump ? effSuit(s.trick[0].card, trump) : null;
  const legalIds = myPlay && trump ? new Set(legalPlays(s.hands[0], led, trump).map((c) => c.id)) : new Set<string>();
  const downSuit = s.upCard.suit;

  const canHint = myBid || myDiscard || myPlay;
  const hintText = !hint
    ? null
    : hint.value.type === "pass" ? (hint.stage === 1 ? "The coach would pass" : "Pass")
    : hint.value.type === "orderup" ? (hint.stage === 1 ? "The coach would bid" : `Order up ${SUIT_SYMBOL[s.upCard.suit]}`)
    : hint.value.type === "name" ? (hint.stage === 1 ? "The coach would bid" : `Make ${SUIT_SYMBOL[hint.value.suit]}`)
    : hint.value.type === "discard" ? (hint.stage === 1 ? "There's a clear discard" : "Discard the highlighted card")
    : hint.stage === 1 ? "There's a right card to play" : "Play the highlighted card";
  const hintCardId =
    hint?.stage === 2 && (hint.value.type === "discard" || hint.value.type === "play") ? hint.value.cardId : null;

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "56px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🍁 Euchre</span>
        {used && <span className="tag" title="A hint was used — this game counts as assisted">💡 assisted</span>}
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
          const onClick = myDiscard ? () => { clear(); setS(applyBid(s, { type: "discard", cardId: c.id })); }
            : myPlay && legalIds.has(c.id) ? () => { clear(); setS(playCard(s, c.id)); } : undefined;
          return <PlayingCard key={c.id} card={c} selected={hintCardId === c.id} dimmed={myPlay && !legalIds.has(c.id)} onClick={clickable ? onClick : undefined} />;
        })}
      </div>

      <div className="cardtable__controls">
        {myBid && s.phase === "bid1" && (
          <>
            <button className="btn btn--sm btn--mint" onClick={() => { clear(); setS(applyBid(s, { type: "orderup" })); }}>Order up {SUIT_SYMBOL[s.upCard.suit]}</button>
            <button className="btn btn--sm btn--ghost" onClick={() => { clear(); setS(applyBid(s, { type: "pass" })); }}>Pass</button>
          </>
        )}
        {myBid && s.phase === "bid2" && (
          <>
            {SUITS.filter((x) => x !== downSuit).map((suit) => (
              <button key={suit} className="btn btn--sm btn--mint" onClick={() => { clear(); setS(applyBid(s, { type: "name", suit })); }}>Make {SUIT_SYMBOL[suit]}</button>
            ))}
            {s.bidder !== s.dealer && <button className="btn btn--sm btn--ghost" onClick={() => { clear(); setS(applyBid(s, { type: "pass" })); }}>Pass</button>}
          </>
        )}
        {s.phase === "handdone" && <button className="btn btn--sm btn--sky" onClick={() => { clear(); setS(nextHand(s)); }}>Next hand →</button>}
        {s.phase !== "done" && s.phase !== "handdone" && (
          <button
            className="btn btn--sm btn--gold"
            onClick={() => request(() => (myBid || myDiscard ? aiBid(s, 0) : myPlay ? { type: "play" as const, cardId: aiPlay(s, 0) } : null))}
            disabled={!canHint}
            title="Progressive hint — using it marks this game as assisted"
          >
            💡 {hint?.stage === 1 ? "Reveal" : "Hint"}
          </button>
        )}
        {s.phase !== "done" && s.phase !== "handdone" && hintText && <span className="tag">{hintText}</span>}
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
