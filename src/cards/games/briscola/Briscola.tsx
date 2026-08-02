import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { SUIT_SYMBOL, cardCode } from "../../core/cards";
import { briscolaPoints, briscolaStrength } from "../../core/italian";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import { initBriscola, applyMove, aiMove, type BriscolaState, type BriscolaMove } from "./logic";
import { useCardHint } from "../../ui/useCardHint";

export function Briscola({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<BriscolaState>(() => initBriscola(randomSeed()));
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const aiToken = useRef(0);
  const { hint, used, request, clear, resetUsed } = useCardHint<BriscolaMove>();

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "briscola", gameName: "Briscola",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.winner === 0 ? "win" : s.winner === 1 ? "loss" : "draw",
      humanSide: "0", opponent: "AI", moveCount: 40, moves: s.captured[0].map(cardCode),
      reason: `${s.scores[0]}–${s.scores[1]}`,
      assisted: used || undefined,
    });
  }, [s, addRecord, used]);

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
  const display = s.trick.length > 0 ? s.trick : s.lastTrick ?? [];
  const myPts = s.captured[0].reduce((n, c) => n + briscolaPoints(c.rank), 0);
  const oppPts = s.captured[1].reduce((n, c) => n + briscolaPoints(c.rank), 0);
  const newGame = () => { recordedRef.current = false; resetUsed(); setS(initBriscola(randomSeed())); };

  // Does the suggested card win a trick carrying points? (2-card trick: beat the
  // lead by trumping it or outranking it in its own suit.)
  const hintCard = hint ? s.hands[0].find((c) => c.id === hint.value.cardId) : undefined;
  const lead = s.trick.length > 0 ? s.trick[0].card : undefined;
  const hintGrabsPoints = !!hintCard && !!lead &&
    briscolaPoints(lead.rank) + briscolaPoints(hintCard.rank) > 0 &&
    (hintCard.suit === s.trump
      ? lead.suit !== s.trump || briscolaStrength(hintCard.rank) > briscolaStrength(lead.rank)
      : hintCard.suit === lead.suit && briscolaStrength(hintCard.rank) > briscolaStrength(lead.rank));
  const hintText = !hint || !hintCard
    ? null
    : hint.stage === 2
      ? "Play the highlighted card"
      : hintGrabsPoints
        ? "Best play is a point grab"
        : "Play safe and low";

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "64px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🇮🇹 Briscola</span>
        {used && <span className="tag" title="A hint was used — this game counts as assisted">💡 assisted</span>}
        <button className="btn btn--sm" onClick={newGame}>↻ New</button>
      </div>

      <div className="gf-info">
        <span className={s.turn === 1 && s.phase === "play" ? "is-turn" : ""}>Rival · {s.hands[1].length} cards · {oppPts} pts</span>
        <span>Trump {SUIT_SYMBOL[s.trump]} · stock {s.stock.length}</span>
      </div>

      <div className="brisc-table">
        <div className="brisc-trick">
          {display.map((t) => (
            <div key={t.card.id} className={"brisc-trick__card " + (t.seat === 0 ? "mine" : "theirs")}>
              <PlayingCard card={t.card} />
            </div>
          ))}
        </div>
        <div className="brisc-trump">
          <span className="c8-pile__label">Trump</span>
          <PlayingCard card={s.trumpCard} />
        </div>
      </div>

      <div className="bj-msg">{s.message}</div>
      <div className="gf-info"><span>You · {myPts} pts</span></div>

      <div className={"c8-hand" + (yourTurn ? " is-turn" : "")}>
        {s.hands[0].map((c) => (
          <PlayingCard
            key={c.id}
            card={c}
            selected={hint?.stage === 2 && hint.value.cardId === c.id}
            onClick={yourTurn ? () => { clear(); setS((cur) => applyMove(cur, { cardId: c.id })); } : undefined}
          />
        ))}
      </div>

      {s.phase !== "done" && (
        <div className="cardtable__controls">
          <button
            className="btn btn--sm btn--gold"
            onClick={() => request(() => aiMove(s, 0))}
            disabled={!yourTurn}
            title="Progressive hint — using it marks this game as assisted"
          >
            💡 {hint?.stage === 1 ? "Reveal" : "Hint"}
          </button>
          {hintText && <span className="tag">{hintText}</span>}
        </div>
      )}
      {s.phase === "done" && (
        <div className="cardtable__controls">
          <span className={"bj-result bj-result--" + (s.winner === 0 ? "win" : s.winner === 1 ? "loss" : "push")}>{s.message}</span>
          <button className="btn btn--sm btn--mint" onClick={newGame}>↻ New game</button>
        </div>
      )}
    </div>
  );
}
