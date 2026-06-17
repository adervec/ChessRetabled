// Shared helpers for rectangular-grid games (cell index = row * cols + col,
// with row 0 at the TOP of the rendered board).
import type { Player } from "./types.ts";

export function idx(col: number, row: number, cols: number): number {
  return row * cols + col;
}
export function colOf(i: number, cols: number): number {
  return i % cols;
}
export function rowOf(i: number, cols: number): number {
  return Math.floor(i / cols);
}

/** The four line directions (right, down, down-right, down-left). */
export const DIRS: ReadonlyArray<[number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [-1, 1],
];

/**
 * Does `player` have a run of at least `k` along any direction through the grid?
 * `at(col,row)` returns the owner of a cell or null.
 */
export function hasKInARow(
  cols: number,
  rows: number,
  k: number,
  player: Player,
  at: (col: number, row: number) => Player | null
): boolean {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (at(c, r) !== player) continue;
      for (const [dc, dr] of DIRS) {
        let n = 1;
        let cc = c + dc;
        let rr = r + dr;
        while (cc >= 0 && cc < cols && rr >= 0 && rr < rows && at(cc, rr) === player) {
          n++;
          if (n >= k) return true;
          cc += dc;
          rr += dr;
        }
      }
    }
  }
  return false;
}

/** Length of the longest run for `player` (used in heuristics). */
export function longestRun(
  cols: number,
  rows: number,
  player: Player,
  at: (col: number, row: number) => Player | null
): number {
  let best = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (at(c, r) !== player) continue;
      for (const [dc, dr] of DIRS) {
        // only start a run at its beginning to avoid recounting
        const pc = c - dc;
        const pr = r - dr;
        if (pc >= 0 && pc < cols && pr >= 0 && pr < rows && at(pc, pr) === player)
          continue;
        let n = 1;
        let cc = c + dc;
        let rr = r + dr;
        while (cc >= 0 && cc < cols && rr >= 0 && rr < rows && at(cc, rr) === player) {
          n++;
          cc += dc;
          rr += dr;
        }
        if (n > best) best = n;
      }
    }
  }
  return best;
}
