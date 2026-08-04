import { useEffect, useRef } from "react";
import { useSessions } from "../../state/useSessions";
import { useArchive } from "../../state/useArchive";
import { CARD_GAMES } from "../registry.ts";

// Card games keep their whole state — deal, hands, betting round — inside each
// game component, so unlike the board games there is no move log to count from
// the outside. What the lobby *can* see is that you sat down and whether a
// result has landed in the archive since, which is enough to keep the game in
// the bottom bar until it resolves.
//
// The abandon policy handles the rest: with no move count, time at the table is
// what decides between a real hand and a misclick.

export function useCardSession(gameId: string | null): void {
  const save = useSessions((s) => s.save);
  const end = useSessions((s) => s.end);
  const records = useArchive((a) => a.records);
  const openedAt = useRef<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      openedAt.current = null;
      return;
    }
    const existing = useSessions.getState().get(gameId);
    const startedISO = existing?.startedISO ?? new Date().toISOString();
    openedAt.current = startedISO;

    const meta = CARD_GAMES.find((g) => g.id === gameId);
    save({
      gameId,
      gameName: meta?.name ?? gameId,
      icon: meta?.icon ?? "🃏",
      route: "/cards",
      // No per-move signal here; time at the table is the engagement measure.
      moveCount: 0,
      startedISO,
      updatedISO: new Date().toISOString(),
    });
  }, [gameId, save]);

  // A finished hand writes to the archive — that's the signal the session is
  // resolved, whoever won it.
  useEffect(() => {
    if (!gameId || !openedAt.current) return;
    const since = Date.parse(openedAt.current);
    const finished = records.some(
      (r) => r.gameId === gameId && Date.parse(r.endedISO) >= since
    );
    if (finished) end(gameId);
  }, [gameId, records, end]);
}
