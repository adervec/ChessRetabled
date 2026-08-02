import raw from "./puzzles.generated.json";
import type { Color } from "../chess/types";

export type Puzzle = {
  id: string;
  theme: string;
  rating: number;
  fen: string;
  solver: Color;
  type: "mate" | "line";
  mateIn?: number;
  keys?: string[]; // accepted first moves (UCI) for mate puzzles
  line?: string[]; // full UCI line for line puzzles (solver, opp, solver, ...)
};

export const PUZZLES: Puzzle[] = raw as Puzzle[];

export const PUZZLE_THEMES: string[] = Array.from(
  new Set(PUZZLES.map((p) => p.theme))
);

/** Pick a puzzle close to a target rating the player hasn't just seen. */
export function pickPuzzleNear(rating: number, excludeIds: string[] = []): Puzzle {
  const pool = PUZZLES.filter((p) => !excludeIds.includes(p.id));
  const list = pool.length ? pool : PUZZLES;
  let best = list[0];
  let bestD = Infinity;
  // bias toward the closest rating, but allow a band so it's not deterministic
  const band = list
    .map((p) => ({ p, d: Math.abs(p.rating - rating) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.min(6, list.length));
  best = band[Math.floor(Math.random() * band.length)].p;
  bestD = Math.abs(best.rating - rating);
  void bestD;
  return best;
}

export function puzzlesByTheme(theme: string): Puzzle[] {
  return PUZZLES.filter((p) => p.theme === theme).sort(
    (a, b) => a.rating - b.rating
  );
}
