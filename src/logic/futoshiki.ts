import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Futoshiki. An n×n Latin square (each row/column holds 1..n once) plus "greater
// than" constraints between adjacent cells. Generator + uniqueness check follow
// the Sudoku pattern. 0 = empty. A constraint {a,b} means solution[a] < solution[b].

export type Grid = number[];
export interface Constraint { a: number; b: number; }
export interface Puzzle {
  size: number;
  puzzle: Grid;
  solution: Grid;
  givens: boolean[];
  constraints: Constraint[];
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

function canPlace(g: Grid, size: number, i: number, v: number, cons: Constraint[]): boolean {
  if (inRowOrCol(g, size, i, v)) return false;
  for (const con of cons) {
    if (con.a === i && g[con.b] !== 0 && !(v < g[con.b])) return false;
    if (con.b === i && g[con.a] !== 0 && !(g[con.a] < v)) return false;
  }
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

export function countSolutions(grid: Grid, size: number, cons: Constraint[], limit = 2): number {
  const g = grid.slice();
  let count = 0;
  const rec = (): void => {
    if (count >= limit) return;
    const i = g.indexOf(0);
    if (i === -1) { count++; return; }
    for (let v = 1; v <= size; v++) {
      if (canPlace(g, size, i, v, cons)) {
        g[i] = v;
        rec();
        g[i] = 0;
        if (count >= limit) return;
      }
    }
  };
  rec();
  return count;
}

export function solve(grid: Grid, size: number, cons: Constraint[]): Grid | null {
  const g = grid.slice();
  const rec = (): boolean => {
    const i = g.indexOf(0);
    if (i === -1) return true;
    for (let v = 1; v <= size; v++) {
      if (canPlace(g, size, i, v, cons)) {
        g[i] = v;
        if (rec()) return true;
        g[i] = 0;
      }
    }
    return false;
  };
  return rec() ? g : null;
}

function adjacentPairs(size: number): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      if (c < size - 1) out.push([i, i + 1]);
      if (r < size - 1) out.push([i, i + size]);
    }
  }
  return out;
}

export function generate(seed: number, size = 5): Puzzle {
  const rng = makeRng(seed);
  const solution = new Array(size * size).fill(0);
  fillLatin(solution, size, rng);

  // pick ~1.5n inequality constraints from adjacent pairs, oriented by the solution
  const pairs = shuffle(adjacentPairs(size), rng);
  const cons: Constraint[] = [];
  const want = Math.round(size * 1.6);
  for (const [x, y] of pairs) {
    if (cons.length >= want) break;
    cons.push(solution[x] < solution[y] ? { a: x, b: y } : { a: y, b: x });
  }

  const puzzle = solution.slice();
  for (const i of shuffle([...Array(size * size).keys()], rng)) {
    const saved = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, size, cons, 2) !== 1) puzzle[i] = saved;
  }
  return { size, puzzle, solution, givens: puzzle.map((v) => v !== 0), constraints: cons };
}

export function conflicts(g: Grid, size: number, cons: Constraint[]): boolean[] {
  const bad = new Array(size * size).fill(false);
  for (let i = 0; i < g.length; i++) {
    if (g[i] === 0) continue;
    if (inRowOrCol(g, size, i, g[i])) bad[i] = true;
  }
  for (const con of cons) {
    if (g[con.a] !== 0 && g[con.b] !== 0 && !(g[con.a] < g[con.b])) {
      bad[con.a] = true;
      bad[con.b] = true;
    }
  }
  return bad;
}

export function isComplete(g: Grid): boolean {
  return g.every((v) => v !== 0);
}
