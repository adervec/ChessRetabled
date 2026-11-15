import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adoptHouseTheme, deviceSkin } from "./theme.ts";

// App-wide presentation + behaviour settings. Persisted separately from
// progress so a settings change never risks the player's record.

/**
 * A board skin: the squares, frame, felt, card face and piece art. NOT the app's
 * colour theme — that is the house's one list, owned by font.js (standard 24).
 * These ids are the six themes this app used to have, kept deliberately so a
 * returning reader's board looks exactly as they left it.
 */
export type SkinId = "dusk" | "pastel" | "croanada" | "penguin" | "volcano" | "vegas";
export type AnimSpeedId = "off" | "fast" | "normal" | "slow";
/** Which small-screen layout to use. "auto" is the only one that watches the device. */
export type OrientationId = "auto" | "portrait" | "landscape";

export const ORIENTATIONS: { id: OrientationId; name: string; icon: string }[] = [
  { id: "auto", name: "Auto", icon: "🔄" },
  { id: "portrait", name: "Portrait", icon: "📱" },
  { id: "landscape", name: "Landscape", icon: "🖥" },
];

// Resolution (per-game pin → global → the game's logical default → device) lives
// in state/orientation.ts, which is pure so it can be validated headlessly.

/** The board skins, with a four-colour swatch for the picker. */
export const SKINS: { id: SkinId; name: string; swatch: string[] }[] = [
  { id: "dusk", name: "Dusk", swatch: ["#4a8fb5", "#f3d9a4", "#2a1f4f", "#ffe27a"] },
  { id: "pastel", name: "Pastel", swatch: ["#b7d7c9", "#f6e7c9", "#e6d7ee", "#ffe6a3"] },
  { id: "croanada", name: "Croanada", swatch: ["#d52b1e", "#fbf3ec", "#6e3b1f", "#ffcf5c"] },
  { id: "penguin", name: "Penguin", swatch: ["#7fb4d8", "#eef6fc", "#3a5a72", "#ffd86a"] },
  { id: "volcano", name: "Volcano", swatch: ["#6e3320", "#d4925c", "#1a0d0a", "#ffb02e"] },
  { id: "vegas", name: "Vegas", swatch: ["#9a1530", "#e8d6a0", "#14060a", "#ffd24a"] },
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
  /** The board skin. The colour theme is font.js's, not ours (standard 24). */
  boardSkin: SkinId;
  animSpeed: AnimSpeedId;
  /** Tilt the 2.5D boards, or render them flat. */
  boardTilt: boolean;
  /** App-wide layout fallback, used where no game is open or pinned. */
  orientation: OrientationId;
  /** Per-game layout pins, keyed by catalogue id. Unset = the game's own default. */
  gameOrientation: Record<string, OrientationId>;
  /** Synthesised move/win/UI cues (state/sfx.ts). */
  sound: boolean;
  /** 0–1, applied on top of the pack's own master trim. */
  volume: number;
  setBoardSkin: (s: SkinId) => void;
  setAnimSpeed: (s: AnimSpeedId) => void;
  setBoardTilt: (v: boolean) => void;
  setOrientation: (o: OrientationId) => void;
  setGameOrientation: (gameId: string, o: OrientationId) => void;
  setSound: (v: boolean) => void;
  setVolume: (v: number) => void;
};

/**
 * Bring a saved settings blob up to the current shape.
 *
 * v1 kept `theme`, one of this app's own six. Standard 24 moved the colour theme
 * to the house list, so that value becomes the BOARD SKIN — the ids are the same
 * six names, so the board is untouched — and the reader is moved to the nearest
 * house theme once, rather than being left on a theme that no longer exists.
 *
 * Two paths rehydrate settings and BOTH need this: the persist middleware on
 * boot, and `dataTransfer.applyBundle` for an exported or Drive-synced file. A
 * backup made before this change still restores the reader's board.
 */
export function upgradeSettings(persisted: unknown): Record<string, unknown> {
  const s = { ...((persisted ?? {}) as Record<string, unknown>) } as Record<string, unknown> & {
    theme?: SkinId;
    boardSkin?: SkinId;
  };
  if (!s.theme) return s;
  const legacy = s.theme;
  delete s.theme;
  if (!s.boardSkin) s.boardSkin = legacy;
  adoptHouseTheme(legacy);
  return s;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      // Only the *initial* value: persist rehydrates a saved choice over it.
      boardSkin: deviceSkin(),
      animSpeed: "normal",
      boardTilt: true,
      orientation: "auto",
      gameOrientation: {},
      sound: true,
      volume: 0.6,
      setBoardSkin: (boardSkin) => set({ boardSkin }),
      setAnimSpeed: (animSpeed) => set({ animSpeed }),
      setBoardTilt: (boardTilt) => set({ boardTilt }),
      setOrientation: (orientation) => set({ orientation }),
      setGameOrientation: (gameId, o) =>
        set((s) => ({ gameOrientation: { ...s.gameOrientation, [gameId]: o } })),
      setSound: (sound) => set({ sound }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
    }),
    {
      name: "chessretabled.settings.v1",
      version: 2,
      migrate: (persisted, version) => (version >= 2 ? persisted : upgradeSettings(persisted)),
    }
  )
);

/** Current move-animation duration in ms. */
export const useAnimMs = () => useSettings((s) => ANIM_MS[s.animSpeed]);
