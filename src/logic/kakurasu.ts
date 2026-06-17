import { makeRng, type Rng } from "../cards/core/rng.ts";

// Kakurasu. Shade cells so each row's shaded cells sum to its clue (using the
// COLUMN index 1..n as each cell's weight) and each column's shaded cells sum to
// its clue (using the ROW index). Generator re-rolls a random shading until the
// clue set pins a unique solution.

export interface Puzzle {
  size: number;
  solution: boolean[];
  rowTargets: number[];
  colTargets: number[];
}

export function rowTargetsOf(shaded: boolean[], size: number): number[] {
  const out = new Array(size).fill(0);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) if (shaded[r * size + c]) out[r] += c + 1;
  return out;
}
export function colTargetsOf(shaded: boolean[], size: number): number[] {
  const out = new Array(size).fill(0);
  for (let c = 0; c < size; c++)
    for (let r = 0; r < size; r++) if (shaded[r * size + c]) out[c] += r + 1;
  return out;
}

export function countSolutions(size: number, rowT: number[], colT: number[], limit = 2): number {
  const rowSum = new Array(size).fill(0);
  const colSum = new Array(size).fill(0);
  let count = 0;
  const rec = (i: number): void => {
    if (count >= limit) return;
    if (i === size * size) { count++; return; }
    const r = Math.floor(i / size);
    const c = i % size;
    for (let s = 0; s <= 1; s++) {
      const rw = s ? c + 1 : 0;
      const cw = s ? r + 1 : 0;
      if (rowSum[r] + rw > rowT[r] || colSum[c] + cw > colT[c]) continue;
      rowSum[r] += rw;
      colSum[c] += cw;
      let ok = true;
      if (c === size - 1 && rowSum[r] !== rowT[r]) ok = false;
      if (ok && r === size - 1 && colSum[c] !== colT[c]) ok = false;
      if (ok) rec(i + 1);
      rowSum[r] -= rw;
      colSum[c] -= cw;
      if (count >= limit) return;
    }
  };
  rec(0);
  return count;
}

export function generate(seed: number, size = 5): Puzzle {
  let rng: Rng = makeRng(seed);
  for (let attempt = 0; attempt < 200; attempt++) {
    const solution = Array.from({ length: size * size }, () => rng.next() < 0.42);
    const rowTargets = rowTargetsOf(solution, size);
    const colTargets = colTargetsOf(solution, size);
    if (countSolutions(size, rowTargets, colTargets, 2) === 1) {
      return { size, solution, rowTargets, colTargets };
    }
  }
  // extremely unlikely fallback: the all-empty board (all targets 0) is unique
  const solution = new Array(size * size).fill(false);
  return { size, solution, rowTargets: new Array(size).fill(0), colTargets: new Array(size).fill(0) };
}

export function conflicts(shaded: boolean[], size: number, rowT: number[], colT: number[]): boolean[] {
  const bad = new Array(size * size).fill(false);
  const rs = rowTargetsOf(shaded, size);
  const cs = colTargetsOf(shaded, size);
  for (let r = 0; r < size; r++) if (rs[r] > rowT[r]) for (let c = 0; c < size; c++) if (shaded[r * size + c]) bad[r * size + c] = true;
  for (let c = 0; c < size; c++) if (cs[c] > colT[c]) for (let r = 0; r < size; r++) if (shaded[r * size + c]) bad[r * size + c] = true;
  return bad;
}

export function isSolved(shaded: boolean[], size: number, rowT: number[], colT: number[]): boolean {
  const rs = rowTargetsOf(shaded, size);
  const cs = colTargetsOf(shaded, size);
  return rs.every((v, i) => v === rowT[i]) && cs.every((v, i) => v === colT[i]);
}
