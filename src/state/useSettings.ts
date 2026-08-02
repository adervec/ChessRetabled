import { create } from "zustand";
import { persist } from "zustand/middleware";

// App-wide presentation + behaviour settings. Persisted separately from
// progress so a settings change never risks the player's record.

export type ThemeId = "dusk" | "pastel" | "croanada" | "penguin" | "volcano" | "vegas";
export type AnimSpeedId = "off" | "fast" | "normal" | "slow";
/** Which small-screen layout to use. "auto" is the only one that watches the device. */
export type OrientationId = "auto" | "portrait" | "landscape";

export const ORIENTATIONS: { id: OrientationId; name: string; icon: string }[] = [
  { id: "auto", name: "Auto", icon: "🔄" },
  { id: "portrait", name: "Portrait", icon: "📱" },
  { id: "landscape", name: "Landscape", icon: "🖥" },
];

/** What <html data-orient> should be. Only "auto" defers to the device. */
export function effectiveOrientation(
  setting: OrientationId,
  deviceIsLandscape: boolean
): "portrait" | "landscape" {
  if (setting !== "auto") return setting;
  return deviceIsLandscape ? "landscape" : "portrait";
}

export const THEMES: { id: ThemeId; name: string; swatch: string[] }[] = [
  { id: "dusk", name: "Dusk", swatch: ["#1e1640", "#9b6bff", "#44e0a4", "#ffce4f"] },
  { id: "pastel", name: "Pastel", swatch: ["#fdf0f4", "#b8a6ff", "#7ad6b0", "#ffd28a"] },
  { id: "croanada", name: "Croanada", swatch: ["#d52b1e", "#fbf3ec", "#e8a33d", "#6e3b1f"] },
  { id: "penguin", name: "Penguin", swatch: ["#7fb4d8", "#f5fbff", "#14202b", "#ffb02e"] },
  { id: "volcano", name: "Volcano", swatch: ["#160b08", "#ff5a2b", "#ffb02e", "#6e3320"] },
  { id: "vegas", name: "Vegas", swatch: ["#9a1530", "#ffd24a", "#0c0a0e", "#2fe07a"] },
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
  /** Small-screen layout. Pin it to stop the layout flipping when the phone turns. */
  orientation: OrientationId;
  /** Synthesised move/win/UI cues (state/sfx.ts). */
  sound: boolean;
  /** 0–1, applied on top of the pack's own master trim. */
  volume: number;
  setTheme: (t: ThemeId) => void;
  setAnimSpeed: (s: AnimSpeedId) => void;
  setBoardTilt: (v: boolean) => void;
  setOrientation: (o: OrientationId) => void;
  setSound: (v: boolean) => void;
  setVolume: (v: number) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dusk",
      animSpeed: "normal",
      boardTilt: true,
      orientation: "auto",
      sound: true,
      volume: 0.6,
      setTheme: (theme) => set({ theme }),
      setAnimSpeed: (animSpeed) => set({ animSpeed }),
      setBoardTilt: (boardTilt) => set({ boardTilt }),
      setOrientation: (orientation) => set({ orientation }),
      setSound: (sound) => set({ sound }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
    }),
    { name: "chessretabled.settings.v1" }
  )
);

/** Current move-animation duration in ms. */
export const useAnimMs = () => useSettings((s) => ANIM_MS[s.animSpeed]);
