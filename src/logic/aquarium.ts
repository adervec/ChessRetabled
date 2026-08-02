import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Aquarium. The grid is split into connected "aquariums". Water settles by level:
// within an aquarium every cell at or below the water line is filled. Row/column
// clues count filled cells. Generator + uniqueness via per-aquarium level choice.

export interface Puzzle {
  size: number;
  regionId: number[];
  rowClue: number[];
  colClue: number[];
  solution: boolean[];
}

function neighbors4(i: number, size: number): number[] {
  const r = Math.floor(i / size), c = i % size;
  const out: number[] = [];
  if (r > 0) out.push(i - size);
  if (r < size - 1) out.push(i + size);
  if (c > 0) out.push(i - 1);
  if (c < size - 1) out.push(i + 1);
  return out;
}

function partition(size: number, rng: Rng): number[] {
  const region = new Array(size * size).fill(-1);
  let id = 0;
  for (const start of shuffle([...Array(size * size).keys()], rng)) {
    if (region[start] !== -1) continue;
    region[start] = id;
    const members = [start];
    const want = 3 + rng.int(6);
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

/** All distinct water-sets for an aquarium: flooded = cells with row >= waterTop. */
function regionOptions(cells: number[], size: number): number[][] {
  const rows = [...new Set(cells.map((i) => Math.floor(i / size)))].sort((a, b) => a - b);
  const opts: number[][] = [[]]; // empty (no water)
  for (const t of [...rows].reverse()) {
    opts.push(cells.filter((i) => Math.floor(i / size) >= t));
  }
  return opts;
}

function buildRegions(regionId: number[]): number[][] {
  const groups = new Map<number, number[]>();
  regionId.forEach((id, i) => { const a = groups.get(id) ?? []; a.push(i); groups.set(id, a); });
  return [...groups.values()];
}

export function countSolutions(regionId: number[], size: number, rowClue: number[], colClue: number[], limit = 2): number {
  const regions = buildRegions(regionId);
  const options = regions.map((cells) => regionOptions(cells, size));
  const rowW = new Array(size).fill(0);
  const colW = new Array(size).fill(0);
  let count = 0;
  let steps = 0;
  let capped = false;
  const rec = (k: number): void => {
    if (count >= limit || capped) return;
    if (++steps > 300000) { capped = true; return; }
    if (k === regions.length) {
      for (let i = 0; i < size; i++) if (rowW[i] !== rowClue[i] || colW[i] !== colClue[i]) return;
      count++;
      return;
    }
    for (const opt of options[k]) {
      let ok = true;
      for (const cell of opt) { const r = Math.floor(cell / size), c = cell % size; rowW[r]++; colW[c]++; if (rowW[r] > rowClue[r] || colW[c] > colClue[c]) ok = false; }
      if (ok) rec(k + 1);
      for (const cell of opt) { rowW[Math.floor(cell / size)]--; colW[cell % size]--; }
      if (count >= limit || capped) return;
    }
  };
  rec(0);
  return capped ? limit : count;
}

export function generate(seed: number, size = 6): Puzzle {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 120; attempt++) {
    const regionId = partition(size, rng);
    const regions = buildRegions(regionId);
    const solution = new Array(size * size).fill(false);
    for (const cells of regions) {
      const opts = regionOptions(cells, size);
      for (const cell of opts[rng.int(opts.length)]) solution[cell] = true;
    }
    const rowClue = new Array(size).fill(0);
    const colClue = new Array(size).fill(0);
    solution.forEach((w, i) => { if (w) { rowClue[Math.floor(i / size)]++; colClue[i % size]++; } });
    if (countSolutions(regionId, size, rowClue, colClue, 2) === 1) {
      return { size, regionId, rowClue, colClue, solution };
    }
  }
  // fallback: empty aquariums (all clues 0) is trivially unique
  const regionId = partition(size, rng);
  return { size, regionId, rowClue: new Array(size).fill(0), colClue: new Array(size).fill(0), solution: new Array(size * size).fill(false) };
}

export function counts(water: boolean[], size: number): { row: number[]; col: number[] } {
  const row = new Array(size).fill(0);
  const col = new Array(size).fill(0);
  water.forEach((w, i) => { if (w) { row[Math.floor(i / size)]++; col[i % size]++; } });
  return { row, col };
}

export function isSolved(water: boolean[], size: number, rowClue: number[], colClue: number[]): boolean {
  const { row, col } = counts(water, size);
  return row.every((v, i) => v === rowClue[i]) && col.every((v, i) => v === colClue[i]);
}
