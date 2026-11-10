import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DailyResult } from "../logic/daily";

// The daily ledger: one row per calendar day you solved, keyed by the local day
// ("2026-11-07"). Deliberately its own store rather than derived from the
// archive — the archive can't tell a daily apart from a casual play of the same
// puzzle on the same day, and a streak built on that guess would be wrong.
//
// It rides along in the export/sync bundle (state/dataTransfer.ts), because a
// streak you lose by switching devices isn't much of a streak.

export interface DailyState {
  results: Record<string, DailyResult>;
  /** Record a solved day. First solve wins — re-solving never downgrades it. */
  markSolved: (dayKey: string, result: DailyResult) => void;
  clear: () => void;
}

export const useDaily = create<DailyState>()(
  persist(
    (set, get) => ({
      results: {},
      markSolved: (dayKey, result) => {
        if (get().results[dayKey]) return;
        set((s) => ({ results: { ...s.results, [dayKey]: result } }));
      },
      clear: () => set({ results: {} }),
    }),
    { name: "chessretabled.daily.v1", partialize: (s) => ({ results: s.results }) }
  )
);
