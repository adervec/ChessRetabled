// The app's colour theme is the house's (standard 24): font.js owns the one list
// every app offers, keeps the reader's choice per app, and defaults to "System",
// which follows the device. So there is nothing here for the theme.
//
// What IS ours is the board skin (standard 24's "not themes" clause: chess boards
// and pieces stay the app's own). This picks the skin to open with when the reader
// has never chosen one, so a dark device gets the dark board.
import type { SkinId } from "./useSettings.ts";

/**
 * Where each system preference starts. Only two of the six skins appear here:
 * it is a starting point, not a classification of the set.
 * `validate-house.mjs` checks each one really is light/dark in tokens.css.
 */
export const SCHEME_SKIN: Record<"dark" | "light", SkinId> = {
  dark: "dusk",
  light: "pastel",
};

export function skinForScheme(scheme: "dark" | "light"): SkinId {
  return SCHEME_SKIN[scheme];
}

/**
 * What the device prefers.
 *
 * font.js publishes the house answer, so every app on the origin agrees; the
 * media query is the fallback for a page that loaded without it, and dark is the
 * answer where there is no DOM at all (the Node harness). `typeof matchMedia`
 * on a bare identifier is safe even when it was never declared.
 */
export function deviceScheme(): "dark" | "light" {
  const house = (globalThis as { appFont?: { systemTheme?: () => string } }).appFont?.systemTheme?.();
  if (house === "dark" || house === "light") return house;
  if (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

/** The board skin to open with when the reader has never chosen one. */
export function deviceSkin(): SkinId {
  return skinForScheme(deviceScheme());
}

/**
 * The house theme that comes closest to one of the six themes this app used to
 * have, for the one-time move in `useSettings`'s persist migration. Standard 24:
 * "Never leave a reader on a theme that no longer exists."
 *
 * The board keeps its own look either way — the skin ids are the same six names —
 * so this only decides the chrome a returning reader wakes up to.
 */
export const LEGACY_THEME_HOUSE: Record<SkinId, string> = {
  dusk: "midnight", // deep indigo night
  pastel: "pastel", // the house has one by the same name, and it is the same idea
  croanada: "paper", // snowy warm white
  penguin: "light", // pale ice
  volcano: "ember", // molten orange on char
  vegas: "gold", // gold on near-black
};

interface HouseTheme {
  theme?: () => string;
  setTheme?: (id: string) => void;
}

/**
 * Move a reader off a theme this app no longer owns, once.
 *
 * Only ever called from the v1 to v2 settings migration, and only when the reader
 * has not already chosen a house theme ("system" means they have not) — a saved
 * choice always wins (standard 14).
 */
export function adoptHouseTheme(legacy: SkinId): void {
  // Named `appFont`, not aliased: standards.mjs matches the literal
  // `appFont.setTheme(`, the same gotcha as `setAccount(` in the pfp standard.
  const appFont = (globalThis as { appFont?: HouseTheme }).appFont;
  if (typeof appFont?.setTheme !== "function") return;
  if (typeof appFont.theme === "function" && appFont.theme() !== "system") return;
  const id = LEGACY_THEME_HOUSE[legacy];
  if (id) appFont.setTheme(id);
}
