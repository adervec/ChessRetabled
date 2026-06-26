import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { SUIT_SYMBOL } from "../../core/cards";
import { randomSeed } from "../../core/rng";
import { useSettings, aiThinkFloorMs } from "../../../state/useSettings";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initDurak, attack, defend, take, done, aiAct, applyAct, legalAttacks, legalDefenses, type DurakState,
} from "./logic";

const actingSeat = (s: DurakState) => (s.phase === "defend" ? (s.attacker === 0 ? 1 : 0) : s.attacker);

export function Durak({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<DurakState>(() => initDurak(randomSeed()));
  const animSpeed = useSettings((a) => a.animSpeed);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const tok = useRef(0);

  useEffect(() => {
    if (s.phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "durak", gameName: "Durak",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: s.loser === 1 ? "win" : s.loser === 0 ? "loss" : "draw", humanSide: "0", opponent: "AI",
      moveCount: s.discard, moves: [], reason: s.loser === null ? "draw" : s.loser === 0 ? "you fooled" : "rival fooled",
    });
  }, [s, addRecord]);

  useEffect(() => {
    if (s.phase === "done" || actingSeat(s) !== 1) return;
    const t = ++tok.current;
    const id = setTimeout(() => { if (t === tok.current) setS((cur) => (cur.phase !== "done" && actingSeat(cur) === 1 ? applyAct(cur, aiAct(cur, 1)) : cur)); }, aiThinkFloorMs(animSpeed));
    return () => clearTimeout(id);
  }, [s, animSpeed]);

  const newGame = () => { recordedRef.current = false; startedRef.current = new Date().toISOString(); setS(initDurak(randomSeed())); };

  const myAttack = s.phase === "attack" && s.attacker === 0;
  const myDefend = s.phase === "defend" && s.attacker === 1;
  const attackIds = new Set(legalAttacks(s, 0).map((c) => c.id));
  const defenseIds = new Set(legalDefenses(s, 0).map((c) => c.id));
  const allDefended = s.table.length > 0 && s.table.every((p) => p.defense !== null);

  const onCard = (id: string) => {
    if (myAttack && attackIds.has(id)) setS(attack(s, id));
    else if (myDefend && defenseIds.has(id)) setS(defend(s, id));
  };

  return (
    <div className="cardtable" style={{ ["--card-w" as string]: "56px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🐻 Durak</span>
        <button className="btn btn--sm" onClick={newGame}>↻ New</button>
      </div>

      <div className="gf-info">
        <span className={actingSeat(s) === 1 && s.phase !== "done" ? "is-turn" : ""}>Rival · {s.hands[1].length} cards {s.attacker === 1 ? "· attacking" : "· defending"}</span>
        <span>Trump {SUIT_SYMBOL[s.trump]} · stock {s.stock.length}</span>
      </div>

      <div className="durak-table">
        {s.table.length === 0 && <span className="text-muted">no cards in play</span>}
        {s.table.map((p, i) => (
          <div key={i} className="durak-pair">
            <PlayingCard card={p.attack} />
            {p.defense && <div className="durak-def"><PlayingCard card={p.defense} /></div>}
          </div>
        ))}
      </div>

      <div className="bj-msg">{s.message}</div>
      <div className="gf-info"><span>You · {s.hands[0].length} cards {s.attacker === 0 ? "· attacking" : "· defending"}</span></div>

      <div className={"c8-hand" + (actingSeat(s) === 0 && s.phase !== "done" ? " is-turn" : "")}>
        {s.hands[0].map((c) => {
          const live = (myAttack && attackIds.has(c.id)) || (myDefend && defenseIds.has(c.id));
          return <PlayingCard key={c.id} card={c} onClick={live ? () => onCard(c.id) : undefined} />;
        })}
      </div>

      <div className="cardtable__controls">
        {myAttack && allDefended && <button className="btn btn--sm btn--mint" onClick={() => setS(done(s))}>Done (beat off)</button>}
        {myDefend && <button className="btn btn--sm btn--coral" onClick={() => setS(take(s))}>Take cards</button>}
        {s.phase === "done" && (
          <>
            <span className={"bj-result bj-result--" + (s.loser === 1 ? "win" : s.loser === 0 ? "loss" : "push")}>{s.message}</span>
            <button className="btn btn--sm btn--mint" onClick={newGame}>↻ New game</button>
          </>
        )}
      </div>
    </div>
  );
}
