import { create } from "zustand";
import { persist } from "zustand/middleware";

// Rich history of every finished game — chess and the arcade games alike.
// Records are fully serialisable so the whole archive round-trips through the
// JSON import/export (see state/dataTransfer.ts) and the cloud-sync groundwork
// (see state/sync.ts).

export type GameOutcome = "win" | "loss" | "draw" | "abandoned";

export interface GameRecord {
  id: string;
  /** "chess" or a games-suite definition id (e.g. "checkers"). */
  gameId: string;
  gameName: string;
  startedISO: string;
  endedISO: string;
  outcome: GameOutcome;
  /** Player index/colour the human controlled (0/1, or "w"/"b" for chess). */
  humanSide: string;
  opponent: string;
  difficulty?: string;
  /** Move count + the serialised move list (SAN for chess, moves for arcade). */
  moveCount: number;
  moves: unknown[];
  reason?: string;
  /** Optional starting position (FEN for chess) for full replay. */
  startFen?: string;
}

const MAX_RECORDS = 1000;

export function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type ArchiveState = {
  records: GameRecord[];
  add: (r: GameRecord) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useArchive = create<ArchiveState>()(
  persist(
    (set) => ({
      records: [],
      add: (r) => set((s) => ({ records: [r, ...s.records].slice(0, MAX_RECORDS) })),
      remove: (id) => set((s) => ({ records: s.records.filter((x) => x.id !== id) })),
      clear: () => set({ records: [] }),
    }),
    { name: "chessretabled.archive.v1" }
  )
);

/** Aggregate per-game stats over the archive — used by the profile/history UI. */
export function summarise(records: GameRecord[]): Record<
  string,
  { name: string; played: number; won: number; lost: number; drawn: number }
> {
  const out: Record<string, { name: string; played: number; won: number; lost: number; drawn: number }> = {};
  for (const r of records) {
    const e = (out[r.gameId] ??= { name: r.gameName, played: 0, won: 0, lost: 0, drawn: 0 });
    e.played++;
    if (r.outcome === "win") e.won++;
    else if (r.outcome === "loss") e.lost++;
    else if (r.outcome === "draw") e.drawn++;
  }
  return out;
}
