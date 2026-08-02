import { useEffect, useMemo, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { randomSeed } from "../../core/rng";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initPyramid, isExposed, removeRefs, draw, recycle, isWon, value, exposedSlots,
  WASTE_REF, type PyramidState,
} from "./logic";
import { useCardHint } from "../../ui/useCardHint";

type PyHint = { kind: "remove"; refs: number[] } | { kind: "stock" };

const HINT_STYLE: React.CSSProperties = {
  outline: "4px solid var(--sky)",
  outlineOffset: "-4px",
  borderRadius: "8px",
};

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
  const { hint, used, request, clear, resetUsed } = useCardHint<PyHint>();

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
      assisted: used || undefined,
    });
  }, [won, addRecord, used]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setSel([]);
    resetUsed();
    setS(initPyramid(randomSeed()));
  };

  // ponytail: greedy — kings first, then the 13-pair using the most pyramid cards (uncovers more), else the stock
  const pickHint = (): PyHint | null => {
    if (won) return null;
    const refs = [...exposedSlots(s), ...(s.waste.length ? [WASTE_REF] : [])];
    const v = (ref: number) =>
      ref === WASTE_REF ? value(s.waste[s.waste.length - 1].rank) : value(s.pyramid[ref]!.rank);
    const king = refs.filter((r) => v(r) === 13).sort((a, b) => b - a)[0]; // pyramid king before the waste one
    if (king !== undefined) return { kind: "remove", refs: [king] };
    let best: number[] | null = null;
    let bestScore = -1;
    for (let i = 0; i < refs.length; i++) {
      for (let j = i + 1; j < refs.length; j++) {
        if (v(refs[i]) + v(refs[j]) !== 13) continue;
        const score = (refs[i] !== WASTE_REF ? 1 : 0) + (refs[j] !== WASTE_REF ? 1 : 0);
        if (score > bestScore) { bestScore = score; best = [refs[i], refs[j]]; }
      }
    }
    if (best) return { kind: "remove", refs: best };
    return s.stock.length > 0 || s.waste.length > 0 ? { kind: "stock" } : null;
  };
  const hintText = !hint
    ? null
    : hint.value.kind === "stock"
      ? s.stock.length > 0 ? "No pairs — draw from the stock" : "No pairs — recycle the waste"
      : hint.stage === 1
        ? hint.value.refs.length === 1 ? "A king can clear alone" : "A pair totalling 13 is available"
        : hint.value.refs.length === 1 ? "Clear the highlighted king" : "Take the highlighted pair";
  const hinted = (ref: number) =>
    hint?.stage === 2 && hint.value.kind === "remove" && hint.value.refs.includes(ref);

  const valOf = (ref: number) =>
    ref === WASTE_REF
      ? (s.waste.length ? value(s.waste[s.waste.length - 1].rank) : 0)
      : value(s.pyramid[ref]!.rank);

  const available = (ref: number) =>
    ref === WASTE_REF ? s.waste.length > 0 : isExposed(s, ref);

  const pick = (ref: number) => {
    if (!available(ref)) return;
    clear();
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
    clear();
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
        {used && <span className="tag" title="A hint was used — this game counts as assisted">💡 assisted</span>}
        <button
          className="btn btn--sm btn--gold"
          onClick={() => request(pickHint)}
          disabled={won}
          title="Progressive hint — using it marks this game as assisted"
        >
          💡 {hint?.stage === 1 ? "Reveal" : "Hint"}
        </button>
        {hintText && <span className="tag">{hintText}</span>}
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
                    style={hinted(idx) ? HINT_STYLE : undefined}
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
            <PlayingCard card={wasteTop} selected={isSel(WASTE_REF)} style={hinted(WASTE_REF) ? HINT_STYLE : undefined} onClick={() => pick(WASTE_REF)} />
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
