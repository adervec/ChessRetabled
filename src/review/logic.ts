// Move-by-move review for the Logic Lab. A deduction puzzle has no opponent, so
// "how much did that cost you" is measured against the solution the generator
// already proved unique: an entry is either forced by what you knew, or it was a
// guess that had to be taken back.
//
// Puzzles emit these events through logic/ui/useSolveLog.ts.

import { rateMove, accuracy } from "./rate.ts";
import type { GameReview, MoveReview } from "./types.ts";

export interface SolveEvent {
  /** Cell index the player touched. */
  i: number;
  /** Value entered (0 / "" means cleared). */
  v: number | string;
  /** Matches the puzzle's solution. */
  ok: boolean;
  /** This entry overwrote or cleared a value that was already correct. */
  undid?: boolean;
  /** The value came from a hint rather than the player. */
  hint?: boolean;
}

const CLEARED = (v: number | string) => v === 0 || v === "" || v === "-";

export function reviewLogicSolve(
  events: SolveEvent[],
  meta: { gameId: string; gameName: string; recordId?: string }
): GameReview {
  const moves: MoveReview[] = [];
  const losses: number[] = [];
  let worst = { ply: 0, loss: 0 };

  events.forEach((e, idx) => {
    const cleared = CLEARED(e.v);
    let loss = 0;
    let note: string | undefined;

    if (e.hint) {
      note = "Revealed by a hint.";
    } else if (cleared && e.undid) {
      loss = 0.15;
      note = "Cleared a square that was already right.";
    } else if (cleared) {
      loss = 0;
      note = "Cleared a wrong square — a correction, not a mistake.";
    } else if (!e.ok && e.undid) {
      loss = 0.5;
      note = "Overwrote a correct square with a wrong one.";
    } else if (!e.ok) {
      loss = 0.3;
      note = "This square can't hold that value in the finished grid.";
    }

    const label = e.hint
      ? "forced"
      : rateMove({ loss, onlyMove: false });

    if (!e.hint) losses.push(loss);
    if (loss > worst.loss) worst = { ply: idx + 1, loss };

    moves.push({
      ply: idx + 1,
      by: "solo",
      text: cleared ? `clear ${cellRef(e.i)}` : `${cellRef(e.i)} = ${e.v}`,
      label,
      loss,
      note,
    });
  });

  return {
    recordId: meta.recordId ?? "",
    gameId: meta.gameId,
    gameName: meta.gameName,
    method: "Every entry checked against the generator's unique solution",
    moves,
    accuracy: accuracy(losses),
    turningPointPly: worst.loss >= 0.5 ? worst.ply : undefined,
  };
}

/** Cell references stay 1-based and grid-free — puzzles vary too much to guess. */
function cellRef(i: number): string {
  return `#${i + 1}`;
}
