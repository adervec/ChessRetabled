import { makeRng } from "../cards/core/rng.ts";

// Nonogram / Picross. A puzzle is a random picture turned into row/column run
// clues. You win by filling a grid that satisfies every clue (any clue-satisfying
// fill counts), so no uniqueness solver is needed — just a fast clue checker.

export interface NonoPuzzle {
  size: number;
  rows: number[][]; // run-length clues per row
  cols: number[][];
  solution: number[]; // the generating picture (1 filled, 0 empty), length size*size
}

/** Run lengths of filled cells in a line; an empty line is [0]. */
export function lineClues(line: number[]): number[] {
  const runs: number[] = [];
  let n = 0;
  for (const v of line) {
    if (v === 1) n++;
    else if (n > 0) { runs.push(n); n = 0; }
  }
  if (n > 0) runs.push(n);
  return runs.length ? runs : [0];
}

function row(grid: number[], size: number, r: number): number[] {
  return grid.slice(r * size, r * size + size);
}
function col(grid: number[], size: number, c: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < size; r++) out.push(grid[r * size + c]);
  return out;
}

export function generate(seed: number, size = 10): NonoPuzzle {
  const rng = makeRng(seed);
  const solution = Array.from({ length: size * size }, () => (rng.next() < 0.55 ? 1 : 0));
  const rows: number[][] = [];
  const cols: number[][] = [];
  for (let i = 0; i < size; i++) rows.push(lineClues(row(solution, size, i)));
  for (let i = 0; i < size; i++) cols.push(lineClues(col(solution, size, i)));
  return { size, rows, cols, solution };
}

function eqClue(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Does `grid` (1 = filled) satisfy every row and column clue? */
export function satisfies(grid: number[], p: NonoPuzzle): boolean {
  const bin = grid.map((v) => (v === 1 ? 1 : 0));
  for (let i = 0; i < p.size; i++) {
    if (!eqClue(lineClues(row(bin, p.size, i)), p.rows[i])) return false;
    if (!eqClue(lineClues(col(bin, p.size, i)), p.cols[i])) return false;
  }
  return true;
}
