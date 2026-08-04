// One entry point for "review this record", dispatching to the analyser that
// knows the game. Chess needs the engine so the whole thing is async; everything
// else resolves immediately.

import type { GameRecord } from "../state/useArchive";
import { catalogEntry } from "../catalog";
import { getGame } from "../games/registry";
import type { GameMove, Player } from "../games/core/types";
import { reviewBoardGame } from "./board";
import { reviewChessGame, type ChessReviewOpts } from "./chess";
import { reviewLogicSolve, type SolveEvent } from "./logic";
import type { GameReview } from "./types";

export * from "./rate";
export * from "./types";
export { reviewBoardGame, moveText, cellName } from "./board";
export { reviewChessGame } from "./chess";
export { reviewLogicSolve, type SolveEvent } from "./logic";

/** Can this record be taken apart move by move at all? */
export function isReviewable(r: GameRecord): boolean {
  const cat = catalogEntry(r.gameId)?.category;
  if (cat === "chess") return Array.isArray(r.moves) && r.moves.length > 0;
  if (cat === "board") return Array.isArray(r.moves) && r.moves.length > 0 && !!getGame(r.gameId);
  if (cat === "logic") return Array.isArray(r.moves) && r.moves.length > 0;
  return false;
}

export async function reviewRecord(
  r: GameRecord,
  opts: Pick<ChessReviewOpts, "movetimeMs" | "onProgress" | "signal"> = {}
): Promise<GameReview> {
  const cat = catalogEntry(r.gameId)?.category;
  const empty = (why: string): GameReview => ({
    recordId: r.id,
    gameId: r.gameId,
    gameName: r.gameName,
    method: "—",
    moves: [],
    accuracy: 100,
    unavailable: why,
  });

  if (cat === "chess") {
    if (!Array.isArray(r.moves) || r.moves.length === 0) return empty("No move list was recorded for this game.");
    const review = await reviewChessGame(r.moves as string[], {
      ...opts,
      humanSide: r.humanSide,
      startFen: r.startFen,
    });
    return { ...review, recordId: r.id, gameName: r.gameName };
  }

  if (cat === "board") {
    const def = getGame(r.gameId);
    if (!def) return empty("This game is no longer in the app.");
    if (!Array.isArray(r.moves) || r.moves.length === 0) return empty("No move list was recorded for this game.");
    const human = (Number(r.humanSide) === 1 ? 1 : 0) as Player;
    return reviewBoardGame(def, r.moves as GameMove[], human, r.id);
  }

  if (cat === "logic") {
    if (!Array.isArray(r.moves) || r.moves.length === 0) {
      return empty("This solve predates per-entry recording, so only the result is stored.");
    }
    const review = reviewLogicSolve(r.moves as SolveEvent[], {
      gameId: r.gameId,
      gameName: r.gameName,
      recordId: r.id,
    });
    return review;
  }

  // Card games turn on hidden information: without the cards the opponents held,
  // second-guessing a discard would be theatre rather than analysis.
  return empty(
    "Card games are reviewed by result rather than by move — the deal is hidden, so a per-move verdict would be guesswork."
  );
}
