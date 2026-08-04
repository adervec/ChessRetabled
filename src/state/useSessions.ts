import { create } from "zustand";
import { persist } from "zustand/middleware";

// Games you have open but haven't finished.
//
// Closing the tab used to lose the game silently. A session is written as you
// play, so anything unfinished survives a reload and shows up in the bottom bar
// until you either finish it or deliberately walk away.
//
// **Device-local on purpose.** This store is deliberately absent from
// state/dataTransfer.ts and the cloud bundle: a half-finished game is a fact
// about this device, not a result. Only the finished record — written to the
// archive when the game resolves — is worth syncing.

export interface Session {
  /** One live session per game, so the id is the catalogue id. */
  gameId: string;
  gameName: string;
  icon: string;
  startedISO: string;
  updatedISO: string;
  /** Route that reopens it. */
  route: string;
  /** Moves the human has made — feeds the abandon policy. */
  moveCount: number;
  /** Everything needed to rebuild the position, when the game can do that. */
  resume?: {
    /** Board games: the move log, replayed from the initial position. */
    moves?: unknown[];
    /** Chess: SAN history. */
    san?: string[];
    /** Free-form setup (difficulty id, bot id, colour, seed…). */
    setup?: Record<string, string | number | boolean>;
  };
  /** True once a hint has been used, so the eventual record stays honest. */
  assisted?: boolean;
  /** Set when the game itself reports the human is losing. */
  losing?: boolean;
}

export type SessionsState = {
  sessions: Session[];
  /** Create or update the session for a game. */
  save: (s: Session) => void;
  /** Remove it — resolved, or deliberately abandoned. */
  end: (gameId: string) => void;
  get: (gameId: string) => Session | undefined;
  clear: () => void;
};

export const useSessions = create<SessionsState>()(
  persist(
    (set, get) => ({
      sessions: [],
      save: (s) =>
        set((st) => ({
          sessions: [s, ...st.sessions.filter((x) => x.gameId !== s.gameId)],
        })),
      end: (gameId) =>
        set((st) => ({ sessions: st.sessions.filter((x) => x.gameId !== gameId) })),
      get: (gameId) => get().sessions.find((x) => x.gameId === gameId),
      clear: () => set({ sessions: [] }),
    }),
    { name: "chessretabled.sessions.v1" }
  )
);

/** Sessions other than the one on screen — what the bottom bar offers. */
export function otherSessions(sessions: Session[], activeGameId: string | null): Session[] {
  return sessions.filter((s) => s.gameId !== activeGameId);
}
