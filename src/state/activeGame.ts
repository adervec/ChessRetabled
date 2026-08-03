import { useEffect } from "react";
import { create } from "zustand";

// Which catalogue game is on screen right now. Deliberately NOT persisted — it
// is a fact about this render, not a preference. App.tsx reads it to pick the
// layout, and the nav shows its per-game layout toggle.

type ActiveGameState = { id: string | null; set: (id: string | null) => void };

export const useActiveGameStore = create<ActiveGameState>((set) => ({
  id: null,
  set: (id) => set({ id }),
}));

/** Declare the game this screen is showing; pass null while in a lobby. */
export function useActiveGame(id: string | null) {
  const set = useActiveGameStore((s) => s.set);
  useEffect(() => {
    set(id);
    return () => set(null);
  }, [id, set]);
}
