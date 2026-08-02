import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { SUITS, SUIT_SYMBOL, rankLabel, type Card } from "../../core/cards";
import { randomSeed } from "../../core/rng";
import { useArchive, newId } from "../../../state/useArchive";
import { initKlondike, legalMoves, applyMove, isWon, type KMove, type KState } from "./logic";
import { useCardHint } from "../../ui/useCardHint";

type Sel = { kind: "waste" } | { kind: "tableau"; pile: number; index: number } | null;

export function Klondike({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<KState>(() => initKlondike(randomSeed()));
  const [sel, setSel] = useState<Sel>(null);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const won = isWon(s);
  const { hint, used, request, clear, resetUsed } = useCardHint<KMove>();

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(),
      gameId: "klondike",
      gameName: "Solitaire",
      startedISO: startedRef.current,
      endedISO: new Date().toISOString(),
      outcome: "win",
      humanSide: "solo",
      opponent: "Solitaire",
      moveCount: s.moves,
      moves: [],
      reason: `Solved in ${s.moves} moves`,
      assisted: used || undefined,
    });
  }, [won, s.moves, addRecord, used]);

  const newGame = () => {
    recordedRef.current = false;
    setSel(null);
    resetUsed();
    setS(initKlondike(randomSeed()));
  };

  const apply = (m: KMove) => {
    clear();
    setS((cur) => applyMove(cur, m));
    setSel(null);
  };

  // First "useful" legal move: foundation first, then a run move that frees a
  // face-down card, then any tableau/waste move, then the stock.
  const pickHint = (): KMove | null => {
    if (won) return null;
    const ms = legalMoves(s);
    return (
      ms.find((m) => m.type === "wf" || m.type === "tf") ??
      ms.find((m) => m.type === "tt" && m.index === 0 && s.tableau[m.from].down.length > 0) ??
      ms.find((m) => m.type === "wt") ??
      ms.find((m) => m.type === "tt") ??
      ms[0] ??
      null
    );
  };
  const cardName = (c: Card) => rankLabel(c.rank) + SUIT_SYMBOL[c.suit];
  const describe = (m: KMove): string => {
    const wasteTop = s.waste[s.waste.length - 1];
    switch (m.type) {
      case "draw": return "Draw from the stock";
      case "recycle": return "Recycle the waste";
      case "wf": return wasteTop ? `Move ${cardName(wasteTop)} to the foundation` : "Play the waste card up";
      case "tf": {
        const t = s.tableau[m.from].up[s.tableau[m.from].up.length - 1];
        return t ? `Move ${cardName(t)} to the foundation` : "Play a tableau card up";
      }
      case "wt": {
        const onto = s.tableau[m.to].up[s.tableau[m.to].up.length - 1];
        return wasteTop ? `Move ${cardName(wasteTop)} onto ${onto ? cardName(onto) : "the empty column"}` : "Play the waste card down";
      }
      case "tt": {
        const head = s.tableau[m.from].up[m.index];
        const onto = s.tableau[m.to].up[s.tableau[m.to].up.length - 1];
        return `Move ${head ? cardName(head) : "a run"} onto ${onto ? cardName(onto) : "the empty column"}`;
      }
    }
  };
  const hintText = !hint
    ? null
    : hint.stage === 2
      ? describe(hint.value)
      : hint.value.type === "wf" || hint.value.type === "tf"
        ? "A foundation move is available"
        : hint.value.type === "wt" || hint.value.type === "tt"
          ? "Try a tableau move"
          : "Dig through the stock";

  const tryFind = (pred: (m: KMove) => boolean) => legalMoves(s).find(pred);

  const onStock = () => {
    if (s.stock.length > 0) apply({ type: "draw" });
    else if (s.waste.length > 0) apply({ type: "recycle" });
  };

  const onWaste = () => {
    if (s.waste.length === 0) return;
    if (sel?.kind === "waste") setSel(null);
    else setSel({ kind: "waste" });
  };

  const toFoundation = () => {
    if (!sel) return;
    const m =
      sel.kind === "waste"
        ? tryFind((x) => x.type === "wf")
        : tryFind((x) => x.type === "tf" && x.from === sel.pile);
    if (m) apply(m);
    else setSel(null);
  };

  const toPile = (q: number) => {
    if (!sel) return;
    const m =
      sel.kind === "waste"
        ? tryFind((x) => x.type === "wt" && x.to === q)
        : tryFind((x) => x.type === "tt" && x.from === sel.pile && x.index === sel.index && x.to === q);
    if (m) apply(m);
    else setSel(null);
  };

  const onTableauCard = (pile: number, index: number) => {
    if (sel) {
      // if something is selected, a click on another pile means "move here"
      if (!(sel.kind === "tableau" && sel.pile === pile)) {
        toPile(pile);
        return;
      }
    }
    setSel({ kind: "tableau", pile, index });
  };

  const isSelectedCard = (pile: number, index: number) =>
    sel?.kind === "tableau" && sel.pile === pile && index >= sel.index;

  return (
    <div className="cardtable klondike" style={{ ["--card-w" as string]: "64px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">🃏 Solitaire · {s.moves} moves</span>
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

      <div className="k-top">
        <div className="k-stockwaste">
          <div className="k-stock" onClick={onStock}>
            {s.stock.length > 0 ? <PlayingCard faceUp={false} /> : <div className="pcard-slot k-recycle">↻</div>}
          </div>
          <div className="k-waste" onClick={onWaste}>
            {s.waste.length > 0 ? (
              <PlayingCard card={s.waste[s.waste.length - 1]} selected={sel?.kind === "waste"} />
            ) : (
              <div className="pcard-slot" />
            )}
          </div>
        </div>

        <div className="k-foundations" onClick={toFoundation}>
          {SUITS.map((su) => {
            const f = s.foundations[su];
            return f.length > 0 ? (
              <PlayingCard key={su} card={f[f.length - 1]} />
            ) : (
              <div key={su} className={"pcard-slot k-foundation" + (sel ? " is-target" : "")}>{SUIT_SYMBOL[su]}</div>
            );
          })}
        </div>
      </div>

      <div className="k-tableau">
        {s.tableau.map((pile, p) => (
          <div key={p} className="k-col" onClick={() => { if (pile.down.length === 0 && pile.up.length === 0) toPile(p); }}>
            {pile.down.map((c, i) => (
              <div key={c.id} className="k-cardslot" style={{ marginTop: i === 0 ? 0 : -52 }}>
                <PlayingCard faceUp={false} />
              </div>
            ))}
            {pile.up.map((c, i) => (
              <div
                key={c.id}
                className="k-cardslot"
                style={{ marginTop: pile.down.length === 0 && i === 0 ? 0 : -40 }}
              >
                <PlayingCard card={c} selected={isSelectedCard(p, i)} onClick={() => onTableauCard(p, i)} />
              </div>
            ))}
            {pile.down.length === 0 && pile.up.length === 0 && (
              <div className={"pcard-slot" + (sel ? " is-target" : "")} />
            )}
          </div>
        ))}
      </div>

      {won && (
        <div className="k-win">
          <div className="k-win__card">
            <div className="k-win__emoji">🏆</div>
            <h2>You solved it!</h2>
            <p className="text-muted">In {s.moves} moves.</p>
            <button className="btn btn--mint" onClick={newGame}>↻ New deal</button>
          </div>
        </div>
      )}
    </div>
  );
}
