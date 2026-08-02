import { useEffect, useMemo, useRef, useState } from "react";
import { generate, isSolved, type Puzzle } from "../bridges";
import { randomSeed } from "../../cards/core/rng";
import { useArchive, newId } from "../../state/useArchive";
import "./Logic.css";

const SIZE = 7;

export function Bridges({ onExit }: { onExit: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generate(randomSeed(), SIZE, SIZE));
  const [bridges, setBridges] = useState<number[]>(() => puzzle.edges.map(() => 0));
  const [sel, setSel] = useState<number | null>(null);
  const [hintEdge, setHintEdge] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const addRecord = useArchive((a) => a.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());

  // pair (island a,b) -> edge index, and per-island incident edges
  const pairEdge = useMemo(() => {
    const m = new Map<string, number>();
    puzzle.edges.forEach((e, i) => m.set(e.a < e.b ? `${e.a},${e.b}` : `${e.b},${e.a}`, i));
    return m;
  }, [puzzle]);
  const crossOf = useMemo(() => {
    const c: number[][] = puzzle.edges.map(() => []);
    puzzle.cross.forEach(([i, j]) => { c[i].push(j); c[j].push(i); });
    return c;
  }, [puzzle]);

  const islandIdxAt = useMemo(() => {
    const m = new Map<number, number>();
    puzzle.islands.forEach((is, i) => m.set(is.cell, i));
    return m;
  }, [puzzle]);

  const deg = useMemo(() => {
    const d = puzzle.islands.map(() => 0);
    puzzle.edges.forEach((e, i) => { d[e.a] += bridges[i]; d[e.b] += bridges[i]; });
    return d;
  }, [puzzle, bridges]);

  const won = useMemo(() => isSolved(bridges, puzzle), [bridges, puzzle]);

  // per-cell bridge glyph from the current bridge assignment
  const glyph = useMemo(() => {
    const g = new Map<number, string>();
    puzzle.edges.forEach((e, i) => {
      if (bridges[i] <= 0) return;
      const ch = e.horizontal ? (bridges[i] === 2 ? "═" : "─") : (bridges[i] === 2 ? "║" : "│");
      for (const c of e.cells) g.set(c, ch);
    });
    return g;
  }, [puzzle, bridges]);

  const newGame = () => {
    recordedRef.current = false;
    startedRef.current = new Date().toISOString();
    const p = generate(randomSeed(), SIZE, SIZE);
    setPuzzle(p); setBridges(p.edges.map(() => 0)); setSel(null);
    setHintEdge(null);
    setHintUsed(false);
  };

  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    addRecord({
      id: newId(), gameId: "bridges", gameName: "Bridges",
      startedISO: startedRef.current, endedISO: new Date().toISOString(),
      outcome: "win", humanSide: "solo", opponent: "Bridges",
      moveCount: bridges.reduce((a, b) => a + b, 0), moves: [], reason: "All linked",
      assisted: hintUsed || undefined,
    });
  }, [won, bridges, hintUsed, addRecord]);

  const clickIsland = (j: number) => {
    if (sel === null) { setSel(j); return; }
    if (sel === j) { setSel(null); return; }
    const ei = pairEdge.get(sel < j ? `${sel},${j}` : `${j},${sel}`);
    if (ei === undefined) { setSel(j); return; } // not a neighbour — reselect
    setBridges((b) => {
      let next = (b[ei] + 1) % 3;
      if (next > 0 && crossOf[ei].some((o) => b[o] > 0)) next = 0; // can't cross an existing bridge
      return b.map((x, k) => (k === ei ? next : x));
    });
    setSel(null);
  };

  // Stage 1 highlights the two islands of a wrong edge; stage 2 sets its bridge count.
  const hint = () => {
    if (won) return;
    if (hintEdge !== null) {
      const e = hintEdge;
      setBridges((b) => b.map((x, k) => (k === e ? puzzle.solution[e] : x)));
      setHintEdge(null);
      return;
    }
    const e = puzzle.solution.findIndex((want, i) => bridges[i] !== want);
    if (e < 0) return;
    setHintUsed(true);
    setHintEdge(e);
  };

  const tiles = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    const isl = islandIdxAt.get(i);
    if (isl !== undefined) {
      const cls = ["br-isle"];
      if (deg[isl] === puzzle.islands[isl].count) cls.push("done");
      else if (deg[isl] > puzzle.islands[isl].count) cls.push("over");
      if (sel === isl) cls.push("sel");
      if (hintEdge !== null && (puzzle.edges[hintEdge].a === isl || puzzle.edges[hintEdge].b === isl)) cls.push("lhint");
      tiles.push(<button key={i} className={cls.join(" ")} onClick={() => clickIsland(isl)}>{puzzle.islands[isl].count}</button>);
    } else {
      tiles.push(<span key={i} className="br-gap">{glyph.get(i) ?? ""}</span>);
    }
  }

  return (
    <div className="logic-screen">
      <div className="logic-bar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← Logic Lab</button>
        <span className="tag tag--gold">🌉 Bridges</span>
        {hintUsed && <span className="tag" title="A hint was used — this puzzle counts as assisted">💡 assisted</span>}
        <span className="text-muted">link every island</span>
      </div>

      <div className="bridges" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>{tiles}</div>

      <div className="logic-foot">
        {won
          ? <span className="bj-result bj-result--win">Solved! 🎉</span>
          : <span className="text-muted">Tap an island then a neighbour to add a bridge (tap again for a double, once more to clear).</span>}
        <button className="btn btn--sm btn--gold" title="Progressive hint — using it marks this puzzle as assisted" onClick={hint} disabled={won}>{hintEdge !== null ? "💡 Reveal" : "💡 Hint"}</button>
        <button className="btn btn--sm btn--sky" onClick={newGame}>↻ New puzzle</button>
      </div>
    </div>
  );
}
