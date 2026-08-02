import { useEffect, useMemo, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { sortHand } from "../../core/helpers";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import { bestMeld, bestDiscard } from "./melds";
import {
  initGin, drawStock, drawDiscard, discardCard, knock, canKnock, deadwood, aiTurn, type GinState,
} from "./logic";
import { useCardHint } from "../../ui/useCardHint";

type GinHint =
  | { kind: "draw"; source: "stock" | "discard" }
  | { kind: "discard"; cardId: string }
  | { kind: "knock" };

export function Gin({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<GinState>(() => initGin(randomSeed()));
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const aiToken = useRef(0);
  const { hint, used, request, clear, resetUsed } = useCardHint<GinHint>();

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "gin", gameName: "Gin Rummy",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.winner === 0 ? "win" : "loss",
      humanSide: "0", opponent: "AI", moveCount: s.scores[s.winner ?? 0], moves: [], reason: s.message,
      assisted: used || undefined,
    });
  }, [s, addRecord, used]);

  useEffect(() => {
    if (s.phase === "done" || s.turn !== 1) return;
    const token = ++aiToken.current;
    const t = setTimeout(() => {
      if (token !== aiToken.current) return;
      setS((cur) => (cur.phase !== "done" && cur.turn === 1 ? aiTurn(cur) : cur));
    }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(t);
  }, [s, animSpeed]);

  const yourTurn = s.turn === 0 && s.phase !== "done";
  const analysis = useMemo(() => bestMeld(s.hands[0]), [s.hands]);
  const deadwoodIds = useMemo(() => new Set(analysis.deadwood.map((c) => c.id)), [analysis]);
  const discardTop = s.discard[s.discard.length - 1];
  const newGame = () => { recordedRef.current = false; resetUsed(); setS(initGin(randomSeed())); };

  const computeHint = (): GinHint | null => {
    if (!yourTurn) return null;
    if (s.phase === "draw") {
      // Take the discard only if it strictly lowers deadwood vs. the hand as it stands.
      const source =
        discardTop && bestDiscard([...s.hands[0], discardTop]).deadwoodValue < deadwood(s.hands[0])
          ? ("discard" as const)
          : ("stock" as const);
      return { kind: "draw", source };
    }
    if (s.phase === "discard") {
      if (canKnock(s)) return { kind: "knock" };
      return { kind: "discard", cardId: bestDiscard(s.hands[0]).cardId };
    }
    return null;
  };
  const hintText = !hint
    ? null
    : hint.value.kind === "draw"
      ? hint.stage === 1 ? "The draw choice matters here" : hint.value.source === "discard" ? "Take from the discard pile" : "Draw from the stock"
      : hint.value.kind === "knock"
        ? hint.stage === 1 ? "You could end the hand" : deadwood(s.hands[0]) === 0 ? "Go Gin!" : "Knock now"
        : hint.stage === 1 ? "There's a clear discard" : "Discard the highlighted card";

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "56px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🌿 Gin Rummy</span>
        {used && <span className="tag" title="A hint was used — this game counts as assisted">💡 assisted</span>}
        <button className="btn btn--sm" onClick={newGame}>↻ New</button>
      </div>

      <div className="gf-info">
        <span className={s.turn === 1 && s.phase !== "done" ? "is-turn" : ""}>Rival · {s.hands[1].length} cards</span>
        <span>Deadwood: <b>{deadwood(s.hands[0])}</b></span>
      </div>

      <div className="gin-piles">
        <div className="c8-pile">
          <div className="c8-pile__label">Stock · {s.stock.length}</div>
          {s.stock.length > 0 ? <PlayingCard faceUp={false} /> : <div className="pcard-slot" />}
        </div>
        <div className="c8-pile">
          <div className="c8-pile__label">Discard</div>
          {discardTop ? <PlayingCard card={discardTop} /> : <div className="pcard-slot" />}
        </div>
      </div>

      <div className="bj-msg">{s.message}</div>

      <div className={"c8-hand" + (yourTurn ? " is-turn" : "")}>
        {sortHand(s.hands[0]).map((c) => (
          <PlayingCard
            key={c.id}
            card={c}
            selected={hint?.stage === 2 && hint.value.kind === "discard" && hint.value.cardId === c.id}
            dimmed={deadwoodIds.has(c.id)}
            onClick={yourTurn && s.phase === "discard" ? () => { clear(); setS((cur) => discardCard(cur, c.id)); } : undefined}
          />
        ))}
      </div>

      <div className="cardtable__controls">
        {yourTurn && s.phase === "draw" && (
          <>
            <button className="btn btn--sm btn--sky" disabled={s.stock.length === 0} onClick={() => { clear(); setS(drawStock); }}>Draw stock</button>
            {discardTop && <button className="btn btn--sm" onClick={() => { clear(); setS(drawDiscard); }}>Take discard</button>}
          </>
        )}
        {yourTurn && s.phase === "discard" && (
          <>
            <span className="c8-hint">Click a card to discard{canKnock(s) ? ", or knock" : ""}.</span>
            {canKnock(s) && <button className="btn btn--sm btn--mint" onClick={() => { clear(); setS((cur) => knock(cur)); }}>{deadwood(s.hands[0]) === 0 ? "Gin!" : "Knock"}</button>}
          </>
        )}
        {s.phase !== "done" && (
          <button
            className="btn btn--sm btn--gold"
            onClick={() => request(computeHint)}
            disabled={!yourTurn}
            title="Progressive hint — using it marks this game as assisted"
          >
            💡 {hint?.stage === 1 ? "Reveal" : "Hint"}
          </button>
        )}
        {s.phase !== "done" && hintText && <span className="tag">{hintText}</span>}
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
