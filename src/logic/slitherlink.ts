import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Slitherlink. Draw a single closed loop on the lattice so each numbered cell
// has exactly that many of its four sides on the loop. The trick that keeps this
// correct: a loop is exactly the boundary of an "inside" region of cells. So a
// solution is a 2-colouring of cells (inside / outside, the exterior counting as
// outside) whose inside is connected and whose outside-plus-exterior is also
// connected — that boundary is guaranteed to be one simple loop. We generate by
// growing such a region and reading off the clues, then drop clues while the
// solution stays unique. Uniqueness is checked by colour-backtracking with
// clue bounds pruning.

export interface Puzzle {
  rows: number;
  cols: number;
  clue: number[]; // length rows*cols; -1 = blank, else 0..3
  solution: boolean[]; // inside/outside per cell
}

/** The four orthogonal neighbour cells of cell i, or -1 for the exterior. */
function neighborCells(i: number, rows: number, cols: number): number[] {
  const r = Math.floor(i / cols), c = i % cols;
  return [
    r > 0 ? i - cols : -1, // top
    r < rows - 1 ? i + cols : -1, // bottom
    c > 0 ? i - 1 : -1, // left
    c < cols - 1 ? i + 1 : -1, // right
  ];
}

/** How many of cell i's sides lie on the loop (a side is on the loop iff the two cells differ). */
function boundaryCount(inside: boolean[], i: number, rows: number, cols: number): number {
  let n = 0;
  for (const nb of neighborCells(i, rows, cols)) {
    const other = nb < 0 ? false : inside[nb]; // exterior is "outside"
    if (inside[i] !== other) n++;
  }
  return n;
}

/** True iff the boundary of the inside region is exactly one simple loop. */
function singleLoop(inside: boolean[], rows: number, cols: number): boolean {
  const n = rows * cols;
  const ins: number[] = [], outs: number[] = [];
  for (let i = 0; i < n; i++) (inside[i] ? ins : outs).push(i);
  if (ins.length === 0) return false; // empty loop is not a loop
  // inside must be one connected blob
  const seenIn = new Set<number>([ins[0]]);
  let stack = [ins[0]];
  while (stack.length) {
    const i = stack.pop()!;
    for (const nb of neighborCells(i, rows, cols)) if (nb >= 0 && inside[nb] && !seenIn.has(nb)) { seenIn.add(nb); stack.push(nb); }
  }
  if (seenIn.size !== ins.length) return false;
  // outside (plus the exterior) must be one connected blob: flood from every
  // border outside-cell (all of which touch the exterior).
  const seenOut = new Set<number>();
  stack = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const onBorder = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
    if (!inside[i] && onBorder && !seenOut.has(i)) { seenOut.add(i); stack.push(i); }
  }
  while (stack.length) {
    const i = stack.pop()!;
    for (const nb of neighborCells(i, rows, cols)) if (nb >= 0 && !inside[nb] && !seenOut.has(nb)) { seenOut.add(nb); stack.push(nb); }
  }
  return seenOut.size === outs.length; // every outside cell reachable from the exterior
}

export function countSolutions(clue: number[], rows: number, cols: number, limit = 2): number {
  const n = rows * cols;
  const color = new Array<number>(n).fill(-1); // -1 unset, 0 outside, 1 inside
  let count = 0, steps = 0, capped = false;

  const feasible = (j: number): boolean => {
    if (clue[j] < 0 || color[j] < 0) return true;
    let known = 0, unknown = 0;
    for (const nb of neighborCells(j, rows, cols)) {
      if (nb >= 0 && color[nb] < 0) { unknown++; continue; }
      const other = nb < 0 ? 0 : color[nb];
      if ((color[j] === 1) !== (other === 1)) known++;
    }
    return known <= clue[j] && clue[j] <= known + unknown;
  };

  const rec = (i: number): void => {
    if (count >= limit || capped) return;
    if (++steps > 600000) { capped = true; return; }
    if (i === n) {
      const sol = color.map((x) => x === 1);
      for (let j = 0; j < n; j++) if (clue[j] >= 0 && boundaryCount(sol, j, rows, cols) !== clue[j]) return;
      if (singleLoop(sol, rows, cols)) count++;
      return;
    }
    for (const v of [0, 1]) {
      color[i] = v;
      let ok = feasible(i);
      if (ok) for (const nb of neighborCells(i, rows, cols)) {
        if (nb >= 0 && color[nb] >= 0 && !feasible(nb)) { ok = false; break; }
      }
      if (ok) rec(i + 1);
      color[i] = -1;
      if (count >= limit || capped) return;
    }
  };
  rec(0);
  return capped ? limit : count;
}

function growRegion(rows: number, cols: number, rng: Rng): boolean[] {
  const n = rows * cols;
  const inside = new Array<boolean>(n).fill(false);
  const start = rng.int(n);
  inside[start] = true;
  let size = 1;
  const target = Math.floor(n * (0.35 + rng.next() * 0.25));
  while (size < target) {
    const frontier: number[] = [];
    for (let i = 0; i < n; i++) if (inside[i]) for (const nb of neighborCells(i, rows, cols)) if (nb >= 0 && !inside[nb]) frontier.push(nb);
    if (frontier.length === 0) break;
    inside[frontier[rng.int(frontier.length)]] = true;
    size++;
  }
  return inside;
}

export function generate(seed: number, rows = 6, cols = 6): Puzzle {
  const rng = makeRng(seed);
  const n = rows * cols;
  for (let attempt = 0; attempt < 200; attempt++) {
    const inside = growRegion(rows, cols, rng);
    if (!singleLoop(inside, rows, cols)) continue;
    const full = inside.map((_, i) => boundaryCount(inside, i, rows, cols));
    if (countSolutions(full, rows, cols, 2) !== 1) continue;
    const clue = full.slice();
    for (const j of shuffle([...Array(n).keys()], rng)) {
      const saved = clue[j];
      clue[j] = -1;
      if (countSolutions(clue, rows, cols, 2) !== 1) clue[j] = saved; // removal broke uniqueness
    }
    return { rows, cols, clue, solution: inside };
  }
  // Fallback: a 2×2 inside block in the corner — always a valid unique loop.
  const inside = new Array<boolean>(n).fill(false);
  inside[0] = inside[1] = inside[cols] = inside[cols + 1] = true;
  return { rows, cols, clue: inside.map((_, i) => boundaryCount(inside, i, rows, cols)), solution: inside };
}

// ---- UI helpers: work in terms of the drawn edges ----
// Horizontal edges: index r*cols + c, r in 0..rows, c in 0..cols-1 (top of cell (r,c)).
// Vertical edges:   index r*(cols+1) + c, r in 0..rows-1, c in 0..cols (left of cell (r,c)).
export const hCount = (rows: number, cols: number) => (rows + 1) * cols;
export const vCount = (rows: number, cols: number) => rows * (cols + 1);

/** Convert an inside/outside solution to the set of loop edges (for "reveal"). */
export function solutionEdges(p: Puzzle): { h: boolean[]; v: boolean[] } {
  const { rows, cols, solution } = p;
  const h = new Array<boolean>(hCount(rows, cols)).fill(false);
  const v = new Array<boolean>(vCount(rows, cols)).fill(false);
  const inAt = (r: number, c: number) => (r < 0 || c < 0 || r >= rows || c >= cols ? false : solution[r * cols + c]);
  for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) if (inAt(r - 1, c) !== inAt(r, c)) h[r * cols + c] = true;
  for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) if (inAt(r, c - 1) !== inAt(r, c)) v[r * (cols + 1) + c] = true;
  return { h, v };
}

/** The four loop edges around cell (r,c): [top, bottom, left, right] as {kind,index}. */
export function cellEdges(r: number, c: number, cols: number): { h: number[]; v: number[] } {
  return {
    h: [r * cols + c, (r + 1) * cols + c], // top, bottom
    v: [r * (cols + 1) + c, r * (cols + 1) + c + 1], // left, right
  };
}

/** Is the player's drawn edge set a winning loop: clues satisfied + one closed loop. */
export function isSolved(h: boolean[], v: boolean[], clue: number[], rows: number, cols: number): boolean {
  // clue satisfaction
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = clue[r * cols + c];
    if (k < 0) continue;
    const e = cellEdges(r, c, cols);
    const used = (e.h[0] !== undefined && h[e.h[0]] ? 1 : 0) + (h[e.h[1]] ? 1 : 0) + (v[e.v[0]] ? 1 : 0) + (v[e.v[1]] ? 1 : 0);
    if (used !== k) return false;
  }
  // dot degrees: every dot has 0 or 2 incident edges, and at least one edge exists
  const dots = (rows + 1) * (cols + 1);
  const deg = new Array<number>(dots).fill(0);
  const dot = (r: number, c: number) => r * (cols + 1) + c;
  const adj: number[][] = Array.from({ length: dots }, () => []);
  let edgeTotal = 0;
  for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) if (h[r * cols + c]) {
    const a = dot(r, c), b = dot(r, c + 1); deg[a]++; deg[b]++; adj[a].push(b); adj[b].push(a); edgeTotal++;
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) if (v[r * (cols + 1) + c]) {
    const a = dot(r, c), b = dot(r + 1, c); deg[a]++; deg[b]++; adj[a].push(b); adj[b].push(a); edgeTotal++;
  }
  if (edgeTotal === 0) return false;
  for (let d = 0; d < dots; d++) if (deg[d] !== 0 && deg[d] !== 2) return false;
  // single connected loop: all used dots reachable from any used dot
  let startDot = -1;
  for (let d = 0; d < dots; d++) if (deg[d] === 2) { startDot = d; break; }
  const seen = new Set<number>([startDot]);
  const stack = [startDot];
  while (stack.length) {
    const d = stack.pop()!;
    for (const nb of adj[d]) if (!seen.has(nb)) { seen.add(nb); stack.push(nb); }
  }
  for (let d = 0; d < dots; d++) if (deg[d] === 2 && !seen.has(d)) return false; // a second, separate loop
  return true;
}
