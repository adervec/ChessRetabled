import { makeRng, type Rng } from "../cards/core/rng.ts";

// Hashiwokakero ("Bridges"). Join the numbered islands with horizontal/vertical
// bridges so each island has exactly its number of bridge-ends; at most two
// bridges link any pair, bridges never cross, and all islands end up connected.
// Generation grows a connected, non-crossing bridge network and reads off the
// island numbers; the solver assigns 0/1/2 to each candidate edge and checks the
// configuration is forced.

export interface Island { cell: number; count: number }
export interface Edge { a: number; b: number; cells: number[]; horizontal: boolean } // a,b = island indices
export interface Puzzle {
  rows: number;
  cols: number;
  islands: Island[];
  edges: Edge[];
  cross: [number, number][]; // pairs of edge indices that would cross
  solution: number[]; // bridges per edge in the intended solution
}

/** Candidate edges between mutually visible collinear islands (clear span between). */
export function buildEdges(cells: number[], rows: number, cols: number): Edge[] {
  const islandAt = new Map<number, number>();
  cells.forEach((c, i) => islandAt.set(c, i));
  const edges: Edge[] = [];
  for (let i = 0; i < cells.length; i++) {
    const r = Math.floor(cells[i] / cols), c = cells[i] % cols;
    // nearest island to the right
    for (let cc = c + 1; cc < cols; cc++) {
      const cell = r * cols + cc;
      if (islandAt.has(cell)) { edges.push({ a: i, b: islandAt.get(cell)!, cells: range(r * cols + c + 1, cell, 1), horizontal: true }); break; }
    }
    // nearest island below
    for (let rr = r + 1; rr < rows; rr++) {
      const cell = rr * cols + c;
      if (islandAt.has(cell)) { edges.push({ a: i, b: islandAt.get(cell)!, cells: range((r + 1) * cols + c, cell, cols), horizontal: false }); break; }
    }
  }
  return edges;
}
function range(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let x = from; x < to; x += step) out.push(x);
  return out;
}

/** Pairs of edge indices that share a cell (a horizontal and a vertical one cross). */
export function crossings(edges: Edge[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    if (edges[i].horizontal === edges[j].horizontal) continue;
    if (edges[i].cells.some((c) => edges[j].cells.includes(c))) out.push([i, j]);
  }
  return out;
}

export function countSolutions(islands: Island[], edges: Edge[], cross: [number, number][], limit = 2): number {
  const m = edges.length;
  const bridges = new Array<number>(m).fill(0);
  const deg = new Array<number>(islands.length).fill(0);
  const incident: number[][] = islands.map(() => []);
  edges.forEach((e, i) => { incident[e.a].push(i); incident[e.b].push(i); });
  const crossOf: number[][] = edges.map(() => []);
  cross.forEach(([i, j]) => { crossOf[i].push(j); crossOf[j].push(i); });
  let count = 0, steps = 0, capped = false;

  const connected = (): boolean => {
    const seen = new Set<number>([0]); const st = [0];
    while (st.length) {
      const i = st.pop()!;
      for (const ei of incident[i]) if (bridges[ei] > 0) { const o = edges[ei].a === i ? edges[ei].b : edges[ei].a; if (!seen.has(o)) { seen.add(o); st.push(o); } }
    }
    return seen.size === islands.length;
  };

  const rec = (ei: number): void => {
    if (count >= limit || capped) return;
    if (++steps > 600000) { capped = true; return; }
    if (ei === m) {
      for (let k = 0; k < islands.length; k++) if (deg[k] !== islands[k].count) return;
      if (connected()) count++;
      return;
    }
    const maxHere = crossOf[ei].some((o) => bridges[o] > 0) ? 0 : 2; // can't cross an existing bridge
    for (let v = 0; v <= maxHere; v++) {
      const e = edges[ei];
      if (deg[e.a] + v > islands[e.a].count || deg[e.b] + v > islands[e.b].count) break;
      bridges[ei] = v; deg[e.a] += v; deg[e.b] += v;
      // prune: every island must still be able to reach its count with remaining edges
      let ok = true;
      for (const k of [e.a, e.b]) {
        let remain = 0;
        for (const inc of incident[k]) if (inc > ei) remain += crossOf[inc].some((o) => bridges[o] > 0) ? 0 : 2;
        if (deg[k] + remain < islands[k].count) { ok = false; break; }
      }
      if (ok) rec(ei + 1);
      deg[e.a] -= v; deg[e.b] -= v;
      if (count >= limit || capped) return;
    }
    bridges[ei] = 0;
  };
  rec(0);
  return capped ? limit : count;
}

export function generate(seed: number, rows = 7, cols = 7): Puzzle {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 300; attempt++) {
    const got = grow(rows, cols, rng);
    if (!got) continue;
    const { cells, sol } = got;
    const edges = buildEdges(cells, rows, cols);
    const cross = crossings(edges);
    // map grown bridges onto edge indices
    const bridges = new Array<number>(edges.length).fill(0);
    let okMap = true;
    for (const [a, b, n] of sol) {
      const ei = edges.findIndex((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
      if (ei < 0) { okMap = false; break; }
      bridges[ei] = n;
    }
    if (!okMap) continue;
    const counts = new Array<number>(cells.length).fill(0);
    edges.forEach((e, i) => { counts[e.a] += bridges[i]; counts[e.b] += bridges[i]; });
    const islands: Island[] = cells.map((cell, i) => ({ cell, count: counts[i] }));
    if (islands.some((is) => is.count === 0)) continue;
    if (countSolutions(islands, edges, cross, 2) !== 1) continue;
    return { rows, cols, islands, edges, cross, solution: bridges };
  }
  // Fallback: two islands joined by one bridge.
  const cells = [0, cols - 1];
  const edges = buildEdges(cells, rows, cols);
  return { rows, cols, islands: [{ cell: 0, count: 1 }, { cell: cols - 1, count: 1 }], edges, cross: crossings(edges), solution: edges.map((_, i) => (i === 0 ? 1 : 0)) };
}

/** Grow a connected, non-crossing bridge network; returns island cells + bridge list. */
function grow(rows: number, cols: number, rng: Rng): { cells: number[]; sol: [number, number, number][] } | null {
  const n = rows * cols;
  const islandAt = new Array<number>(n).fill(-1); // island index or -1
  const occupied = new Array<boolean>(n).fill(false); // bridge passes through
  const cells: number[] = [];
  const sol: [number, number, number][] = [];
  const start = (1 + rng.int(rows - 2)) * cols + (1 + rng.int(cols - 2));
  islandAt[start] = 0; cells.push(start);
  const target = Math.max(6, Math.floor(n / 6));
  let tries = 0;
  while (cells.length < target && tries < target * 40) {
    tries++;
    const a = rng.int(cells.length);
    const ac = cells[a], ar = Math.floor(ac / cols), acc = ac % cols;
    const [dr, dc] = [[1, 0], [-1, 0], [0, 1], [0, -1]][rng.int(4)];
    // walk for a clear landing spot at distance >= 2
    const spots: { cell: number; between: number[] }[] = [];
    const between: number[] = [];
    let rr = ar + dr, cc = acc + dc, dist = 0;
    while (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
      const cell = rr * cols + cc;
      if (islandAt[cell] !== -1 || occupied[cell]) break; // blocked by island or bridge
      dist++;
      if (dist >= 2) spots.push({ cell, between: between.slice() });
      between.push(cell);
      rr += dr; cc += dc;
    }
    if (spots.length === 0) continue;
    const spot = spots[rng.int(spots.length)];
    const bi = cells.length;
    islandAt[spot.cell] = bi; cells.push(spot.cell);
    for (const c of spot.between) occupied[c] = true;
    sol.push([a, bi, 1 + rng.int(2)]);
  }
  if (cells.length < 4) return null;
  return { cells, sol };
}

/** Does the player's bridge assignment solve the puzzle? */
export function isSolved(bridges: number[], puzzle: Puzzle): boolean {
  const { islands, edges, cross } = puzzle;
  for (const b of bridges) if (b < 0 || b > 2) return false;
  for (const [i, j] of cross) if (bridges[i] > 0 && bridges[j] > 0) return false; // crossing bridges
  const deg = new Array<number>(islands.length).fill(0);
  edges.forEach((e, i) => { deg[e.a] += bridges[i]; deg[e.b] += bridges[i]; });
  for (let k = 0; k < islands.length; k++) if (deg[k] !== islands[k].count) return false;
  const incident: number[][] = islands.map(() => []);
  edges.forEach((e, i) => { incident[e.a].push(i); incident[e.b].push(i); });
  const seen = new Set<number>([0]); const st = [0];
  while (st.length) {
    const i = st.pop()!;
    for (const ei of incident[i]) if (bridges[ei] > 0) { const o = edges[ei].a === i ? edges[ei].b : edges[ei].a; if (!seen.has(o)) { seen.add(o); st.push(o); } }
  }
  return seen.size === islands.length;
}
