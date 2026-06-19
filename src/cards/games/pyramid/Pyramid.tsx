import { useEffect, useMemo, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { randomSeed } from "../../core/rng";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initPyramid, isExposed, removeRefs, draw, recycle, isWon, value,
  WASTE_REF, type PyramidState,
} from "./logic";

// Triangular slot indices grouped by row (row r starts at r(r+1)/2, holds r+1 cards).
const ROWS: number[][] = (() => {
  const rows: number[][] = [];
  let i = 0;
  for (let r = 0; r < 7; r++) {
    const row: number[] = [];
    for (let p = 0; p <= r; p++) row.push(i++);
    rows.push(row);
  }
  return rows;
})();

export function Pyramid({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<PyramidState>(() => initPyramid(randomSeed()));
  const [sel, setSel] = useState<number[]>([]);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const cleared = useMemo(() => s.pyramid.filter((c) => c === null).length, [s.pyramid]);
  const won = isWon(s);

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(),
      gameId: "pyramid",
      gameName: "Pyramid",
      startedISO: startedRef.current,
      endedISO: new Date().toISOString(),
      outcome: "win",
      humanSide: "solo",
      opponent: "Pyramid",
      moveCount: 28,
      moves: [],
      reason: "Cleared the pyramid",
    });
  }, [won, addRecord]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setSel([]);
    setS(initPyramid(randomSeed()));
  };

  const valOf = (ref: number) =>
    ref === WASTE_REF
      ? (s.waste.length ? value(s.waste[s.waste.length - 1].rank) : 0)
      : value(s.pyramid[ref]!.rank);

  const available = (ref: number) =>
    ref === WASTE_REF ? s.waste.length > 0 : isExposed(s, ref);

  const pick = (ref: number) => {
    if (!available(ref)) return;
    if (valOf(ref) === 13) { setS(removeRefs(s, [ref])); setSel([]); return; }
    if (sel.length === 1) {
      const r0 = sel[0];
      if (r0 === ref) { setSel([]); return; }
      if (valOf(r0) + valOf(ref) === 13) { setS(removeRefs(s, [r0, ref])); setSel([]); return; }
      setSel([ref]);
      return;
    }
    setSel([ref]);
  };

  const onStock = () => {
    setSel([]);
    if (s.stock.length > 0) setS(draw(s));
    else setS(recycle(s));
  };

  const wasteTop = s.waste[s.waste.length - 1];
  const isSel = (ref: number) => sel.includes(ref);

  return (
    <div className="cardtable pyramid" style={{ ["--card-w" as string]: "56px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🔺 Pyramid · {cleared}/28 cleared</span>
        <button className="btn btn--sm" onClick={newGame}>↻ New deal</button>
      </div>

      <div className="py-board">
        {ROWS.map((row, r) => (
          <div className="py-row" key={r}>
            {row.map((idx) => {
              const card = s.pyramid[idx];
              if (card === null) return <div key={idx} className="py-slot py-slot--gone" />;
              const free = isExposed(s, idx);
              return (
                <div className="py-slot" key={idx}>
                  <PlayingCard
                    card={card}
                    selected={isSel(idx)}
                    dimmed={!free}
                    onClick={free ? () => pick(idx) : undefined}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="py-foot">
        <div className="py-stock" onClick={onStock}>
          {s.stock.length > 0 ? <PlayingCard faceUp={false} /> : <div className="pcard-slot k-recycle">↻</div>}
          <span className="py-count">{s.stock.length}</span>
        </div>
        <div className="py-waste">
          {wasteTop ? (
            <PlayingCard card={wasteTop} selected={isSel(WASTE_REF)} onClick={() => pick(WASTE_REF)} />
          ) : (
            <div className="pcard-slot" />
          )}
        </div>
        <div className="py-hint">Pair cards that total 13. Kings clear alone.</div>
      </div>

      {won && (
        <div className="k-win">
          <div className="k-win__card">
            <div className="k-win__emoji">🏆</div>
            <h2>Pyramid cleared!</h2>
            <p className="text-muted">Every card matched away.</p>
            <button className="btn btn--mint" onClick={newGame}>↻ New deal</button>
          </div>
        </div>
      )}
    </div>
  );
}
