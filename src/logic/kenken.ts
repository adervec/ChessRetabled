import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// KenKen / Calcudoku. An n×n Latin square partitioned into "cages"; each cage has
// a target and an arithmetic operation its cells must produce. No givens — the
// cages alone pin a unique solution. Generator + uniqueness mirror Sudoku.

export type Op = "=" | "+" | "-" | "×" | "÷";
export type Grid = number[];
export interface Cage { cells: number[]; op: Op; target: number; }
export interface Puzzle {
  size: number;
  solution: Grid;
  cages: Cage[];
  cellCage: number[]; // cage index per cell
}

function neighbors(i: number, size: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const out: number[] = [];
  if (r > 0) out.push(i - size);
  if (r < size - 1) out.push(i + size);
  if (c > 0) out.push(i - 1);
  if (c < size - 1) out.push(i + 1);
  return out;
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

/** Validate a cage against the grid (0 = unfilled). Prunes partial + and ×. */
function cageOk(cage: Cage, g: Grid): boolean {
  const vals = cage.cells.map((c) => g[c]);
  const filled = vals.filter((v) => v !== 0);
  const complete = filled.length === cage.cells.length;
  switch (cage.op) {
    case "=":
      return !complete || filled[0] === cage.target;
    case "+": {
      const sum = filled.reduce((a, b) => a + b, 0);
      if (sum > cage.target) return false;
      return !complete || sum === cage.target;
    }
    case "×": {
      const prod = filled.reduce((a, b) => a * b, 1);
      if (prod > cage.target) return false;
      return !complete || prod === cage.target;
    }
    case "-":
      return !complete || Math.abs(filled[0] - filled[1]) === cage.target;
    case "÷": {
      if (!complete) return true;
      const [a, b] = filled;
      const hi = Math.max(a, b);
      const lo = Math.min(a, b);
      return hi % lo === 0 && hi / lo === cage.target;
    }
  }
}

function canPlace(g: Grid, size: number, i: number, v: number, p: { cages: Cage[]; cellCage: number[] }): boolean {
  if (inRowOrCol(g, size, i, v)) return false;
  g[i] = v;
  const ok = cageOk(p.cages[p.cellCage[i]], g);
  g[i] = 0;
  return ok;
}

export function countSolutions(p: Puzzle, limit = 2): number {
  const g = new Array(p.size * p.size).fill(0);
  let count = 0;
  const rec = (): void => {
    if (count >= limit) return;
    const i = g.indexOf(0);
    if (i === -1) { count++; return; }
    for (let v = 1; v <= p.size; v++) {
      if (canPlace(g, p.size, i, v, p)) {
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

export function solve(p: Puzzle): Grid | null {
  const g = new Array(p.size * p.size).fill(0);
  const rec = (): boolean => {
    const i = g.indexOf(0);
    if (i === -1) return true;
    for (let v = 1; v <= p.size; v++) {
      if (canPlace(g, p.size, i, v, p)) {
        g[i] = v;
        if (rec()) return true;
        g[i] = 0;
      }
    }
    return false;
  };
  return rec() ? g : null;
}

function buildCages(cellCage: number[], solution: Grid, rng: Rng): Cage[] {
  const groups = new Map<number, number[]>();
  cellCage.forEach((id, i) => { const a = groups.get(id) ?? []; a.push(i); groups.set(id, a); });
  const cages: Cage[] = [];
  for (const cells of groups.values()) {
    const vals = cells.map((c) => solution[c]);
    if (cells.length === 1) { cages.push({ cells, op: "=", target: vals[0] }); continue; }
    if (cells.length === 2) {
      const [a, b] = vals;
      const hi = Math.max(a, b);
      const lo = Math.min(a, b);
      const ops: Op[] = ["+", "-", "×"];
      if (hi % lo === 0) ops.push("÷");
      const op = ops[rng.int(ops.length)];
      const target = op === "+" ? a + b : op === "-" ? hi - lo : op === "×" ? a * b : hi / lo;
      cages.push({ cells, op, target });
      continue;
    }
    const op: Op = rng.int(2) === 0 ? "+" : "×";
    const target = op === "+" ? vals.reduce((x, y) => x + y, 0) : vals.reduce((x, y) => x * y, 1);
    cages.push({ cells, op, target });
  }
  return cages;
}

function partition(size: number, rng: Rng, maxCage: number): number[] {
  const cage = new Array(size * size).fill(-1);
  let id = 0;
  for (const start of shuffle([...Array(size * size).keys()], rng)) {
    if (cage[start] !== -1) continue;
    cage[start] = id;
    const members = [start];
    const want = 1 + rng.int(maxCage);
    while (members.length < want) {
      const frontier: number[] = [];
      for (const m of members) for (const nb of neighbors(m, size)) if (cage[nb] === -1) frontier.push(nb);
      if (frontier.length === 0) break;
      const pick = frontier[rng.int(frontier.length)];
      cage[pick] = id;
      members.push(pick);
    }
    id++;
  }
  return cage;
}

export function generate(seed: number, size = 5): Puzzle {
  const rng = makeRng(seed);
  const solution = new Array(size * size).fill(0);
  fillLatin(solution, size, rng);

  for (let attempt = 0; attempt < 60; attempt++) {
    const cellCage = partition(size, rng, attempt < 50 ? 4 : 1);
    const cages = buildCages(cellCage, solution, rng);
    const p: Puzzle = { size, solution, cages, cellCage };
    if (countSolutions(p, 2) === 1) return p;
  }
  // guaranteed-unique fallback: every cell its own "=" cage
  const cellCage = [...Array(size * size).keys()];
  const cages = cellCage.map((i) => ({ cells: [i], op: "=" as Op, target: solution[i] }));
  return { size, solution, cages, cellCage };
}

export function conflicts(g: Grid, p: Puzzle): boolean[] {
  const bad = new Array(p.size * p.size).fill(false);
  for (let i = 0; i < g.length; i++) {
    if (g[i] !== 0 && inRowOrCol(g, p.size, i, g[i])) bad[i] = true;
  }
  for (const cage of p.cages) {
    if (cage.cells.every((c) => g[c] !== 0) && !cageOk(cage, g)) {
      for (const c of cage.cells) bad[c] = true;
    }
  }
  return bad;
}

export function isSolved(g: Grid, p: Puzzle): boolean {
  if (g.some((v) => v === 0)) return false;
  return conflicts(g, p).every((b) => !b);
}
