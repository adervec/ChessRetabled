import type { MoveLabel } from "./rate.ts";

/** One analysed ply. */
export interface MoveReview {
  /** 1-based ply number. */
  ply: number;
  /** Who played it: the human's side, the opponent, or "solo" for puzzles. */
  by: "you" | "opponent" | "solo";
  /** Move as the game writes it — SAN for chess, a short description elsewhere. */
  text: string;
  label: MoveLabel;
  /** Winning chances given up, 0..1. */
  loss: number;
  /** What the analyser would have played instead, when it differs. */
  best?: string;
  /** Position evaluation after the move, as a percentage for the mover. */
  chance?: number;
  note?: string;
}

export interface GameReview {
  recordId: string;
  gameId: string;
  gameName: string;
  /** How the moves were judged, shown to the user so the number isn't a mystery. */
  method: string;
  moves: MoveReview[];
  /** 0–100 over the human's own moves. */
  accuracy: number;
  /** Ply of the biggest single mistake by the human, if any. */
  turningPointPly?: number;
  /** Set when the record can't be analysed move-by-move. */
  unavailable?: string;
}

/**
 * Anything reviewable: a real archived game, or a seeded famous/demo game.
 * Seeded entries carry context and are never counted in the player's stats.
 */
export type ReviewSource = "played" | "famous" | "sample";
