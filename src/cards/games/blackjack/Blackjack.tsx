import { useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { blackjackValue } from "../../core/helpers";
import { cardCode } from "../../core/cards";
import { randomSeed } from "../../core/rng";
import {
  initBlackjack,
  placeBet,
  hit,
  stand,
  double,
  nextRound,
  canDouble,
  basicStrategy,
  type BJState,
} from "./logic";
import { useArchive, newId } from "../../../state/useArchive";
import { useCardHint } from "../../ui/useCardHint";

const CHIP_OPTIONS = [10, 25, 50];

export function Blackjack({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<BJState>(() => initBlackjack(randomSeed()));
  const addRecord = useArchive((a) => a.add);
  const recordedRound = useRef(-1);
  const startedRef = useRef(new Date().toISOString());
  const { hint, used, request, clear, resetUsed } = useCardHint<"hit" | "stand" | "double">();
  // record() runs synchronously inside act(), so mirror `used` in a ref to stay accurate.
  const usedRef = useRef(false);
  const newHand = () => { usedRef.current = false; resetUsed(); };

  function record(state: BJState) {
    if (state.phase !== "done" || recordedRound.current === state.rounds) return;
    recordedRound.current = state.rounds;
    const outcome =
      state.result === "win" || state.result === "blackjack"
        ? "win"
        : state.result === "push"
        ? "draw"
        : "loss";
    addRecord({
      id: newId(),
      gameId: "blackjack",
      gameName: "Blackjack",
      startedISO: startedRef.current,
      endedISO: new Date().toISOString(),
      outcome,
      humanSide: "player",
      opponent: "Dealer",
      moveCount: state.player.length,
      moves: [...state.player, ...state.dealer].map(cardCode),
      reason: state.message,
      assisted: usedRef.current || undefined,
    });
  }

  const act = (fn: (st: BJState) => BJState) =>
    setS((prev) => {
      const next = fn(prev);
      record(next);
      return next;
    });

  const dealerHidden = s.phase === "player";
  const dealerShown = dealerHidden ? s.dealer.slice(0, 1) : s.dealer;
  const pv = blackjackValue(s.player).total;
  const dv = blackjackValue(dealerShown).total;
  const hintText = !hint
    ? null
    : hint.stage === 1
      ? "Strategy has a clear answer here"
      : hint.value === "hit" ? "Hit" : hint.value === "stand" ? "Stand" : "Double";
  const glow = (a: "hit" | "stand" | "double") =>
    hint?.stage === 2 && hint.value === a ? { outline: "4px solid var(--sky)" } : undefined;

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "84px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🂡 Blackjack</span>
        {used && <span className="tag" title="A hint was used — this game counts as assisted">💡 assisted</span>}
        <span className="chips">💰 {s.chips}</span>
      </div>

      <div className="bj-area">
        <div className="bj-side">
          <div className="bj-label">Dealer {s.dealer.length > 0 ? `· ${dealerHidden ? dv + " +?" : dv}` : ""}</div>
          <div className="hand-row">
            {s.dealer.length === 0 && <div className="pcard-slot" />}
            {s.dealer.map((c, i) => (
              <PlayingCard key={c.id} card={c} faceUp={!(dealerHidden && i > 0)} />
            ))}
          </div>
        </div>

        <div className="bj-msg">{s.message}</div>

        <div className="bj-side">
          <div className="bj-label">You {s.player.length > 0 ? `· ${pv}` : ""}</div>
          <div className="hand-row">
            {s.player.length === 0 && <div className="pcard-slot" />}
            {s.player.map((c) => (
              <PlayingCard key={c.id} card={c} />
            ))}
          </div>
        </div>
      </div>

      <div className="cardtable__controls">
        {s.phase === "bet" && s.chips > 0 && (
          <>
            <span className="bj-betlabel">Bet:</span>
            {CHIP_OPTIONS.map((c) => (
              <button key={c} className="btn btn--sm btn--gold" disabled={s.chips < c} onClick={() => { newHand(); act((st) => placeBet(st, c)); }}>
                {c}
              </button>
            ))}
            <button className="btn btn--sm" onClick={() => { newHand(); act((st) => placeBet(st, st.chips)); }}>
              All in
            </button>
          </>
        )}
        {s.phase === "player" && (
          <>
            <button className="btn btn--sm btn--mint" style={glow("hit")} onClick={() => { clear(); act(hit); }}>Hit</button>
            <button className="btn btn--sm btn--sky" style={glow("stand")} onClick={() => { clear(); act(stand); }}>Stand</button>
            <button className="btn btn--sm" style={glow("double")} disabled={!canDouble(s)} onClick={() => { clear(); act(double); }}>Double</button>
            <button
              className="btn btn--sm btn--gold"
              onClick={() => { usedRef.current = true; request(() => basicStrategy(s.player, s.dealer[0], canDouble(s))); }}
              title="Progressive hint — using it marks this game as assisted"
            >
              💡 {hint?.stage === 1 ? "Reveal" : "Hint"}
            </button>
            {hintText && <span className="tag">{hintText}</span>}
          </>
        )}
        {s.phase === "done" && (
          <>
            <span className={"bj-result bj-result--" + (s.result === "loss" ? "loss" : s.result === "push" ? "push" : "win")}>
              {s.message}
            </span>
            {s.chips > 0 ? (
              <button className="btn btn--sm btn--mint" onClick={() => act(nextRound)}>Next hand</button>
            ) : (
              <button className="btn btn--sm btn--coral" onClick={() => { newHand(); setS(initBlackjack(randomSeed())); }}>
                New stack (100)
              </button>
            )}
          </>
        )}
        {s.phase === "bet" && s.chips <= 0 && (
          <button className="btn btn--sm btn--coral" onClick={() => { newHand(); setS(initBlackjack(randomSeed())); }}>
            New stack (100 chips)
          </button>
        )}
      </div>
    </div>
  );
}
