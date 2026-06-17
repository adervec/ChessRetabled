import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Sudoku generator + solver. A grid is number[81] (0 = empty). generate() makes a
// full solution by randomized backtracking, then removes clues while a uniqueness
// check keeps exactly one solution — so every generated puzzle is fair and solvable.

export type Grid = number[]; // length 81

export function rc(i: number): { r: number; c: number } {
  return { r: Math.floor(i / 9), c: i % 9 };
}

function canPlace(g: Grid, i: number, n: number): boolean {
  const r = Math.floor(i / 9);
  const c = i % 9;
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === n) return false; // row
    if (g[k * 9 + c] === n) return false; // col
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      if (g[(br + dr) * 9 + (bc + dc)] === n) return false; // box
    }
  }
  return true;
}

function fill(g: Grid, rng: Rng): boolean {
  const i = g.indexOf(0);
  if (i === -1) return true;
  for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)) {
    if (canPlace(g, i, n)) {
      g[i] = n;
      if (fill(g, rng)) return true;
      g[i] = 0;
    }
  }
  return false;
}

/** Count solutions up to `limit` (2 is enough to test uniqueness). */
export function countSolutions(grid: Grid, limit = 2): number {
  const g = grid.slice();
  let count = 0;
  const recurse = (): void => {
    if (count >= limit) return;
    const i = g.indexOf(0);
    if (i === -1) {
      count++;
      return;
    }
    for (let n = 1; n <= 9; n++) {
      if (canPlace(g, i, n)) {
        g[i] = n;
        recurse();
        g[i] = 0;
        if (count >= limit) return;
      }
    }
  };
  recurse();
  return count;
}

export function solve(grid: Grid): Grid | null {
  const g = grid.slice();
  const recurse = (): boolean => {
    const i = g.indexOf(0);
    if (i === -1) return true;
    for (let n = 1; n <= 9; n++) {
      if (canPlace(g, i, n)) {
        g[i] = n;
        if (recurse()) return true;
        g[i] = 0;
      }
    }
    return false;
  };
  return recurse() ? g : null;
}

export function isValidComplete(g: Grid): boolean {
  if (g.some((v) => v < 1 || v > 9)) return false;
  for (let i = 0; i < 81; i++) {
    const n = g[i];
    g[i] = 0;
    const ok = canPlace(g, i, n);
    g[i] = n;
    if (!ok) return false;
  }
  return true;
}

export interface Puzzle {
  puzzle: Grid;
  solution: Grid;
  givens: boolean[];
}

const HOLES: Record<string, number> = { easy: 40, medium: 48, hard: 54 };

export function generate(seed: number, difficulty: "easy" | "medium" | "hard" = "medium"): Puzzle {
  const rng = makeRng(seed);
  const solution = new Array(81).fill(0);
  fill(solution, rng);

  const puzzle = solution.slice();
  const target = HOLES[difficulty] ?? 48;
  let holes = 0;
  for (const i of shuffle([...Array(81).keys()], rng)) {
    if (holes >= target) break;
    const saved = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, 2) !== 1) puzzle[i] = saved;
    else holes++;
  }
  return { puzzle, solution, givens: puzzle.map((v) => v !== 0) };
}

/** Cells that clash with another filled cell in the same row/col/box. */
export function conflicts(g: Grid): boolean[] {
  const bad = new Array(81).fill(false);
  for (let i = 0; i < 81; i++) {
    if (g[i] === 0) continue;
    const n = g[i];
    g[i] = 0;
    if (!canPlace(g, i, n)) bad[i] = true;
    g[i] = n;
  }
  return bad;
}
