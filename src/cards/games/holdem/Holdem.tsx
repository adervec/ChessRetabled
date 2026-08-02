import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { randomSeed } from "../../core/rng";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initHoldem, deal, playerCheck, playerBet, playerCall, playerFold, nextRound, bestHand, type HEState,
} from "./logic";
import { useCardHint } from "../../ui/useCardHint";

export function Holdem({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<HEState>(() => initHoldem(randomSeed()));
  const addRecord = useArchive((a) => a.add);
  const startedRef = useRef(new Date().toISOString());
  const { hint, used, request, clear, resetUsed } = useCardHint<"bet" | "check" | "call" | "fold">();

  useEffect(() => {
    if (s.phase !== "showdown" || s.result === null) return;
    addRecord({
      id: newId(), gameId: "holdem", gameName: "Texas Hold'em",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.result === "win" ? "win" : s.result === "push" ? "draw" : "loss",
      humanSide: "player", opponent: "Dealer", moveCount: s.round + 1, moves: [], reason: s.message,
      assisted: used || undefined,
    });
  }, [s.phase, s.result, s.round, s.message, addRecord, used]);

  const board = s.board.slice(0, s.revealed);

  // ponytail: coarse strength heuristic — a made pair (or pocket pair preflop) bets/calls, anything less checks/folds
  const holdemAdvice = (): "bet" | "check" | "call" | "fold" | null => {
    if (s.phase !== "bet" && s.phase !== "callfold") return null;
    const cards = [...s.hole[0], ...board];
    const paired = cards.length >= 5
      ? bestHand(cards).category >= 1
      : s.hole[0].length === 2 && s.hole[0][0].rank === s.hole[0][1].rank;
    if (s.phase === "bet") return paired ? "bet" : "check";
    return paired ? "call" : "fold";
  };
  const hintText = !hint
    ? null
    : hint.stage === 1
      ? "The maths leans one way"
      : { bet: "Bet", check: "Check", call: "Call", fold: "Fold" }[hint.value];
  const glow = (a: "bet" | "check" | "call" | "fold") =>
    hint?.stage === 2 && hint.value === a ? { outline: "4px solid var(--sky)" } : undefined;
  const hintBtn = (
    <button
      className="btn btn--sm btn--gold"
      onClick={() => request(holdemAdvice)}
      title="Progressive hint — using it marks this game as assisted"
    >
      💡 {hint?.stage === 1 ? "Reveal" : "Hint"}
    </button>
  );

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "66px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🃏 Texas Hold'em</span>
        {used && <span className="tag" title="A hint was used — this game counts as assisted">💡 assisted</span>}
        <span className="chips">💰 {s.chips}{s.pot ? ` · pot ${s.pot}` : ""}</span>
      </div>

      <div className="bj-side">
        <div className="bj-label">Dealer {s.showAi && s.aiRank ? `· ${s.aiRank.name}` : ""}</div>
        <div className="hand-row">
          {s.hole[1].length === 0 ? <div className="pcard-slot" /> : s.hole[1].map((c) => <PlayingCard key={c.id} card={c} faceUp={s.showAi} />)}
        </div>
      </div>

      <div className="he-board">
        <div className="bj-label">Community</div>
        <div className="hand-row">
          {board.length === 0 ? <div className="pcard-slot" /> : board.map((c) => <PlayingCard key={c.id} card={c} />)}
        </div>
      </div>

      <div className="bj-msg">{s.message}</div>

      <div className="bj-side">
        <div className="bj-label">You {s.showAi && s.playerRank ? `· ${s.playerRank.name}` : ""}</div>
        <div className="hand-row">
          {s.hole[0].length === 0 ? <div className="pcard-slot" /> : s.hole[0].map((c) => <PlayingCard key={c.id} card={c} />)}
        </div>
      </div>

      <div className="cardtable__controls">
        {s.phase === "ready" && s.chips >= s.ante && (
          <button className="btn btn--sm btn--gold" onClick={() => { resetUsed(); setS(deal); }}>Ante {s.ante} & deal</button>
        )}
        {s.phase === "ready" && s.chips < s.ante && (
          <button className="btn btn--sm btn--coral" onClick={() => { resetUsed(); setS(initHoldem(randomSeed())); }}>New stack (100)</button>
        )}
        {s.phase === "bet" && (
          <>
            <button className="btn btn--sm btn--sky" style={glow("check")} onClick={() => { clear(); setS(playerCheck); }}>Check</button>
            <button className="btn btn--sm btn--mint" style={glow("bet")} disabled={s.chips < s.betSize} onClick={() => { clear(); setS(playerBet); }}>Bet {s.betSize}</button>
            {hintBtn}
            {hintText && <span className="tag">{hintText}</span>}
          </>
        )}
        {s.phase === "callfold" && (
          <>
            <button className="btn btn--sm btn--mint" style={glow("call")} disabled={s.chips < s.betSize} onClick={() => { clear(); setS(playerCall); }}>Call {s.betSize}</button>
            <button className="btn btn--sm btn--coral" style={glow("fold")} onClick={() => { clear(); setS(playerFold); }}>Fold</button>
            {hintBtn}
            {hintText && <span className="tag">{hintText}</span>}
          </>
        )}
        {s.phase === "showdown" && (
          <>
            <span className={"bj-result bj-result--" + (s.result === "win" ? "win" : s.result === "push" ? "push" : "loss")}>{s.message}</span>
            <button className="btn btn--sm btn--mint" onClick={() => setS(nextRound)}>Next hand</button>
          </>
        )}
      </div>
    </div>
  );
}
