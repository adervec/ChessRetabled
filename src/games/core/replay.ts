import type { GameDefinition, GameMove } from "./types.ts";

// Rebuilding a position from a move log. Used to resume an unfinished game and
// to scrub through one on the review page — the log is already the archive
// format, so nothing extra has to be serialised or kept in sync.
//
// Pure, so scripts/validate-sessions.mjs can prove a resumed position matches
// the one that was actually played.

export interface Replay<S> {
  state: S;
  /** The moves that could be applied, resolved against the live rules. */
  applied: GameMove[];
  /**
   * True when the log ran out of road — a game saved before a rules change, or
   * a corrupted record. The position is still valid, just short.
   */
  truncated: boolean;
}

/** Fold a logged move list back into a position, stopping at the first move
 *  the current rules no longer accept rather than inventing the rest. */
export function foldMoves<S>(def: GameDefinition<S>, moves: readonly GameMove[] | undefined): Replay<S> {
  let state = def.initial();
  const applied: GameMove[] = [];
  let truncated = false;

  for (const logged of moves ?? []) {
    const legal = def.legalMoves(state);
    const match =
      legal.find((l) => l.id === logged.id) ??
      legal.find((l) => l.to === logged.to && l.from === logged.from && l.remove === logged.remove);
    if (!match) {
      truncated = true;
      break;
    }
    state = def.applyMove(state, match);
    applied.push(match);
  }

  return { state, applied, truncated };
}
