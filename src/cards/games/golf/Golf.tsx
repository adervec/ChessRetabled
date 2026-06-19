import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "../../ui/PlayingCard";
import { randomSeed } from "../../core/rng";
import { useArchive, newId } from "../../../state/useArchive";
import {
  initGolf, playColumn, draw, playableColumns, isWon, isStuck, type GolfState,
} from "./logic";

export function Golf({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<GolfState>(() => initGolf(randomSeed()));
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const won = isWon(s);
  const stuck = isStuck(s);
  const remaining = s.columns.reduce((n, c) => n + c.length, 0);

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
    });
  }, [won, addRecord]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setS(initGolf(randomSeed()));
  };

  const playable = new Set(playableColumns(s));
  const foundationTop = s.foundation[s.foundation.length - 1];

  return (
    <div className="cardtable golf" style={{ ["--card-w" as string]: "60px" } as React.CSSProperties}>
      <div className="cardtable__bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Card room</button>
        <span className="tag tag--gold">⛳ Golf · {remaining} cards left</span>
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
                      onClick={top && playable.has(c) ? () => setS(playColumn(s, c)) : undefined}
                    />
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>

      <div className="golf-foot">
        <div className="golf-stock" onClick={() => setS(draw(s))}>
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
