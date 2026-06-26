import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initCribbage, discard, playablePeg, playPeg, cribStep, nextDeal, type CribbageState,
} from "./logic";

const needsAuto = (s: CribbageState): boolean => {
  if (s.phase === "discard") return !s.discarded[1];
  if (s.phase === "play") return !(s.turn === 0 && playablePeg(s, 0).length > 0);
  return false;
};

export function Cribbage({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<CribbageState>(() => initCribbage(randomSeed()));
  const [sel, setSel] = useState<string[]>([]);
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const tok = useRef(0);

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "cribbage", gameName: "Cribbage",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.winner === 0 ? "win" : "loss", humanSide: "0", opponent: "AI",
      moveCount: s.dealNo + 1, moves: [], reason: `${s.scores[0]}–${s.scores[1]}`,
    });
  }, [s, addRecord]);

  useEffect(() => {
    if (!needsAuto(s)) return;
    const t = ++tok.current;
    const id = setTimeout(() => { if (t === tok.current) setS((cur) => (needsAuto(cur) ? cribStep(cur) : cur)); }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(id);
  }, [s, animSpeed]);

  const newGame = () => { recordedRef.current = false; startedRef.current = new Date().toISOString(); setSel([]); setS(initCribbage(randomSeed())); };
  const toggle = (id: string) => setSel((x) => (x.includes(id) ? x.filter((y) => y !== id) : x.length < 2 ? [...x, id] : x));
  const sendCrib = () => { if (sel.length === 2) { setS(discard(s, 0, sel)); setSel([]); } };

  const yourPeg = s.phase === "play" && s.turn === 0;
  const playable = new Set(playablePeg(s, 0).map((c) => c.id));

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "58px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🪵 Cribbage</span>
        <button className="btn btn--sm" onClick={newGame}>↻ New</button>
      </div>

      <div className="gf-info">
        <span className={s.turn === 1 && s.phase === "play" ? "is-turn" : ""}>Rival {s.scores[1]}/121 {s.dealer === 1 ? "· dealer" : ""}</span>
        <span>{s.cut ? "cut" : "no cut yet"} · count {s.count}</span>
      </div>

      <div className="crib-board">
        {s.cut && <div className="crib-cut"><span className="c8-pile__label">Cut</span><PlayingCard card={s.cut} /></div>}
        <div className="crib-pile">
          {s.pile.length === 0 ? <span className="text-muted">—</span> : s.pile.map((c) => <PlayingCard key={c.id} card={c} />)}
        </div>
      </div>

      <div className="bj-msg">{s.message}{s.showText ? ` — ${s.showText}` : ""}</div>
      <div className="gf-info"><span>You {s.scores[0]}/121 {s.dealer === 0 ? "· dealer" : ""}</span></div>

      <div className={"c8-hand" + (yourPeg ? " is-turn" : "")}>
        {(s.phase === "play" ? s.toPlay[0] : s.hands[0]).map((c) => {
          const selable = s.phase === "discard" && !s.discarded[0];
          const isPlayCard = yourPeg && playable.has(c.id);
          const onClick = selable ? () => toggle(c.id) : isPlayCard ? () => setS(playPeg(s, c.id)) : undefined;
          return <PlayingCard key={c.id} card={c} selected={sel.includes(c.id)} onClick={onClick} />;
        })}
      </div>

      {s.phase === "discard" && !s.discarded[0] && (
        <div className="cardtable__controls">
          <span className="text-muted">{sel.length}/2 to the {s.dealer === 0 ? "your" : "rival's"} crib</span>
          <button className="btn btn--sm btn--mint" disabled={sel.length !== 2} onClick={sendCrib}>Discard</button>
        </div>
      )}
      {s.phase === "show" && (
        <div className="cardtable__controls">
          <button className="btn btn--sm btn--sky" onClick={() => setS(nextDeal(s))}>Next deal →</button>
        </div>
      )}
      {s.phase === "done" && (
        <div className="cardtable__controls">
          <span className={"bj-result bj-result--" + (s.winner === 0 ? "win" : "loss")}>{s.message}</span>
          <button className="btn btn--sm btn--mint" onClick={newGame}>↻ New game</button>
        </div>
      )}
    </div>
  );
}
