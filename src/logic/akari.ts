import { makeRng, shuffle } from "../cards/core/rng.ts";

// Akari / Light Up. Place bulbs on white cells so every white cell is lit (a bulb
// lights its row/column run until a wall blocks it), no bulb lights another, and
// every numbered wall has exactly that many bulbs orthogonally adjacent.
//
// Cell codes in `walls`: -1 = white, -2 = blank wall, 0..4 = numbered wall.

export const WHITE = -1;
export const WALL = -2;

export interface Puzzle {
  size: number;
  walls: number[];
  solution: boolean[]; // bulbs
}

function orth(i: number, size: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const out: number[] = [];
  if (r > 0) out.push(i - size);
  if (r < size - 1) out.push(i + size);
  if (c > 0) out.push(i - 1);
  if (c < size - 1) out.push(i + 1);
  return out;
}

interface Runs { hRun: number[]; vRun: number[]; hCount: number; vCount: number; }
function computeRuns(walls: number[], size: number): Runs {
  const hRun = new Array(size * size).fill(-1);
  const vRun = new Array(size * size).fill(-1);
  let hid = 0;
  for (let r = 0; r < size; r++) {
    let started = false;
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      if (walls[i] === WHITE) { if (!started) { hid++; started = true; } hRun[i] = hid; }
      else started = false;
    }
  }
  let vid = 0;
  for (let c = 0; c < size; c++) {
    let started = false;
    for (let r = 0; r < size; r++) {
      const i = r * size + c;
      if (walls[i] === WHITE) { if (!started) { vid++; started = true; } vRun[i] = vid; }
      else started = false;
    }
  }
  return { hRun, vRun, hCount: hid + 1, vCount: vid + 1 };
}

interface SearchResult { count: number; solution: boolean[] | null; }
function search(walls: number[], runs: Runs, numbersActive: boolean, size: number, limit: number, wantSolution: boolean): SearchResult {
  const whites: number[] = [];
  for (let i = 0; i < walls.length; i++) if (walls[i] === WHITE) whites.push(i);
  const numbered: number[] = [];
  for (let i = 0; i < walls.length; i++) if (walls[i] >= 0) numbered.push(i);

  const hBulb = new Array(runs.hCount).fill(false);
  const vBulb = new Array(runs.vCount).fill(false);
  const adj = new Array(walls.length).fill(0);
  const bulbs = new Array(walls.length).fill(false);
  const nbCache = whites.map((cell) => orth(cell, size));

  let count = 0;
  let solution: boolean[] | null = null;
  let steps = 0;
  let capped = false;

  const rec = (j: number): void => {
    if (count >= limit || capped) return;
    if (++steps > 600000) { capped = true; return; }
    if (j === whites.length) {
      for (const cell of whites) if (!hBulb[runs.hRun[cell]] && !vBulb[runs.vRun[cell]]) return; // unlit
      if (numbersActive) for (const b of numbered) if (adj[b] !== walls[b]) return;
      count++;
      if (wantSolution && !solution) solution = bulbs.slice();
      return;
    }
    const cell = whites[j];
    const hr = runs.hRun[cell];
    const vr = runs.vRun[cell];
    const nbs = nbCache[j];
    // option: place a bulb
    if (!hBulb[hr] && !vBulb[vr]) {
      let ok = true;
      if (numbersActive) for (const nb of nbs) if (walls[nb] >= 0 && adj[nb] + 1 > walls[nb]) { ok = false; break; }
      if (ok) {
        hBulb[hr] = true; vBulb[vr] = true; bulbs[cell] = true;
        for (const nb of nbs) if (walls[nb] >= 0) adj[nb]++;
        rec(j + 1);
        for (const nb of nbs) if (walls[nb] >= 0) adj[nb]--;
        bulbs[cell] = false; hBulb[hr] = false; vBulb[vr] = false;
      }
    }
    if (count >= limit || capped) return;
    // option: no bulb
    rec(j + 1);
  };
  rec(0);
  return { count: capped ? limit : count, solution };
}

export function countSolutions(walls: number[], size: number, limit = 2): number {
  return search(walls, computeRuns(walls, size), true, size, limit, false).count;
}

export function solve(walls: number[], size: number): boolean[] | null {
  return search(walls, computeRuns(walls, size), true, size, 1, true).solution;
}

function countAdj(bulbs: boolean[], i: number, size: number): number {
  return orth(i, size).reduce((n, nb) => n + (bulbs[nb] ? 1 : 0), 0);
}

export function generate(seed: number, size = 7): Puzzle {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 60; attempt++) {
    const walls = Array.from({ length: size * size }, () => (rng.next() < 0.2 ? WALL : WHITE));
    const runs = computeRuns(walls, size);
    // a valid lighting ignoring numbers
    const lit = search(walls, runs, false, size, 1, true).solution;
    if (!lit) continue;
    // number every wall by its adjacent bulb count, then require a unique solution
    const numbered = walls.map((w, i) => (w === WHITE ? WHITE : countAdj(lit, i, size)));
    if (countSolutions(numbered, size, 2) !== 1) continue;
    // blank some clues while the solution stays unique
    const wallCells = numbered.map((w, i) => (w >= 0 ? i : -1)).filter((i) => i >= 0);
    for (const b of shuffle(wallCells, rng)) {
      const saved = numbered[b];
      numbered[b] = WALL;
      if (countSolutions(numbered, size, 2) !== 1) numbered[b] = saved;
    }
    return { size, walls: numbered, solution: lit };
  }
  // fallback: a wall-free board lit by a single bulb (degenerate but valid)
  const walls = new Array(size * size).fill(WHITE);
  return { size, walls, solution: solve(walls, size) ?? new Array(size * size).fill(false) };
}

export function isSolved(walls: number[], bulbs: boolean[], size: number): boolean {
  const runs = computeRuns(walls, size);
  const hBulb = new Array(runs.hCount).fill(false);
  const vBulb = new Array(runs.vCount).fill(false);
  for (let i = 0; i < walls.length; i++) {
    if (bulbs[i] && walls[i] === WHITE) {
      if (hBulb[runs.hRun[i]] || vBulb[runs.vRun[i]]) return false; // sees another bulb
      hBulb[runs.hRun[i]] = true;
      vBulb[runs.vRun[i]] = true;
    }
  }
  for (let i = 0; i < walls.length; i++) {
    if (walls[i] === WHITE && !(hBulb[runs.hRun[i]] || vBulb[runs.vRun[i]])) return false; // unlit
    if (walls[i] >= 0 && countAdj(bulbs, i, size) !== walls[i]) return false; // wrong clue
  }
  return true;
}

/** Cells lit by at least one bulb (for the UI glow). */
export function litCells(walls: number[], bulbs: boolean[], size: number): boolean[] {
  const runs = computeRuns(walls, size);
  const hBulb = new Array(runs.hCount).fill(false);
  const vBulb = new Array(runs.vCount).fill(false);
  for (let i = 0; i < walls.length; i++) if (bulbs[i] && walls[i] === WHITE) { hBulb[runs.hRun[i]] = true; vBulb[runs.vRun[i]] = true; }
  return walls.map((w, i) => w === WHITE && (hBulb[runs.hRun[i]] || vBulb[runs.vRun[i]]));
}

/** Bulbs that illuminate another bulb — flagged red in the UI. */
export function bulbConflicts(walls: number[], bulbs: boolean[], size: number): boolean[] {
  const runs = computeRuns(walls, size);
  const bad = new Array(walls.length).fill(false);
  const push = (m: Map<number, number[]>, key: number, val: number) => {
    const a = m.get(key) ?? [];
    a.push(val);
    m.set(key, a);
  };
  const seenH = new Map<number, number[]>();
  const seenV = new Map<number, number[]>();
  for (let i = 0; i < walls.length; i++) {
    if (!bulbs[i] || walls[i] !== WHITE) continue;
    push(seenH, runs.hRun[i], i);
    push(seenV, runs.vRun[i], i);
  }
  for (const arr of [...seenH.values(), ...seenV.values()]) if (arr.length > 1) for (const i of arr) bad[i] = true;
  return bad;
}
