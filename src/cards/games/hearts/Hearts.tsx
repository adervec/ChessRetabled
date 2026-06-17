import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { cardCode } from "../../core/cards";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import { initHearts, applyMove, aiMove, legalMoves, pointsOf, type HeartsState } from "./logic";

const SEAT_NAMES = ["You", "West", "North", "East"];
const POS = ["pos-bottom", "pos-left", "pos-top", "pos-right"];

export function Hearts({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<HeartsState>(() => initHearts(randomSeed()));
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const aiToken = useRef(0);

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    const min = Math.min(...s.scores);
    addRecord({
      id: newId(),
      gameId: "hearts",
      gameName: "Hearts",
      startedISO: startedRef.current,
      endedISO: new Date().toISOString(),
      outcome: s.scores[0] === min ? "win" : "loss",
      humanSide: "0",
      opponent: "3 AI",
      moveCount: 52,
      moves: s.taken.flat().map(cardCode),
      reason: `Scores ${s.scores.join("–")}`,
    });
  }, [s, addRecord]);

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
  const legal = new Set(yourTurn ? legalMoves(s, 0).map((c) => c.id) : []);
  const display = s.trick.length > 0 ? s.trick : s.lastTrick ?? [];
  const livePoints = s.taken.map((cards) => cards.reduce((n, c) => n + pointsOf(c), 0));

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "58px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">♥️ Hearts</span>
        <button className="btn btn--sm" onClick={() => { recordedRef.current = false; setS(initHearts(randomSeed())); }}>↻ New</button>
      </div>

      <div className="hearts-scores">
        {SEAT_NAMES.map((n, i) => (
          <span key={i} className={"hearts-score" + (s.turn === i && s.phase === "play" ? " is-turn" : "")}>
            {n}: <b>{s.phase === "done" ? s.scores[i] : livePoints[i]}</b>
          </span>
        ))}
      </div>

      <div className="hearts-table">
        {[2, 1, 3].map((seat) => (
          <div key={seat} className={"hearts-opp " + POS[seat] + (s.turn === seat && s.phase === "play" ? " is-turn" : "")}>
            <div className="hearts-opp__name">{SEAT_NAMES[seat]} · {s.hands[seat].length}🂠</div>
          </div>
        ))}
        <div className="hearts-trick">
          {display.map((t) => (
            <div key={t.card.id} className={"hearts-trick__card " + POS[t.seat]}>
              <PlayingCard card={t.card} />
            </div>
          ))}
          {s.phase === "done" && (
            <div className="hearts-trick__result">
              {s.scores[0] === Math.min(...s.scores) ? "You win! 🎉" : "Hand over"}
            </div>
          )}
        </div>
      </div>

      <div className="hearts-handzone">
        <div className={"c8-hand" + (yourTurn ? " is-turn" : "")}>
          {s.hands[0].map((c) => (
            <PlayingCard
              key={c.id}
              card={c}
              dimmed={yourTurn && !legal.has(c.id)}
              onClick={yourTurn && legal.has(c.id) ? () => setS((cur) => applyMove(cur, { cardId: c.id })) : undefined}
            />
          ))}
        </div>
        {s.phase === "done" && (
          <div className="cardtable__controls">
            <span className={"bj-result bj-result--" + (s.scores[0] === Math.min(...s.scores) ? "win" : "loss")}>
              Final: {SEAT_NAMES.map((n, i) => `${n} ${s.scores[i]}`).join(" · ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
