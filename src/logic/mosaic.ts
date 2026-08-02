import { makeRng } from "../cards/core/rng.ts";

// Mosaic / Fill-a-Pix. Every cell carries a clue = how many cells in its 3×3
// neighbourhood (itself included) are shaded. Shade the grid to satisfy all clues.
// Generator re-rolls a random picture until its full clue set is uniquely solvable.

export interface Puzzle {
  size: number;
  clues: number[];
  solution: boolean[];
}

function neighborhood(i: number, size: number): number[] {
  const r = Math.floor(i / size), c = i % size;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < size && cc >= 0 && cc < size) out.push(rr * size + cc);
    }
  return out;
}

export function cluesOf(shaded: boolean[], size: number): number[] {
  return shaded.map((_, i) => neighborhood(i, size).reduce((n, j) => n + (shaded[j] ? 1 : 0), 0));
}

export function countSolutions(clues: number[], size: number, limit = 2): number {
  const cells = size * size;
  const nb = Array.from({ length: cells }, (_, i) => neighborhood(i, size));
  const cnt = new Array(cells).fill(0);
  const und = nb.map((a) => a.length);
  let count = 0;
  let steps = 0;
  let capped = false;
  const rec = (i: number): void => {
    if (count >= limit || capped) return;
    if (++steps > 400000) { capped = true; return; }
    if (i === cells) { count++; return; }
    for (let s = 0; s <= 1; s++) {
      let ok = true;
      for (const c of nb[i]) { und[c]--; if (s) cnt[c]++; }
      for (const c of nb[i]) if (cnt[c] > clues[c] || clues[c] > cnt[c] + und[c]) { ok = false; break; }
      if (ok) rec(i + 1);
      for (const c of nb[i]) { und[c]++; if (s) cnt[c]--; }
      if (count >= limit || capped) return;
    }
  };
  rec(0);
  return capped ? limit : count;
}

export function generate(seed: number, size = 7): Puzzle {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 200; attempt++) {
    const solution = Array.from({ length: size * size }, () => rng.next() < 0.5);
    const clues = cluesOf(solution, size);
    if (countSolutions(clues, size, 2) === 1) return { size, clues, solution };
  }
  const solution = new Array(size * size).fill(false);
  return { size, clues: cluesOf(solution, size), solution };
}

export function conflicts(shaded: boolean[], clues: number[], size: number): boolean[] {
  // a clue cell is wrong only if it's over-shaded (count exceeds its clue)
  return clues.map((clue, i) => neighborhood(i, size).reduce((n, j) => n + (shaded[j] ? 1 : 0), 0) > clue);
}

export function isSolved(shaded: boolean[], clues: number[], size: number): boolean {
  return cluesOf(shaded, size).every((v, i) => v === clues[i]);
}
