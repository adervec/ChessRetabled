import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Kakuro. White cells hold 1–9; each across/down run has distinct digits that sum
// to the clue in the black cell starting it. Clues live in `right` (across sum)
// and `down` (down sum) on black cells. kind: 0 = white, 1 = black.

export interface Puzzle {
  size: number;
  kind: number[]; // 0 white, 1 black
  right: number[]; // across-sum clue (black cells)
  down: number[]; // down-sum clue (black cells)
  solution: number[]; // digit per white cell (0 on black)
}

interface Runs {
  hRun: number[]; vRun: number[];
  hLen: number[]; vLen: number[];
  hClueCell: number[]; vClueCell: number[];
  hCount: number; vCount: number;
}

function computeRuns(kind: number[], size: number): Runs {
  const hRun = new Array(size * size).fill(-1);
  const vRun = new Array(size * size).fill(-1);
  const hLen: number[] = [], vLen: number[] = [], hClueCell: number[] = [], vClueCell: number[] = [];
  let hid = -1;
  for (let r = 0; r < size; r++) {
    let active = false;
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      if (kind[i] === 0) {
        if (!active) { hid++; hLen[hid] = 0; hClueCell[hid] = i - 1; active = true; }
        hRun[i] = hid; hLen[hid]++;
      } else active = false;
    }
  }
  let vid = -1;
  for (let c = 0; c < size; c++) {
    let active = false;
    for (let r = 0; r < size; r++) {
      const i = r * size + c;
      if (kind[i] === 0) {
        if (!active) { vid++; vLen[vid] = 0; vClueCell[vid] = i - size; active = true; }
        vRun[i] = vid; vLen[vid]++;
      } else active = false;
    }
  }
  return { hRun, vRun, hLen, vLen, hClueCell, vClueCell, hCount: hid + 1, vCount: vid + 1 };
}

function searchCore(
  p: Puzzle, runs: Runs, limit: number, wantSolution: boolean,
  distinctOnly: boolean, rng: Rng | null
): { count: number; solution: number[] | null } {
  const { size, kind, right, down } = p;
  const whites: number[] = [];
  for (let i = 0; i < kind.length; i++) if (kind[i] === 0) whites.push(i);
  const hClue = (id: number) => right[runs.hClueCell[id]];
  const vClue = (id: number) => down[runs.vClueCell[id]];

  const hUsed = new Array(runs.hCount).fill(0);
  const vUsed = new Array(runs.vCount).fill(0);
  const hSum = new Array(runs.hCount).fill(0);
  const vSum = new Array(runs.vCount).fill(0);
  const hFill = new Array(runs.hCount).fill(0);
  const vFill = new Array(runs.vCount).fill(0);
  const grid = new Array(size * size).fill(0);

  let count = 0;
  let solution: number[] | null = null;
  let steps = 0;
  let capped = false;

  const order = (cell: number): number[] => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    void cell;
    return rng ? shuffle(base, rng) : base;
  };

  const ok = (cell: number, v: number): boolean => {
    const hr = runs.hRun[cell], vr = runs.vRun[cell];
    const bit = 1 << v;
    if (hUsed[hr] & bit || vUsed[vr] & bit) return false;
    if (!distinctOnly) {
      if (hSum[hr] + v > hClue(hr) || vSum[vr] + v > vClue(vr)) return false;
      if (hFill[hr] + 1 === runs.hLen[hr] && hSum[hr] + v !== hClue(hr)) return false;
      if (vFill[vr] + 1 === runs.vLen[vr] && vSum[vr] + v !== vClue(vr)) return false;
    }
    return true;
  };

  const rec = (j: number): void => {
    if (count >= limit || capped) return;
    if (++steps > 150000) { capped = true; return; }
    if (j === whites.length) {
      count++;
      if (wantSolution && !solution) solution = grid.slice();
      return;
    }
    const cell = whites[j];
    const hr = runs.hRun[cell], vr = runs.vRun[cell];
    for (const v of order(cell)) {
      if (!ok(cell, v)) continue;
      const bit = 1 << v;
      grid[cell] = v;
      hUsed[hr] |= bit; vUsed[vr] |= bit; hSum[hr] += v; vSum[vr] += v; hFill[hr]++; vFill[vr]++;
      rec(j + 1);
      grid[cell] = 0;
      hUsed[hr] &= ~bit; vUsed[vr] &= ~bit; hSum[hr] -= v; vSum[vr] -= v; hFill[hr]--; vFill[vr]--;
      if (count >= limit || capped) return;
    }
  };
  rec(0);
  return { count: capped ? limit : count, solution };
}

export function countSolutions(p: Puzzle, limit = 2): number {
  return searchCore(p, computeRuns(p.kind, p.size), limit, false, false, null).count;
}
export function solve(p: Puzzle): number[] | null {
  return searchCore(p, computeRuns(p.kind, p.size), 1, true, false, null).solution;
}

export function generate(seed: number, size = 7): Puzzle {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 60; attempt++) {
    const kind = new Array(size * size).fill(0);
    for (let i = 0; i < size * size; i++) {
      const r = Math.floor(i / size), c = i % size;
      if (r === 0 || c === 0 || rng.next() < 0.12) kind[i] = 1;
    }
    const runs = computeRuns(kind, size);
    // every run must have length 1..9 (distinct digits); skip layouts that break it
    if (runs.hLen.some((l) => l > 9) || runs.vLen.some((l) => l > 9)) continue;

    // fill a distinct-per-run solution (no sums yet)
    const base: Puzzle = { size, kind, right: new Array(size * size).fill(0), down: new Array(size * size).fill(0), solution: [] };
    const filled = searchCore(base, runs, 1, true, true, rng).solution;
    if (!filled) continue;

    // derive clues from the filled solution
    const right = new Array(size * size).fill(0);
    const down = new Array(size * size).fill(0);
    for (let id = 0; id < runs.hCount; id++) {
      let sum = 0;
      for (let i = 0; i < filled.length; i++) if (runs.hRun[i] === id) sum += filled[i];
      right[runs.hClueCell[id]] = sum;
    }
    for (let id = 0; id < runs.vCount; id++) {
      let sum = 0;
      for (let i = 0; i < filled.length; i++) if (runs.vRun[i] === id) sum += filled[i];
      down[runs.vClueCell[id]] = sum;
    }
    const puzzle: Puzzle = { size, kind, right, down, solution: filled };
    if (countSolutions(puzzle, 2) === 1) return puzzle;
  }
  // tiny fallback (should never hit): a 3x3 with one white cell
  const kind = new Array(size * size).fill(1);
  kind[size + 1] = 0;
  const right = new Array(size * size).fill(0);
  const down = new Array(size * size).fill(0);
  right[size] = 5; down[1] = 5;
  const solution = new Array(size * size).fill(0);
  solution[size + 1] = 5;
  return { size, kind, right, down, solution };
}

export function conflicts(grid: number[], p: Puzzle): boolean[] {
  const runs = computeRuns(p.kind, p.size);
  const bad = new Array(p.kind.length).fill(false);
  const flagRun = (cells: number[], clue: number, len: number) => {
    const filled = cells.filter((i) => grid[i] !== 0);
    const vals = filled.map((i) => grid[i]);
    const dup = new Set(vals).size !== vals.length;
    const sum = vals.reduce((a, b) => a + b, 0);
    if (dup || sum > clue || (filled.length === len && sum !== clue)) for (const i of cells) if (grid[i] !== 0) bad[i] = true;
  };
  for (let id = 0; id < runs.hCount; id++) {
    const cells = runs.hRun.map((rid, i) => (rid === id ? i : -1)).filter((i) => i >= 0);
    flagRun(cells, p.right[runs.hClueCell[id]], runs.hLen[id]);
  }
  for (let id = 0; id < runs.vCount; id++) {
    const cells = runs.vRun.map((rid, i) => (rid === id ? i : -1)).filter((i) => i >= 0);
    flagRun(cells, p.down[runs.vClueCell[id]], runs.vLen[id]);
  }
  return bad;
}

export function isSolved(grid: number[], p: Puzzle): boolean {
  for (let i = 0; i < p.kind.length; i++) if (p.kind[i] === 0 && (grid[i] < 1 || grid[i] > 9)) return false;
  return conflicts(grid, p).every((b) => !b);
}
