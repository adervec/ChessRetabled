import { create } from "zustand";
import { persist } from "zustand/middleware";

// App-wide presentation + behaviour settings. Persisted separately from
// progress so a settings change never risks the player's record.

export type ThemeId = "dusk" | "pastel" | "croanada";
export type AnimSpeedId = "off" | "fast" | "normal" | "slow";

export const THEMES: { id: ThemeId; name: string; swatch: string[] }[] = [
  { id: "dusk", name: "Dusk", swatch: ["#1e1640", "#9b6bff", "#44e0a4", "#ffce4f"] },
  { id: "pastel", name: "Pastel", swatch: ["#fdf0f4", "#b8a6ff", "#7ad6b0", "#ffd28a"] },
  { id: "croanada", name: "Croanada", swatch: ["#d52b1e", "#fbf3ec", "#e8a33d", "#6e3b1f"] },
];

/** Move-animation durations in ms, keyed by the user's chosen speed. */
export const ANIM_MS: Record<AnimSpeedId, number> = {
  off: 0,
  fast: 150,
  normal: 300,
  slow: 560,
};

export const ANIM_SPEEDS: { id: AnimSpeedId; name: string }[] = [
  { id: "off", name: "Off" },
  { id: "fast", name: "Fast" },
  { id: "normal", name: "Normal" },
  { id: "slow", name: "Slow" },
];

/**
 * The minimum time a computer move should take. An instant reply is jarring, so
 * the engine waits at least one (fast) animation plus a beat — never truly 0.
 */
export function aiThinkFloorMs(speed: AnimSpeedId): number {
  return Math.max(ANIM_MS[speed] + 140, 380);
}

export type SettingsState = {
  theme: ThemeId;
  animSpeed: AnimSpeedId;
  /** Tilt the 2.5D boards, or render them flat. */
  boardTilt: boolean;
  setTheme: (t: ThemeId) => void;
  setAnimSpeed: (s: AnimSpeedId) => void;
  setBoardTilt: (v: boolean) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dusk",
      animSpeed: "normal",
      boardTilt: true,
      setTheme: (theme) => set({ theme }),
      setAnimSpeed: (animSpeed) => set({ animSpeed }),
      setBoardTilt: (boardTilt) => set({ boardTilt }),
    }),
    { name: "chessretabled.settings.v1" }
  )
);

/** Current move-animation duration in ms. */
export const useAnimMs = () => useSettings((s) => ANIM_MS[s.animSpeed]);
