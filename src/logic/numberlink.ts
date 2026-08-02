import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Numberlink (flow style). Join each pair of equal numbers with a path of
// orthogonally connected cells; paths never overlap and every cell is filled.
// The solver works on the edges between cells: endpoints want degree 1, every
// other cell degree 2, no cycles, and each path must run between two endpoints
// of the same colour. Generation lays a Hamiltonian path over the whole grid and
// cuts it into coloured segments, then keeps only puzzles the solver finds unique.

export interface Puzzle {
  size: number;
  endpoint: number[]; // 0 = none, else colour (1..k); each colour appears exactly twice
  colors: number; // number of pairs
  solutionPaths: number[][]; // ordered cells of each colour's path (index = colour - 1)
}

function orthoNbrs(i: number, size: number): number[] {
  const r = Math.floor(i / size), c = i % size, out: number[] = [];
  if (r > 0) out.push(i - size);
  if (r < size - 1) out.push(i + size);
  if (c > 0) out.push(i - 1);
  if (c < size - 1) out.push(i + 1);
  return out;
}

export function countSolutions(endpoint: number[], size: number, limit = 2): number {
  const n = size * size;
  const target = endpoint.map((e) => (e !== 0 ? 1 : 2));
  const deg = new Array<number>(n).fill(0);
  // union-find with component metadata: how many endpoints, and their colour
  const parent = new Array<number>(n).fill(0).map((_, i) => i);
  const ends: number[] = endpoint.map((e) => (e !== 0 ? 1 : 0));
  const colr = endpoint.slice(); // 0 if no endpoint yet
  const find = (x: number): number => { while (parent[x] !== x) x = parent[x]; return x; }; // no compression: keeps undo simple
  let count = 0, steps = 0, capped = false;

  // try to add edge (a,b); returns an undo function or null if illegal
  const addEdge = (a: number, b: number): (() => void) | null => {
    if (deg[a] >= target[a] || deg[b] >= target[b]) return null;
    const ra = find(a), rb = find(b);
    if (ra === rb) return null; // would close a cycle
    if (ends[ra] && ends[rb] && colr[ra] !== colr[rb]) return null; // joins two different colours
    if (ends[ra] + ends[rb] > 2) return null; // a path can hold only two endpoints
    const prevParent = parent[rb], prevEnds = ends[ra], prevColr = colr[ra];
    deg[a]++; deg[b]++;
    parent[rb] = ra;
    ends[ra] = ends[ra] + ends[rb];
    if (colr[ra] === 0) colr[ra] = colr[rb];
    return () => { parent[rb] = prevParent; ends[ra] = prevEnds; colr[ra] = prevColr; deg[a]--; deg[b]--; };
  };

  // Decide the RIGHT and DOWN edge of each cell once, row-major; a cell's degree
  // is final once we have decided both, so we can check it then.
  const rec = (i: number): void => {
    if (count >= limit || capped) return;
    if (++steps > 1500000) { capped = true; return; }
    if (i === n) { count++; return; }
    const r = Math.floor(i / size), c = i % size;
    const right = c < size - 1 ? i + 1 : -1;
    const down = r < size - 1 ? i + size : -1;
    const options: ([number, number] | null)[][] = [];
    const make = (e: number) => (e < 0 ? [null] : [null, [i, e] as [number, number]]);
    for (const ro of make(right)) for (const dn of make(down)) options.push([ro, dn]);
    for (const opt of options) {
      const undos: (() => void)[] = [];
      let ok = true;
      for (const edge of opt) {
        if (!edge) continue;
        const u = addEdge(edge[0], edge[1]);
        if (!u) { ok = false; break; }
        undos.push(u);
      }
      if (ok && deg[i] === target[i]) rec(i + 1); // cell i is now complete
      for (let k = undos.length - 1; k >= 0; k--) undos[k]();
      if (count >= limit || capped) return;
    }
  };
  rec(0);
  return capped ? limit : count;
}

function hamiltonian(size: number, rng: Rng): number[] | null {
  const n = size * size;
  const visited = new Array<boolean>(n).fill(false);
  const path: number[] = [];
  let steps = 0;
  const dfs = (cell: number): boolean => {
    if (++steps > 200000) return false;
    visited[cell] = true; path.push(cell);
    if (path.length === n) return true;
    for (const nb of shuffle(orthoNbrs(cell, size), rng)) if (!visited[nb] && dfs(nb)) return true;
    visited[cell] = false; path.pop();
    return false;
  };
  return dfs((1 + rng.int(size - 2 >= 1 ? size - 2 : 1)) * size + 0) ? path : null;
}

export function generate(seed: number, size = 5): Puzzle {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 200; attempt++) {
    const ham = hamiltonian(size, rng);
    if (!ham) continue;
    const n = size * size;
    // cut into k segments, each length >= 2
    const k = 3 + rng.int(3);
    const cuts = new Set<number>();
    while (cuts.size < k - 1) {
      const p = 2 + rng.int(n - 3);
      if (![...cuts, 0, n].some((x) => Math.abs(x - p) < 2)) cuts.add(p);
    }
    const bounds = [0, ...[...cuts].sort((a, b) => a - b), n];
    const endpoint = new Array<number>(n).fill(0);
    const solutionPaths: number[][] = [];
    let okSeg = true;
    for (let s = 0; s < bounds.length - 1; s++) {
      const seg = ham.slice(bounds[s], bounds[s + 1]);
      if (seg.length < 2) { okSeg = false; break; }
      const color = s + 1;
      solutionPaths.push(seg);
      endpoint[seg[0]] = color;
      endpoint[seg[seg.length - 1]] = color;
    }
    if (!okSeg) continue;
    if (countSolutions(endpoint, size, 2) !== 1) continue;
    return { size, endpoint, colors: solutionPaths.length, solutionPaths };
  }
  // Fallback: two colours splitting the top and bottom edges.
  const endpoint = new Array<number>(size * size).fill(0);
  const top = Array.from({ length: size }, (_, c) => c);
  const bot = Array.from({ length: size }, (_, c) => (size - 1) * size + c);
  endpoint[top[0]] = 1; endpoint[top[size - 1]] = 1;
  endpoint[bot[0]] = 2; endpoint[bot[size - 1]] = 2;
  return { size, endpoint, colors: 2, solutionPaths: [top, bot] };
}

/** First/second endpoint cell of each colour, indexed by colour-1. */
export function endpointPairs(endpoint: number[]): number[][] {
  const pairs: number[][] = [];
  endpoint.forEach((e, i) => { if (e !== 0) { (pairs[e - 1] ??= []).push(i); } });
  return pairs;
}

/** Do the player's drawn paths solve the puzzle? Each path is an ordered cell list. */
export function isSolved(paths: number[][], endpoint: number[], size: number): boolean {
  const n = size * size;
  const owner = new Array<number>(n).fill(0);
  const pairs = endpointPairs(endpoint);
  if (paths.length !== pairs.length) return false;
  for (let c = 0; c < paths.length; c++) {
    const path = paths[c];
    if (path.length < 2) return false;
    // ends must be this colour's two endpoints
    const [e0, e1] = pairs[c];
    const okEnds = (path[0] === e0 && path[path.length - 1] === e1) || (path[0] === e1 && path[path.length - 1] === e0);
    if (!okEnds) return false;
    for (let k = 0; k < path.length; k++) {
      const cell = path[k];
      if (owner[cell] !== 0) return false; // paths may not overlap
      owner[cell] = c + 1;
      if (k > 0 && !orthoNbrs(cell, size).includes(path[k - 1])) return false; // consecutive cells must touch
    }
  }
  for (let i = 0; i < n; i++) if (owner[i] === 0) return false; // every cell filled
  return true;
}
