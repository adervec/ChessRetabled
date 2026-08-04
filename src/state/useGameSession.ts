import { useEffect } from "react";
import { useSessions, type Session } from "./useSessions";

// One line in a game screen keeps that game in the bottom bar until it resolves.
// The session updates as you play and clears itself the moment the game is over,
// so a finished game never lingers as "still going".

export interface GameSessionInput {
  gameId: string;
  gameName: string;
  icon: string;
  /** Where to send the player to pick this back up. */
  route: string;
  moveCount: number;
  /** True once the game has a result — the session is no longer open. */
  over: boolean;
  assisted?: boolean;
  losing?: boolean;
  resume?: Session["resume"];
}

export function useGameSession(input: GameSessionInput): void {
  const save = useSessions((s) => s.save);
  const end = useSessions((s) => s.end);
  const {
    gameId, gameName, icon, route, moveCount, over, assisted, losing,
  } = input;

  useEffect(() => {
    if (over) {
      end(gameId);
      return;
    }
    // Nothing has happened yet — don't offer to resume an untouched board.
    if (moveCount === 0) return;

    const existing = useSessions.getState().get(gameId);
    save({
      gameId,
      gameName,
      icon,
      route,
      moveCount,
      startedISO: existing?.startedISO ?? new Date().toISOString(),
      updatedISO: new Date().toISOString(),
      assisted: assisted || undefined,
      losing: losing || undefined,
      resume: input.resume,
    });
    // `resume` is a fresh object every render; the move count is what actually
    // changes, so it drives the write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, gameName, icon, route, moveCount, over, assisted, losing, save, end]);
}
