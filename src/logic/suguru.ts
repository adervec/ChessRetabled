import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Suguru (a.k.a. Tectonic). The grid is split into connected regions; each region
// of size k is filled with 1..k, and no two equal digits may touch — even
// diagonally. Generator + uniqueness follow the KenKen pattern. 0 = empty.

export type Grid = number[];
export interface Puzzle {
  size: number;
  solution: Grid;
  puzzle: Grid;
  givens: boolean[];
  regionId: number[];
  regionSize: number[]; // size of the region each cell belongs to
}

function neighbors4(i: number, size: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const out: number[] = [];
  if (r > 0) out.push(i - size);
  if (r < size - 1) out.push(i + size);
  if (c > 0) out.push(i - 1);
  if (c < size - 1) out.push(i + 1);
  return out;
}
function neighbors8(i: number, size: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < size && cc >= 0 && cc < size) out.push(rr * size + cc);
    }
  return out;
}

function partition(size: number, rng: Rng): number[] {
  const region = new Array(size * size).fill(-1);
  let id = 0;
  for (const start of shuffle([...Array(size * size).keys()], rng)) {
    if (region[start] !== -1) continue;
    region[start] = id;
    const members = [start];
    const want = 2 + rng.int(4); // regions of size 2..5 (lone cells force conflicts)
    while (members.length < want) {
      const frontier: number[] = [];
      for (const m of members) for (const nb of neighbors4(m, size)) if (region[nb] === -1) frontier.push(nb);
      if (frontier.length === 0) break;
      const pick = frontier[rng.int(frontier.length)];
      region[pick] = id;
      members.push(pick);
    }
    id++;
  }
  return region;
}

function canPlace(g: Grid, size: number, i: number, v: number, regionId: number[], regionSize: number[]): boolean {
  if (v < 1 || v > regionSize[i]) return false;
  const reg = regionId[i];
  for (let k = 0; k < g.length; k++) if (regionId[k] === reg && g[k] === v) return false; // region distinct
  for (const nb of neighbors8(i, size)) if (g[nb] === v) return false; // no equal neighbour (8-dir)
  return true;
}

function candidates(g: Grid, size: number, i: number, regionId: number[], regionSize: number[]): number[] {
  const out: number[] = [];
  for (let v = 1; v <= regionSize[i]; v++) if (canPlace(g, size, i, v, regionId, regionSize)) out.push(v);
  return out;
}

/** Most-constrained empty cell: -1 = solved, -2 = dead end (some empty has 0 options). */
function bestCell(g: Grid, size: number, regionId: number[], regionSize: number[]): { i: number; cands: number[] } {
  let bi = -1;
  let best: number[] | null = null;
  for (let i = 0; i < g.length; i++) {
    if (g[i] !== 0) continue;
    const c = candidates(g, size, i, regionId, regionSize);
    if (c.length === 0) return { i: -2, cands: [] };
    if (best === null || c.length < best.length) { bi = i; best = c; if (c.length === 1) break; }
  }
  return { i: bi, cands: best ?? [] };
}

function fill(g: Grid, size: number, rng: Rng, regionId: number[], regionSize: number[]): boolean {
  const { i, cands } = bestCell(g, size, regionId, regionSize);
  if (i === -1) return true;
  if (i === -2) return false;
  for (const v of shuffle(cands, rng)) {
    g[i] = v;
    if (fill(g, size, rng, regionId, regionSize)) return true;
    g[i] = 0;
  }
  return false;
}

export function countSolutions(puzzle: Grid, size: number, regionId: number[], regionSize: number[], limit = 2): number {
  const g = puzzle.slice();
  let count = 0;
  let steps = 0;
  let capped = false;
  const rec = (): void => {
    if (count >= limit || capped) return;
    if (++steps > 200000) { capped = true; return; }
    const { i, cands } = bestCell(g, size, regionId, regionSize);
    if (i === -1) { count++; return; }
    if (i === -2) return;
    for (const v of cands) {
      g[i] = v;
      rec();
      g[i] = 0;
      if (count >= limit || capped) return;
    }
  };
  rec();
  return capped ? limit : count; // over-budget ⇒ treat as "not unique" (keep the clue)
}

export function solve(puzzle: Grid, size: number, regionId: number[], regionSize: number[]): Grid | null {
  const g = puzzle.slice();
  const rec = (): boolean => {
    const { i, cands } = bestCell(g, size, regionId, regionSize);
    if (i === -1) return true;
    if (i === -2) return false;
    for (const v of cands) {
      g[i] = v;
      if (rec()) return true;
      g[i] = 0;
    }
    return false;
  };
  return rec() ? g : null;
}

export function generate(seed: number, size = 6): Puzzle {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 300; attempt++) {
    const regionId = partition(size, rng);
    const counts: Record<number, number> = {};
    for (const id of regionId) counts[id] = (counts[id] ?? 0) + 1;
    const regionSize = regionId.map((id) => counts[id]);
    const solution = new Array(size * size).fill(0);
    if (!fill(solution, size, rng, regionId, regionSize)) continue;

    const puzzle = solution.slice();
    for (const i of shuffle([...Array(size * size).keys()], rng)) {
      const saved = puzzle[i];
      puzzle[i] = 0;
      if (countSolutions(puzzle, size, regionId, regionSize, 2) !== 1) puzzle[i] = saved;
    }
    return { size, solution, puzzle, givens: puzzle.map((v) => v !== 0), regionId, regionSize };
  }
  // fallback (essentially never hit): keep trying partitions until one fills,
  // then give it all-given so it's at least valid.
  for (let attempt = 0; ; attempt++) {
    const r2 = makeRng((seed + 99991 * (attempt + 1)) >>> 0);
    const regionId = partition(size, r2);
    const counts: Record<number, number> = {};
    for (const id of regionId) counts[id] = (counts[id] ?? 0) + 1;
    const regionSize = regionId.map((id) => counts[id]);
    const solution = new Array(size * size).fill(0);
    if (fill(solution, size, r2, regionId, regionSize)) {
      return { size, solution, puzzle: solution.slice(), givens: solution.map(() => true), regionId, regionSize };
    }
  }
}

export function conflicts(g: Grid, size: number, regionId: number[], regionSize: number[]): boolean[] {
  const bad = new Array(g.length).fill(false);
  for (let i = 0; i < g.length; i++) {
    if (g[i] === 0) continue;
    if (g[i] > regionSize[i]) { bad[i] = true; continue; }
    for (let k = 0; k < g.length; k++) if (k !== i && regionId[k] === regionId[i] && g[k] === g[i]) bad[i] = true;
    for (const nb of neighbors8(i, size)) if (g[nb] === g[i]) bad[i] = true;
  }
  return bad;
}

export function isSolved(g: Grid, size: number, regionId: number[], regionSize: number[]): boolean {
  if (g.some((v) => v === 0)) return false;
  return conflicts(g, size, regionId, regionSize).every((b) => !b);
}
