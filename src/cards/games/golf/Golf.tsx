import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { SUIT_SYMBOL, rankLabel, type Card } from "../../core/cards";
import { randomSeed } from "../../core/rng";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initGolf, playColumn, draw, playableColumns, isWon, isStuck, type GolfState,
} from "./logic";
import { useCardHint } from "../../ui/useCardHint";

type GolfHint = { kind: "play"; col: number } | { kind: "draw" };

export function Golf({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<GolfState>(() => initGolf(randomSeed()));
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const won = isWon(s);
  const stuck = isStuck(s);
  const remaining = s.columns.reduce((n, c) => n + c.length, 0);
  const { hint, used, request, clear, resetUsed } = useCardHint<GolfHint>();

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(),
      gameId: "golf",
      gameName: "Golf",
      startedISO: startedRef.current,
      endedISO: new Date().toISOString(),
      outcome: "win",
      humanSide: "solo",
      opponent: "Golf",
      moveCount: 35,
      moves: [],
      reason: "Cleared every column",
      assisted: used || undefined,
    });
  }, [won, addRecord, used]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    resetUsed();
    setS(initGolf(randomSeed()));
  };

  const playable = new Set(playableColumns(s));
  const foundationTop = s.foundation[s.foundation.length - 1];

  // ponytail: greedy — prefer a playable column whose play keeps a chain going, else any, else draw
  const pickHint = (): GolfHint | null => {
    if (won || stuck) return null;
    const cols = playableColumns(s);
    if (cols.length === 0) return s.stock.length > 0 ? { kind: "draw" } : null;
    const chains = (col: number) => {
      const played = s.columns[col][s.columns[col].length - 1];
      return s.columns
        .map((c, i) => (i === col ? c[c.length - 2] : c[c.length - 1]))
        .filter((c): c is Card => !!c)
        .some((c) => Math.abs(c.rank - played.rank) === 1);
    };
    return { kind: "play", col: cols.find(chains) ?? cols[0] };
  };
  const hintCardName = (col: number) => {
    const c = s.columns[col][s.columns[col].length - 1];
    return c ? rankLabel(c.rank) + SUIT_SYMBOL[c.suit] : "that column";
  };
  const hintText = !hint
    ? null
    : hint.value.kind === "draw"
      ? "Nothing fits — draw from the stock"
      : hint.stage === 1
        ? "A column top can go to the pile"
        : `Play ${hintCardName(hint.value.col)}`;

  return (
    <div className="cardtable golf" style={{ ["--card-w" as string]: "60px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">⛳ Golf · {remaining} cards left</span>
        {used && <span className="tag" title="A hint was used — this game counts as assisted">💡 assisted</span>}
        <button
          className="btn btn--sm btn--gold"
          onClick={() => request(pickHint)}
          disabled={won || stuck}
          title="Progressive hint — using it marks this game as assisted"
        >
          💡 {hint?.stage === 1 ? "Reveal" : "Hint"}
        </button>
        {hintText && <span className="tag">{hintText}</span>}
        <button className="btn btn--sm" onClick={newGame}>↻ New deal</button>
      </div>

      <div className="golf-cols">
        {s.columns.map((col, c) => (
          <div className="golf-col" key={c}>
            {col.length === 0 ? (
              <div className="pcard-slot" />
            ) : (
              col.map((card, i) => {
                const top = i === col.length - 1;
                return (
                  <div className="golf-cardslot" key={card.id} style={{ marginTop: i === 0 ? 0 : -42 }}>
                    <PlayingCard
                      card={card}
                      selected={top && playable.has(c)}
                      style={top && hint?.stage === 2 && hint.value.kind === "play" && hint.value.col === c ? { outline: "4px solid var(--sky)" } : undefined}
                      onClick={top && playable.has(c) ? () => { clear(); setS(playColumn(s, c)); } : undefined}
                    />
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>

      <div className="golf-foot">
        <div className="golf-stock" onClick={() => { clear(); setS(draw(s)); }}>
          {s.stock.length > 0 ? <PlayingCard faceUp={false} /> : <div className="pcard-slot k-recycle">∅</div>}
          <span className="py-count">{s.stock.length}</span>
        </div>
        <div className="golf-foundation">
          {foundationTop ? <PlayingCard card={foundationTop} /> : <div className="pcard-slot" />}
        </div>
        <div className="py-hint">Play a column top one rank above or below the pile. Draw when stuck.</div>
      </div>

      {(won || stuck) && (
        <div className="k-win">
          <div className="k-win__card">
            <div className="k-win__emoji">{won ? "🏆" : "🚧"}</div>
            <h2>{won ? "Round won!" : "No moves left"}</h2>
            <p className="text-muted">{won ? "Every column cleared." : `${remaining} cards stranded.`}</p>
            <button className="btn btn--mint" onClick={newGame}>↻ New deal</button>
          </div>
        </div>
      )}
    </div>
  );
}
