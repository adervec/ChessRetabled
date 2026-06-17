import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { randomSeed } from "../../core/rng";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initHoldem, deal, playerCheck, playerBet, playerCall, playerFold, nextRound, type HEState,
} from "./logic";

export function Holdem({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<HEState>(() => initHoldem(randomSeed()));
  const addRecord = useArchive((a) => a.add);
  const startedRef = useRef(new Date().toISOString());

  useEffect(() => {
    if (s.phase !== "showdown" || s.result === null) return;
    addRecord({
      id: newId(), gameId: "holdem", gameName: "Texas Hold'em",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.result === "win" ? "win" : s.result === "push" ? "draw" : "loss",
      humanSide: "player", opponent: "Dealer", moveCount: s.round + 1, moves: [], reason: s.message,
    });
  }, [s.phase, s.result, s.round, s.message, addRecord]);

  const board = s.board.slice(0, s.revealed);

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "66px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🃏 Texas Hold'em</span>
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
          <button className="btn btn--sm btn--gold" onClick={() => setS(deal)}>Ante {s.ante} & deal</button>
        )}
        {s.phase === "ready" && s.chips < s.ante && (
          <button className="btn btn--sm btn--coral" onClick={() => setS(initHoldem(randomSeed()))}>New stack (100)</button>
        )}
        {s.phase === "bet" && (
          <>
            <button className="btn btn--sm btn--sky" onClick={() => setS(playerCheck)}>Check</button>
            <button className="btn btn--sm btn--mint" disabled={s.chips < s.betSize} onClick={() => setS(playerBet)}>Bet {s.betSize}</button>
          </>
        )}
        {s.phase === "callfold" && (
          <>
            <button className="btn btn--sm btn--mint" disabled={s.chips < s.betSize} onClick={() => setS(playerCall)}>Call {s.betSize}</button>
            <button className="btn btn--sm btn--coral" onClick={() => setS(playerFold)}>Fold</button>
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
