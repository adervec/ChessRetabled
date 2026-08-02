import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Binairo / Takuzu. Fill a grid with 0s and 1s so that: no three in a row or
// column are equal, each row and column has an equal count of 0s and 1s, and all
// rows are distinct and all columns are distinct. Generator + uniqueness check
// mirror the Sudoku approach. Empty cells are -1.

export type Grid = number[];

function creates3(g: Grid, size: number, i: number, v: number): boolean {
  const r = Math.floor(i / size);
  const c = i % size;
  const at = (rr: number, cc: number) => (rr < 0 || rr >= size || cc < 0 || cc >= size ? -2 : rr === r && cc === c ? v : g[rr * size + cc]);
  for (let s = -2; s <= 0; s++) {
    if (at(r, c + s) === v && at(r, c + s + 1) === v && at(r, c + s + 2) === v) return true;
    if (at(r + s, c) === v && at(r + s + 1, c) === v && at(r + s + 2, c) === v) return true;
  }
  return false;
}

function countLine(g: Grid, size: number, i: number, v: number, isRow: boolean): number {
  const r = Math.floor(i / size);
  const c = i % size;
  let n = 0;
  for (let k = 0; k < size; k++) {
    const cell = isRow ? g[r * size + k] : g[k * size + c];
    if (cell === v) n++;
  }
  return n;
}

function canPlace(g: Grid, size: number, i: number, v: number): boolean {
  if (creates3(g, size, i, v)) return false;
  const half = size / 2;
  if (countLine(g, size, i, v, true) + 1 > half) return false;
  if (countLine(g, size, i, v, false) + 1 > half) return false;
  return true;
}

function distinct(g: Grid, size: number): boolean {
  const rows = new Set<string>();
  const cols = new Set<string>();
  for (let r = 0; r < size; r++) {
    rows.add(g.slice(r * size, r * size + size).join(""));
  }
  for (let c = 0; c < size; c++) {
    let s = "";
    for (let r = 0; r < size; r++) s += g[r * size + c];
    cols.add(s);
  }
  return rows.size === size && cols.size === size;
}

function fill(g: Grid, size: number, rng: Rng): boolean {
  const i = g.indexOf(-1);
  if (i === -1) return distinct(g, size);
  for (const v of shuffle([0, 1], rng)) {
    if (canPlace(g, size, i, v)) {
      g[i] = v;
      if (fill(g, size, rng)) return true;
      g[i] = -1;
    }
  }
  return false;
}

export function countSolutions(grid: Grid, size: number, limit = 2): number {
  const g = grid.slice();
  let count = 0;
  const rec = (): void => {
    if (count >= limit) return;
    const i = g.indexOf(-1);
    if (i === -1) {
      if (distinct(g, size)) count++;
      return;
    }
    for (let v = 0; v <= 1; v++) {
      if (canPlace(g, size, i, v)) {
        g[i] = v;
        rec();
        g[i] = -1;
        if (count >= limit) return;
      }
    }
  };
  rec();
  return count;
}

export function solve(grid: Grid, size: number): Grid | null {
  const g = grid.slice();
  const rec = (): boolean => {
    const i = g.indexOf(-1);
    if (i === -1) return distinct(g, size);
    for (let v = 0; v <= 1; v++) {
      if (canPlace(g, size, i, v)) {
        g[i] = v;
        if (rec()) return true;
        g[i] = -1;
      }
    }
    return false;
  };
  return rec() ? g : null;
}

export function isValid(grid: Grid, size: number): boolean {
  if (grid.some((v) => v !== 0 && v !== 1)) return false;
  if (!distinct(grid, size)) return false;
  return conflicts(grid, size).every((b) => !b);
}

export interface Puzzle {
  size: number;
  puzzle: Grid;
  solution: Grid;
  givens: boolean[];
}

export function generate(seed: number, size = 6, difficulty: "easy" | "medium" | "hard" = "medium"): Puzzle {
  const rng = makeRng(seed);
  const solution = new Array(size * size).fill(-1);
  fill(solution, size, rng);

  const puzzle = solution.slice();
  const keepFrac = difficulty === "easy" ? 0.62 : difficulty === "medium" ? 0.5 : 0.42;
  const target = size * size - Math.round(size * size * keepFrac); // holes to make
  let holes = 0;
  for (const i of shuffle([...Array(size * size).keys()], rng)) {
    if (holes >= target) break;
    const saved = puzzle[i];
    puzzle[i] = -1;
    if (countSolutions(puzzle, size, 2) !== 1) puzzle[i] = saved;
    else holes++;
  }
  return { size, puzzle, solution, givens: puzzle.map((v) => v !== -1) };
}

export function conflicts(g: Grid, size: number): boolean[] {
  const bad = new Array(size * size).fill(false);
  for (let i = 0; i < g.length; i++) {
    if (g[i] === -1) continue;
    const v = g[i];
    const g2 = g.slice();
    g2[i] = -1;
    if (!canPlace(g2, size, i, v)) bad[i] = true;
  }
  return bad;
}
