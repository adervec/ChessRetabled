// Grades for one finished game, from two judges that never overwrite each other.
//
// `app` is this app's own verdict (review/ rates every move against the game's own
// engine at a fixed depth). `ai` is the cowork channel's second opinion. The house
// standard is explicit that the AI review is stored BESIDE the app's score and
// never replaces it, so they are separate fields and `setAi` cannot touch `app`.
//
// Why a store at all: computing `app` means an engine search — minutes for a long
// chess game — so it is kept once the player opens the game in Review rather than
// recomputed whenever something wants to know the score.
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** This app's own grade for a game, as review/ produced it. */
export interface AppGrade {
  /** 0–100 over the human's own moves. */
  accuracy: number;
  /** How the moves were judged, so the number isn't a mystery. */
  method: string;
  turningPointPly?: number;
  /** Label → count, e.g. { best: 12, inaccuracy: 2, blunder: 1 }. */
  counts: Record<string, number>;
  gradedISO: string;
}

/** The cowork channel's second opinion. Every field comes from an untrusted reply. */
export interface AiGrade {
  grade: string;
  summary: string;
  strengths: string[];
  fixes: string[];
  next: string;
  reviewedISO: string;
}

export interface ReviewEntry {
  app?: AppGrade;
  ai?: AiGrade;
}

interface GameReviewsState {
  byRecord: Record<string, ReviewEntry>;
  /** Keep the app's own grade for a game the player just had analysed. */
  setApp: (recordId: string, app: AppGrade) => void;
  /** Add the AI's grade beside it. Never touches `app`. */
  setAi: (recordId: string, ai: AiGrade) => void;
  /** Undo for one applied review. */
  removeAi: (recordId: string) => void;
  clear: () => void;
}

export const useGameReviews = create<GameReviewsState>()(
  persist(
    (set) => ({
      byRecord: {},
      setApp: (recordId, app) =>
        set((s) => ({ byRecord: { ...s.byRecord, [recordId]: { ...s.byRecord[recordId], app } } })),
      setAi: (recordId, ai) =>
        set((s) => ({ byRecord: { ...s.byRecord, [recordId]: { ...s.byRecord[recordId], ai } } })),
      removeAi: (recordId) =>
        set((s) => {
          const entry = s.byRecord[recordId];
          if (!entry) return s;
          const { ai: _drop, ...rest } = entry;
          return { byRecord: { ...s.byRecord, [recordId]: rest } };
        }),
      clear: () => set({ byRecord: {} }),
    }),
    { name: "chessretabled.reviews.v1", partialize: (s) => ({ byRecord: s.byRecord }) }
  )
);
