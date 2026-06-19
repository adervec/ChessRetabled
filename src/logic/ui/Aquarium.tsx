import { useEffect, useMemo, useRef, useState } from "react";
import { generate, counts, isSolved, type Puzzle } from "../aquarium";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 6;

export function Aquarium({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE));
  // water line per region: cells with row >= floodTop are water (default size = empty)
  const [floodTop, setFloodTop] = useState<Record<number, number>>({});
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  const water = useMemo(() => {
    return puzzle.regionId.map((reg, i) => Math.floor(i / SIZE) >= (floodTop[reg] ?? SIZE));
  }, [puzzle, floodTop]);

  const live = useMemo(() => counts(water, SIZE), [water]);
  const won = useMemo(() => isSolved(water, SIZE, puzzle.rowClue, puzzle.colClue), [water, puzzle]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    setPuzzle(generate(randomSeed(), SIZE));
    setFloodTop({});
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "aquarium", gameName: "Aquarium",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Aquarium",
      moveCount: water.filter(Boolean).length, moves: [], reason: "Levels set",
    });
  }, [won, water, addRecord]);

  const click = (i: number) => {
    const r = Math.floor(i / SIZE);
    const reg = puzzle.regionId[i];
    const cur = floodTop[reg] ?? SIZE;
    const isWater = r >= cur;
    setFloodTop((f) => ({ ...f, [reg]: isWater ? r + 1 : r }));
  };

  const rid = puzzle.regionId;
  const span = SIZE + 1;
  const tiles = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const i = r * SIZE + c;
      const cls = ["aq-cell"];
      if (water[i]) cls.push("water");
      if (r === 0 || rid[i - SIZE] !== rid[i]) cls.push("edge-t");
      if (c === 0 || rid[i - 1] !== rid[i]) cls.push("edge-l");
      if (c === SIZE - 1 || rid[i + 1] !== rid[i]) cls.push("edge-r");
      if (r === SIZE - 1 || rid[i + SIZE] !== rid[i]) cls.push("edge-b");
      tiles.push(<button key={i} className={cls.join(" ")} onClick={() => click(i)} />);
    }
    const ok = live.row[r] === puzzle.rowClue[r];
    tiles.push(<span key={`rc${r}`} className={"aq-clue" + (live.row[r] > puzzle.rowClue[r] ? " over" : ok ? " ok" : "")}>{puzzle.rowClue[r]}</span>);
  }
  for (let c = 0; c < SIZE; c++) {
    const ok = live.col[c] === puzzle.colClue[c];
    tiles.push(<span key={`cc${c}`} className={"aq-clue" + (live.col[c] > puzzle.colClue[c] ? " over" : ok ? " ok" : "")}>{puzzle.colClue[c]}</span>);
  }
  tiles.push(<span key="corner" />);

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">💧 Aquarium</span>
        <span className="text-muted">water finds its level</span>
      </div>

      <div className="aquarium" style={{ gridTemplateColumns: `repeat(${span}, 1fr)` }}>{tiles}</div>

      <div className="logic-foot">
        {won ? <span className="bj-result bj-result--win">Solved! 🎉</span> : <span className="text-muted">Click to raise/lower each tank; match the row & column totals.</span>}
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
