import { makeRng, shuffle } from "../cards/core/rng.ts";

// Tents (Tents and Trees). Put a tent in some empty cells so that: tents equal
// trees and pair up one-to-one with an orthogonally adjacent tree; no two tents
// touch, even diagonally; and each row/column holds the clued number of tents.
// Generation places non-touching tents, gives each its own adjacent tree, and
// reads the clues; the solver assigns tents with row/column + adjacency pruning
// and confirms a perfect tent↔tree matching, unique.

export interface Puzzle {
  size: number;
  tree: boolean[]; // given trees
  rowClue: number[];
  colClue: number[];
  solution: boolean[]; // tents
}

function ortho(i: number, size: number): number[] {
  const r = Math.floor(i / size), c = i % size, out: number[] = [];
  if (r > 0) out.push(i - size);
  if (r < size - 1) out.push(i + size);
  if (c > 0) out.push(i - 1);
  if (c < size - 1) out.push(i + 1);
  return out;
}
function around8(i: number, size: number): number[] {
  const r = Math.floor(i / size), c = i % size, out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) out.push(nr * size + nc);
  }
  return out;
}

/** Perfect matching between tents and trees (each pair orthogonally adjacent). */
function perfectMatch(tents: number[], tree: boolean[], size: number): boolean {
  const matchTree = new Map<number, number>(); // tree cell -> tent index
  const tryAssign = (t: number, seen: Set<number>): boolean => {
    for (const nb of ortho(tents[t], size)) {
      if (!tree[nb] || seen.has(nb)) continue;
      seen.add(nb);
      if (!matchTree.has(nb) || tryAssign(matchTree.get(nb)!, seen)) { matchTree.set(nb, t); return true; }
    }
    return false;
  };
  for (let t = 0; t < tents.length; t++) if (!tryAssign(t, new Set())) return false;
  return true;
}

export function countSolutions(tree: boolean[], size: number, rowClue: number[], colClue: number[], limit = 2): number {
  const n = size * size;
  const tent = new Array<boolean>(n).fill(false);
  const rowC = new Array<number>(size).fill(0);
  const colC = new Array<number>(size).fill(0);
  // empties remaining at or after each cell within its column (for feasibility)
  const emptyBelow = new Array<number>(n).fill(0);
  for (let c = 0; c < size; c++) {
    let acc = 0;
    for (let r = size - 1; r >= 0; r--) { const i = r * size + c; if (!tree[i]) acc++; emptyBelow[i] = acc; }
  }
  let count = 0, steps = 0, capped = false;

  const rec = (i: number): void => {
    if (count >= limit || capped) return;
    if (++steps > 600000) { capped = true; return; }
    if (i === n) {
      const tents: number[] = [];
      for (let k = 0; k < n; k++) if (tent[k]) tents.push(k);
      if (perfectMatch(tents, tree, size)) count++;
      return;
    }
    const r = Math.floor(i / size), c = i % size;
    const atRowEnd = c === size - 1;
    const canPlace = !tree[i] && rowC[r] < rowClue[r] && colC[c] < colClue[c] &&
      ortho(i, size).some((nb) => tree[nb]) && // must touch a tree
      around8(i, size).every((nb) => !tent[nb]); // no two tents adjacent
    // Branch 1: place a tent here
    if (canPlace) {
      tent[i] = true; rowC[r]++; colC[c]++;
      if (colC[c] + emptyBelow[i] - 1 >= colClue[c] && (!atRowEnd || rowC[r] === rowClue[r])) rec(i + 1);
      tent[i] = false; rowC[r]--; colC[c]--;
      if (count >= limit || capped) return;
    }
    // Branch 2: leave it empty — only if the row and column can still reach their clues
    const colOk = colC[c] + emptyBelow[i] - (tree[i] ? 0 : 1) >= colClue[c];
    const rowOk = !atRowEnd || rowC[r] === rowClue[r];
    if (colOk && rowOk) rec(i + 1);
  };
  rec(0);
  return capped ? limit : count;
}

export function generate(seed: number, size = 7): Puzzle {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 300; attempt++) {
    const tree = new Array<boolean>(size * size).fill(false);
    const tent = new Array<boolean>(size * size).fill(false);
    const claimedTree = new Array<boolean>(size * size).fill(false);
    for (const cell of shuffle([...Array(size * size).keys()], rng)) {
      if (tree[cell] || tent[cell]) continue;
      if (around8(cell, size).some((nb) => tent[nb])) continue; // tents can't touch
      // pick an adjacent free cell to be this tent's tree
      const treeSpots = ortho(cell, size).filter((nb) => !tree[nb] && !tent[nb] && !claimedTree[nb]);
      if (treeSpots.length === 0) continue;
      tent[cell] = true;
      const tcell = treeSpots[rng.int(treeSpots.length)];
      tree[tcell] = true; claimedTree[tcell] = true;
    }
    const tents = tent.reduce((a, v) => a + (v ? 1 : 0), 0);
    if (tents < Math.max(4, size)) continue;
    const rowClue = new Array<number>(size).fill(0);
    const colClue = new Array<number>(size).fill(0);
    tent.forEach((v, i) => { if (v) { rowClue[Math.floor(i / size)]++; colClue[i % size]++; } });
    if (countSolutions(tree, size, rowClue, colClue, 2) !== 1) continue;
    return { size, tree, rowClue, colClue, solution: tent };
  }
  // Fallback: one tree + one tent in a corner.
  const tree = new Array<boolean>(size * size).fill(false);
  const sol = new Array<boolean>(size * size).fill(false);
  tree[1] = true; sol[0] = true;
  const rowClue = new Array<number>(size).fill(0); const colClue = new Array<number>(size).fill(0);
  rowClue[0] = 1; colClue[0] = 1;
  return { size, tree, rowClue, colClue, solution: sol };
}

export function counts(tent: boolean[], size: number): { row: number[]; col: number[] } {
  const row = new Array<number>(size).fill(0);
  const col = new Array<number>(size).fill(0);
  tent.forEach((v, i) => { if (v) { row[Math.floor(i / size)]++; col[i % size]++; } });
  return { row, col };
}

export function isSolved(tent: boolean[], tree: boolean[], size: number, rowClue: number[], colClue: number[]): boolean {
  const tents: number[] = [];
  for (let i = 0; i < size * size; i++) {
    if (tent[i] && tree[i]) return false; // tent on a tree
    if (tent[i]) tents.push(i);
  }
  if (tents.length !== tree.reduce((a, v) => a + (v ? 1 : 0), 0)) return false;
  for (const t of tents) if (around8(t, size).some((nb) => tent[nb])) return false; // touching tents
  const { row, col } = counts(tent, size);
  if (!row.every((v, i) => v === rowClue[i]) || !col.every((v, i) => v === colClue[i])) return false;
  return perfectMatch(tents, tree, size);
}
