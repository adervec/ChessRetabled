import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initCribbage, discard, playablePeg, playPeg, cribStep, nextDeal, aiDiscardChoice, aiPegChoice, type CribbageState,
} from "./logic";
import { useCardHint } from "../../ui/useCardHint";

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
  const { hint, used, request, clear, resetUsed } = useCardHint<string[]>();

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "cribbage", gameName: "Cribbage",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.winner === 0 ? "win" : "loss", humanSide: "0", opponent: "AI",
      moveCount: s.dealNo + 1, moves: [], reason: `${s.scores[0]}–${s.scores[1]}`,
      assisted: used || undefined,
    });
  }, [s, addRecord, used]);

  useEffect(() => {
    if (!needsAuto(s)) return;
    const t = ++tok.current;
    const id = setTimeout(() => { if (t === tok.current) setS((cur) => (needsAuto(cur) ? cribStep(cur) : cur)); }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(id);
  }, [s, animSpeed]);

  const newGame = () => { recordedRef.current = false; startedRef.current = new Date().toISOString(); setSel([]); resetUsed(); setS(initCribbage(randomSeed())); };
  const toggle = (id: string) => setSel((x) => (x.includes(id) ? x.filter((y) => y !== id) : x.length < 2 ? [...x, id] : x));
  const sendCrib = () => { if (sel.length === 2) { clear(); setS(discard(s, 0, sel)); setSel([]); } };

  const yourPeg = s.phase === "play" && s.turn === 0;
  const playable = new Set(playablePeg(s, 0).map((c) => c.id));
  const humanDiscard = s.phase === "discard" && !s.discarded[0];
  const canHint = humanDiscard || (yourPeg && playable.size > 0);
  const hintText = !hint
    ? null
    : hint.stage === 2
      ? humanDiscard ? "Toss the highlighted two" : "Play the highlighted card"
      : humanDiscard ? "Keep your scoring core together — toss two" : "There's a pegging play";
  const hintBtn = (
    <button
      className="btn btn--sm btn--gold"
      onClick={() => request(() => (humanDiscard ? aiDiscardChoice(s, 0) : yourPeg && playable.size > 0 ? [aiPegChoice(s, 0)] : null))}
      disabled={!canHint}
      title="Progressive hint — using it marks this game as assisted"
    >
      💡 {hint?.stage === 1 ? "Reveal" : "Hint"}
    </button>
  );

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "58px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🪵 Cribbage</span>
        {used && <span className="tag" title="A hint was used — this game counts as assisted">💡 assisted</span>}
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
          const onClick = selable ? () => toggle(c.id) : isPlayCard ? () => { clear(); setS(playPeg(s, c.id)); } : undefined;
          const hinted = hint?.stage === 2 && hint.value.includes(c.id);
          return <PlayingCard key={c.id} card={c} selected={sel.includes(c.id) || hinted} onClick={onClick} />;
        })}
      </div>

      {s.phase === "discard" && !s.discarded[0] && (
        <div className="cardtable__controls">
          <span className="text-muted">{sel.length}/2 to the {s.dealer === 0 ? "your" : "rival's"} crib</span>
          <button className="btn btn--sm btn--mint" disabled={sel.length !== 2} onClick={sendCrib}>Discard</button>
          {hintBtn}
          {hintText && <span className="tag">{hintText}</span>}
        </div>
      )}
      {s.phase === "play" && (
        <div className="cardtable__controls">
          {hintBtn}
          {hintText && <span className="tag">{hintText}</span>}
        </div>
      )}
      {s.phase === "show" && (
        <div className="cardtable__controls">
          <button className="btn btn--sm btn--sky" onClick={() => { clear(); setS(nextDeal(s)); }}>Next deal →</button>
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
