import { makeRng } from "../cards/core/rng.ts";

// Hitori. Shade cells so that: no number repeats among the UNSHADED cells of any
// row or column, no two shaded cells are orthogonally adjacent, and the unshaded
// cells stay connected. Generated from a Latin base with a known valid shading
// baked in; you win with any shading that satisfies the three rules.

export interface Puzzle {
  size: number;
  board: number[];
  solution: boolean[]; // a known-valid shading (true = shaded)
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

function connectedUnshaded(shaded: boolean[], size: number): boolean {
  const total = shaded.filter((s) => !s).length;
  const start = shaded.indexOf(false);
  if (start === -1) return false;
  const seen = new Set<number>([start]);
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    for (const n of neighbors(i, size)) {
      if (!shaded[n] && !seen.has(n)) { seen.add(n); stack.push(n); }
    }
  }
  return seen.size === total;
}

function noAdjacentShaded(shaded: boolean[], size: number): boolean {
  for (let i = 0; i < shaded.length; i++) {
    if (!shaded[i]) continue;
    for (const n of neighbors(i, size)) if (shaded[n]) return false;
  }
  return true;
}

function rowsColsDistinct(board: number[], shaded: boolean[], size: number): boolean {
  for (let r = 0; r < size; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      if (shaded[i]) continue;
      if (seen.has(board[i])) return false;
      seen.add(board[i]);
    }
  }
  for (let c = 0; c < size; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < size; r++) {
      const i = r * size + c;
      if (shaded[i]) continue;
      if (seen.has(board[i])) return false;
      seen.add(board[i]);
    }
  }
  return true;
}

export function isSolved(board: number[], shaded: boolean[], size: number): boolean {
  return noAdjacentShaded(shaded, size) && rowsColsDistinct(board, shaded, size) && connectedUnshaded(shaded, size);
}

export function generate(seed: number, size = 6): Puzzle {
  const rng = makeRng(seed);
  // cyclic Latin square base — distinct per row & column
  const board = new Array(size * size);
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) board[r * size + c] = ((c + r) % size) + 1;

  // shade a random subset of even-parity cells (never orthogonally adjacent)
  const shaded = new Array(size * size).fill(false);
  for (let i = 0; i < size * size; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    if ((r + c) % 2 === 0 && rng.next() < 0.4) shaded[i] = true;
  }
  // keep the unshaded region connected
  while (!connectedUnshaded(shaded, size)) {
    const idx = shaded.indexOf(true);
    if (idx === -1) break;
    shaded[idx] = false;
  }
  // ensure at least one shaded cell
  if (!shaded.some(Boolean)) {
    for (let i = 0; i < size * size; i++) {
      const r = Math.floor(i / size);
      const c = i % size;
      if ((r + c) % 2 === 0 && r > 0 && r < size - 1 && c > 0 && c < size - 1) { shaded[i] = true; break; }
    }
  }
  // make each shaded cell a forced duplicate of another cell in its row
  for (let i = 0; i < size * size; i++) {
    if (!shaded[i]) continue;
    const r = Math.floor(i / size);
    const c = i % size;
    const j = r * size + ((c + 1) % size); // another cell in the same row
    board[i] = board[j];
  }
  return { size, board, solution: shaded };
}

export function conflicts(board: number[], shaded: boolean[], size: number): boolean[] {
  const bad = new Array(size * size).fill(false);
  // adjacent shaded
  for (let i = 0; i < shaded.length; i++) {
    if (!shaded[i]) continue;
    for (const n of neighbors(i, size)) if (shaded[n]) { bad[i] = true; bad[n] = true; }
  }
  // duplicate unshaded in a row/col
  const mark = (line: number[]) => {
    const byVal = new Map<number, number[]>();
    for (const i of line) {
      if (shaded[i]) continue;
      const a = byVal.get(board[i]) ?? [];
      a.push(i);
      byVal.set(board[i], a);
    }
    for (const a of byVal.values()) if (a.length > 1) for (const i of a) bad[i] = true;
  };
  for (let r = 0; r < size; r++) mark([...Array(size).keys()].map((c) => r * size + c));
  for (let c = 0; c < size; c++) mark([...Array(size).keys()].map((r) => r * size + c));
  return bad;
}
