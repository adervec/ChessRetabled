import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Star Battle (1★). Place one star in every row, every column, and every region,
// with no two stars touching (even diagonally). Generated from a non-adjacent
// permutation of stars, with regions grown around them so a solution always
// exists; thinned to a unique answer by retrying layouts.

export interface Puzzle {
  size: number;
  regionId: number[];
  solution: boolean[]; // star mask
}

function neighbors4(i: number, size: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const out: number[] = [];
  if (r > 0) out.push(i - size);
  if (r < size - 1) out.push(i + size);
  if (c > 0) out.push(i - 1);
  if (c < size - 1) out.push(i + 1);
  return out;
}

function genPerm(n: number, rng: Rng): number[] | null {
  const perm = new Array(n).fill(-1);
  const usedCol = new Array(n).fill(false);
  const rec = (r: number): boolean => {
    if (r === n) return true;
    for (const c of shuffle([...Array(n).keys()], rng)) {
      if (usedCol[c]) continue;
      if (r > 0 && Math.abs(c - perm[r - 1]) <= 1) continue; // non-adjacent to the star above
      perm[r] = c;
      usedCol[c] = true;
      if (rec(r + 1)) return true;
      usedCol[c] = false;
      perm[r] = -1;
    }
    return false;
  };
  return rec(0) ? perm : null;
}

function partitionFromStars(n: number, stars: number[], rng: Rng): number[] {
  const region = new Array(n * n).fill(-1);
  stars.forEach((cell, id) => { region[cell] = id; });
  let remaining = n * n - stars.length;
  while (remaining > 0) {
    // every (unassigned cell, adjacent region) pairing — pick one at random so
    // regions grow into irregular shapes (which tend to pin a unique solution)
    const options: [number, number][] = [];
    for (let i = 0; i < n * n; i++) {
      if (region[i] !== -1) continue;
      for (const nb of neighbors4(i, n)) if (region[nb] !== -1) options.push([i, region[nb]]);
    }
    if (options.length === 0) break;
    const [cell, id] = options[rng.int(options.length)];
    region[cell] = id;
    remaining--;
  }
  return region;
}

export function countSolutions(regionId: number[], n: number, limit = 2): number {
  const usedCol = new Array(n).fill(false);
  const usedReg = new Array(n).fill(false);
  const starCol = new Array(n).fill(-1);
  let count = 0;
  const rec = (r: number): void => {
    if (count >= limit) return;
    if (r === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (usedCol[c]) continue;
      const reg = regionId[r * n + c];
      if (usedReg[reg]) continue;
      if (r > 0 && starCol[r - 1] >= 0 && Math.abs(c - starCol[r - 1]) <= 1) continue;
      usedCol[c] = true; usedReg[reg] = true; starCol[r] = c;
      rec(r + 1);
      usedCol[c] = false; usedReg[reg] = false; starCol[r] = -1;
      if (count >= limit) return;
    }
  };
  rec(0);
  return count;
}

export function solve(regionId: number[], n: number): boolean[] | null {
  const usedCol = new Array(n).fill(false);
  const usedReg = new Array(n).fill(false);
  const starCol = new Array(n).fill(-1);
  const rec = (r: number): boolean => {
    if (r === n) return true;
    for (let c = 0; c < n; c++) {
      if (usedCol[c]) continue;
      const reg = regionId[r * n + c];
      if (usedReg[reg]) continue;
      if (r > 0 && starCol[r - 1] >= 0 && Math.abs(c - starCol[r - 1]) <= 1) continue;
      usedCol[c] = true; usedReg[reg] = true; starCol[r] = c;
      if (rec(r + 1)) return true;
      usedCol[c] = false; usedReg[reg] = false; starCol[r] = -1;
    }
    return false;
  };
  if (!rec(0)) return null;
  const mask = new Array(n * n).fill(false);
  for (let r = 0; r < n; r++) mask[r * n + starCol[r]] = true;
  return mask;
}

export function generate(seed: number, size = 6): Puzzle {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 1500; attempt++) {
    const perm = genPerm(size, rng);
    if (!perm) continue;
    const stars = perm.map((c, r) => r * size + c);
    const regionId = partitionFromStars(size, stars, rng);
    if (countSolutions(regionId, size, 2) === 1) {
      const solution = new Array(size * size).fill(false);
      for (const cell of stars) solution[cell] = true;
      return { size, regionId, solution };
    }
  }
  // fallback (should never hit): last valid perm + partition, even if not unique
  const perm = genPerm(size, rng) ?? [...Array(size).keys()];
  const stars = perm.map((c, r) => r * size + c);
  const regionId = partitionFromStars(size, stars, rng);
  const solution = new Array(size * size).fill(false);
  for (const cell of stars) solution[cell] = true;
  return { size, regionId, solution };
}

export function conflicts(stars: boolean[], n: number): boolean[] {
  const bad = new Array(n * n).fill(false);
  const rowC = new Array(n).fill(0);
  const colC = new Array(n).fill(0);
  for (let i = 0; i < stars.length; i++) if (stars[i]) { rowC[Math.floor(i / n)]++; colC[i % n]++; }
  for (let i = 0; i < stars.length; i++) {
    if (!stars[i]) continue;
    const r = Math.floor(i / n), c = i % n;
    if (rowC[r] > 1 || colC[c] > 1) bad[i] = true;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n && stars[rr * n + cc]) bad[i] = true;
    }
  }
  return bad;
}

export function isSolved(stars: boolean[], regionId: number[], n: number): boolean {
  const rowC = new Array(n).fill(0);
  const colC = new Array(n).fill(0);
  const regC = new Array(n).fill(0);
  for (let i = 0; i < stars.length; i++) if (stars[i]) { rowC[Math.floor(i / n)]++; colC[i % n]++; regC[regionId[i]]++; }
  if (rowC.some((v) => v !== 1) || colC.some((v) => v !== 1) || regC.some((v) => v !== 1)) return false;
  return conflicts(stars, n).every((b) => !b);
}
