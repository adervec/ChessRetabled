import { useEffect } from "react";
import { useSessions } from "../../state/useSessions";
import { LOGIC_PUZZLES } from "../registry.ts";

// Puzzles keep their working inside the component, so the lobby can't see how
// far in you are. This hook lives in the puzzle itself: it opens a session as
// soon as you have done anything, updates it as you go, and closes it the moment
// the puzzle is solved — so an unfinished grid survives closing the app and the
// bottom bar can offer it back.

export function useLogicSession(puzzleId: string, entries: number, solved: boolean): void {
  const save = useSessions((s) => s.save);
  const end = useSessions((s) => s.end);

  useEffect(() => {
    if (solved) {
      end(puzzleId);
      return;
    }
    if (entries <= 0) return;

    const meta = LOGIC_PUZZLES.find((p) => p.id === puzzleId);
    const existing = useSessions.getState().get(puzzleId);
    save({
      gameId: puzzleId,
      gameName: meta?.name ?? puzzleId,
      icon: meta?.icon ?? "💡",
      route: "/logic",
      moveCount: entries,
      startedISO: existing?.startedISO ?? new Date().toISOString(),
      updatedISO: new Date().toISOString(),
    });
  }, [puzzleId, entries, solved, save, end]);
}
