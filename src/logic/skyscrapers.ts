import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Skyscrapers. An n×n Latin square of building heights 1..n; an edge clue counts
// how many buildings are visible from that side (a taller one hides shorter ones
// behind it). Generator + uniqueness follow the Sudoku/Futoshiki pattern; 0 = no
// clue on that edge.

export type Grid = number[];
export interface Clues { top: number[]; bottom: number[]; left: number[]; right: number[]; }
export interface Puzzle { size: number; solution: Grid; clues: Clues; }

export function visible(seq: number[]): number {
  let max = 0;
  let count = 0;
  for (const v of seq) if (v > max) { max = v; count++; }
  return count;
}

function inRowOrCol(g: Grid, size: number, i: number, v: number): boolean {
  const r = Math.floor(i / size);
  const c = i % size;
  for (let k = 0; k < size; k++) {
    if (k !== c && g[r * size + k] === v) return true;
    if (k !== r && g[k * size + c] === v) return true;
  }
  return false;
}

function rowOf(g: Grid, size: number, r: number): number[] {
  return g.slice(r * size, r * size + size);
}
function colOf(g: Grid, size: number, c: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < size; r++) out.push(g[r * size + c]);
  return out;
}

function checkRow(g: Grid, size: number, r: number, clues: Clues): boolean {
  const row = rowOf(g, size, r);
  if (clues.left[r] && visible(row) !== clues.left[r]) return false;
  if (clues.right[r] && visible([...row].reverse()) !== clues.right[r]) return false;
  return true;
}
function checkCol(g: Grid, size: number, c: number, clues: Clues): boolean {
  const col = colOf(g, size, c);
  if (clues.top[c] && visible(col) !== clues.top[c]) return false;
  if (clues.bottom[c] && visible([...col].reverse()) !== clues.bottom[c]) return false;
  return true;
}

function fillLatin(g: Grid, size: number, rng: Rng): boolean {
  const i = g.indexOf(0);
  if (i === -1) return true;
  for (const v of shuffle([...Array(size).keys()].map((x) => x + 1), rng)) {
    if (!inRowOrCol(g, size, i, v)) {
      g[i] = v;
      if (fillLatin(g, size, rng)) return true;
      g[i] = 0;
    }
  }
  return false;
}

function search(size: number, clues: Clues, limit: number): number {
  const g = new Array(size * size).fill(0);
  let count = 0;
  let steps = 0;
  let capped = false;
  const CAP = 300000;
  const rec = (i: number): void => {
    if (count >= limit || capped) return;
    if (++steps > CAP) { capped = true; return; }
    if (i === size * size) { count++; return; }
    const r = Math.floor(i / size);
    const c = i % size;
    for (let v = 1; v <= size; v++) {
      if (inRowOrCol(g, size, i, v)) continue;
      g[i] = v;
      let ok = true;
      if (c === size - 1 && !checkRow(g, size, r, clues)) ok = false;
      if (ok && r === size - 1 && !checkCol(g, size, c, clues)) ok = false;
      if (ok) rec(i + 1);
      g[i] = 0;
      if (count >= limit) return;
    }
  };
  rec(0);
  return capped ? limit : count;
}

export function countSolutions(size: number, clues: Clues, limit = 2): number {
  return search(size, clues, limit);
}

export function solve(size: number, clues: Clues): Grid | null {
  const g = new Array(size * size).fill(0);
  const rec = (i: number): boolean => {
    if (i === size * size) return true;
    const r = Math.floor(i / size);
    const c = i % size;
    for (let v = 1; v <= size; v++) {
      if (inRowOrCol(g, size, i, v)) continue;
      g[i] = v;
      let ok = true;
      if (c === size - 1 && !checkRow(g, size, r, clues)) ok = false;
      if (ok && r === size - 1 && !checkCol(g, size, c, clues)) ok = false;
      if (ok && rec(i + 1)) return true;
      g[i] = 0;
    }
    return false;
  };
  return rec(0) ? g : null;
}

function fullClues(solution: Grid, size: number): Clues {
  const top: number[] = [], bottom: number[] = [], left: number[] = [], right: number[] = [];
  for (let c = 0; c < size; c++) {
    const col = colOf(solution, size, c);
    top.push(visible(col));
    bottom.push(visible([...col].reverse()));
  }
  for (let r = 0; r < size; r++) {
    const row = rowOf(solution, size, r);
    left.push(visible(row));
    right.push(visible([...row].reverse()));
  }
  return { top, bottom, left, right };
}

export function generate(seed: number, size = 5): Puzzle {
  const rng = makeRng(seed);
  let solution = new Array(size * size).fill(0);
  let clues = fullClues(solution, size);
  // some Latin squares aren't pinned even by all edge clues — pick one that is
  for (let attempt = 0; attempt < 50; attempt++) {
    solution = new Array(size * size).fill(0);
    fillLatin(solution, size, rng);
    clues = fullClues(solution, size);
    if (countSolutions(size, clues, 2) === 1) break;
  }

  // remove clues while the solution stays unique
  const sides: [keyof Clues, number][] = [];
  for (const side of ["top", "bottom", "left", "right"] as (keyof Clues)[])
    for (let k = 0; k < size; k++) sides.push([side, k]);
  for (const [side, k] of shuffle(sides, rng)) {
    const saved = clues[side][k];
    clues[side][k] = 0;
    if (countSolutions(size, clues, 2) !== 1) clues[side][k] = saved;
  }
  return { size, solution, clues };
}

export function conflicts(g: Grid, size: number, clues: Clues): boolean[] {
  const bad = new Array(size * size).fill(false);
  for (let i = 0; i < g.length; i++) {
    if (g[i] !== 0 && inRowOrCol(g, size, i, g[i])) bad[i] = true;
  }
  // completed lines that violate their clue
  for (let r = 0; r < size; r++) {
    if (rowOf(g, size, r).every((v) => v !== 0) && !checkRow(g, size, r, clues))
      for (let c = 0; c < size; c++) bad[r * size + c] = true;
  }
  for (let c = 0; c < size; c++) {
    if (colOf(g, size, c).every((v) => v !== 0) && !checkCol(g, size, c, clues))
      for (let r = 0; r < size; r++) bad[r * size + c] = true;
  }
  return bad;
}

export function isSolved(g: Grid, size: number, clues: Clues): boolean {
  if (g.some((v) => v === 0)) return false;
  return conflicts(g, size, clues).every((b) => !b);
}
