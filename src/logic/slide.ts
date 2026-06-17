import { makeRng } from "../cards/core/rng.ts";

// The 15-puzzle (sliding tiles). Tiles are 1..n²-1 with 0 = blank; the goal is the
// ordered arrangement. Scrambling by random legal slides guarantees the puzzle is
// always solvable.

export interface SlideState {
  size: number;
  tiles: number[]; // length size², 0 = blank
  blank: number; // index of the blank
  moves: number;
}

export function solvedTiles(size: number): number[] {
  return [...Array(size * size - 1).keys()].map((i) => i + 1).concat(0);
}

export function neighbors(blank: number, size: number): number[] {
  const r = Math.floor(blank / size);
  const c = blank % size;
  const out: number[] = [];
  if (r > 0) out.push(blank - size);
  if (r < size - 1) out.push(blank + size);
  if (c > 0) out.push(blank - 1);
  if (c < size - 1) out.push(blank + 1);
  return out;
}

export function isSolved(s: SlideState): boolean {
  const goal = solvedTiles(s.size);
  return s.tiles.every((v, i) => v === goal[i]);
}

/** Slide the tile at `i` into the blank, if they're adjacent. */
export function slide(s: SlideState, i: number): SlideState {
  if (!neighbors(s.blank, s.size).includes(i)) return s;
  const tiles = s.tiles.slice();
  tiles[s.blank] = tiles[i];
  tiles[i] = 0;
  return { ...s, tiles, blank: i, moves: s.moves + 1 };
}

export function initSlide(seed: number, size = 4, scramble = 120): SlideState {
  const rng = makeRng(seed);
  let s: SlideState = { size, tiles: solvedTiles(size), blank: size * size - 1, moves: 0 };
  let prev = -1;
  for (let k = 0; k < scramble; k++) {
    const opts = neighbors(s.blank, size).filter((n) => n !== prev); // avoid immediate undo
    const pick = opts[rng.int(opts.length)];
    prev = s.blank;
    s = slide(s, pick);
  }
  s.moves = 0;
  if (isSolved(s)) s = slide(s, neighbors(s.blank, size)[0]);
  return s;
}

/** Inversion-parity solvability test (used only by the harness to confirm fairness). */
export function isSolvable(tiles: number[], size: number): boolean {
  const seq = tiles.filter((v) => v !== 0);
  let inversions = 0;
  for (let i = 0; i < seq.length; i++)
    for (let j = i + 1; j < seq.length; j++) if (seq[i] > seq[j]) inversions++;
  if (size % 2 === 1) return inversions % 2 === 0;
  const blankRowFromBottom = size - Math.floor(tiles.indexOf(0) / size);
  return (inversions + blankRowFromBottom) % 2 === 1;
}
