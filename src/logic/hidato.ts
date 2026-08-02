import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Hidato. Fill the grid with 1..N so consecutive numbers are always adjacent
// (including diagonals). Generated from a random Hamiltonian path; clues are then
// thinned while the reconstruction stays unique. 0 = empty.

export type Grid = number[];
export interface Puzzle { size: number; board: Grid; solution: Grid; givens: boolean[]; }

function neighbors8(i: number, size: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < size && cc >= 0 && cc < size) out.push(rr * size + cc);
    }
  return out;
}
function adjacent8(a: number, b: number, size: number): boolean {
  return neighbors8(a, size).includes(b);
}

function hamiltonianPath(size: number, rng: Rng): number[] | null {
  const n = size * size;
  const visited = new Array(n).fill(false);
  const path: number[] = [];
  let steps = 0;
  const dfs = (cell: number): boolean => {
    if (++steps > 200000) return false; // bail; the caller retries with a fresh order
    visited[cell] = true;
    path.push(cell);
    if (path.length === n) return true;
    for (const nb of shuffle(neighbors8(cell, size), rng)) {
      if (!visited[nb] && dfs(nb)) return true;
    }
    visited[cell] = false;
    path.pop();
    return false;
  };
  return dfs(rng.int(n)) ? path : null;
}

/** Count reconstructions of the number chain consistent with the given clues. */
export function countSolutions(board: Grid, size: number, limit = 2): number {
  const n = size * size;
  const givenPos = new Map<number, number>();
  board.forEach((v, i) => { if (v !== 0) givenPos.set(v, i); });
  if (!givenPos.has(1)) return 0;
  const visited = new Array(n).fill(false);
  let count = 0;
  let steps = 0;
  let capped = false;
  const CAP = 60000;
  const rec = (k: number, last: number): void => {
    if (count >= limit || capped) return;
    if (++steps > CAP) { capped = true; return; }
    if (k > n) { count++; return; }
    const fixed = givenPos.get(k);
    if (fixed !== undefined) {
      if (visited[fixed]) return;
      if (k > 1 && !adjacent8(last, fixed, size)) return;
      visited[fixed] = true;
      rec(k + 1, fixed);
      visited[fixed] = false;
      return;
    }
    for (const nb of neighbors8(last, size)) {
      if (!visited[nb] && board[nb] === 0) {
        visited[nb] = true;
        rec(k + 1, nb);
        visited[nb] = false;
        if (count >= limit) return;
      }
    }
  };
  const startCell = givenPos.get(1)!;
  visited[startCell] = true;
  rec(2, startCell);
  return capped ? limit : count; // treat an over-budget search as "not unique"
}

export function generate(seed: number, size = 6): Puzzle {
  let rng = makeRng(seed);
  let path: number[] | null = null;
  for (let attempt = 0; attempt < 30 && !path; attempt++) {
    path = hamiltonianPath(size, rng);
    if (!path) rng = makeRng((seed + 1013 * (attempt + 1)) >>> 0);
  }
  if (!path) path = [...Array(size * size).keys()]; // fallback (shouldn't happen)

  const n = size * size;
  const solution = new Array(n).fill(0);
  path.forEach((cell, k) => { solution[cell] = k + 1; });

  const board = solution.slice();
  const removable = shuffle([...Array(n).keys()], rng).filter((i) => solution[i] !== 1 && solution[i] !== n);
  for (const i of removable) {
    const saved = board[i];
    board[i] = 0;
    if (countSolutions(board, size, 2) !== 1) board[i] = saved;
  }
  return { size, board, solution, givens: board.map((v) => v !== 0) };
}

export function conflicts(g: Grid, size: number): boolean[] {
  const n = size * size;
  const bad = new Array(n).fill(false);
  const pos = new Map<number, number[]>();
  g.forEach((v, i) => { if (v !== 0) { const a = pos.get(v) ?? []; a.push(i); pos.set(v, a); } });
  for (const [v, cells] of pos) {
    if (cells.length > 1) for (const i of cells) bad[i] = true; // duplicate value
    if (v >= 1) {
      const prev = pos.get(v - 1);
      const next = pos.get(v + 1);
      for (const i of cells) {
        if (prev && prev.length === 1 && !adjacent8(i, prev[0], size)) bad[i] = true;
        if (next && next.length === 1 && !adjacent8(i, next[0], size)) bad[i] = true;
      }
    }
  }
  return bad;
}

export function isSolved(g: Grid, size: number): boolean {
  const n = size * size;
  if (g.some((v) => v < 1 || v > n)) return false;
  if (new Set(g).size !== n) return false;
  const pos = new Array(n + 1).fill(-1);
  g.forEach((v, i) => { pos[v] = i; });
  for (let k = 1; k < n; k++) if (!adjacent8(pos[k], pos[k + 1], size)) return false;
  return true;
}
