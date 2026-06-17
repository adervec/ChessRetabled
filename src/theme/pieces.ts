import { useSettings, type ThemeId } from "../state/useSettings";
import { darken, lighten, luminance } from "../games/ui/color";

// Per-theme piece reskinning. A theme may recolour every piece — chess and the
// board-game tokens alike — by supplying a "light" and "dark" side. Each game's
// two sides are mapped to light/dark by their original luminance, so the lighter
// side stays light (e.g. chess White, Reversi's white discs) and only the hue
// changes. Themes without an entry (Dusk) keep each game's native colours.

export interface PieceSide {
  body: string; // main fill
  base: string; // chess plinth / accent
  ink: string; // outline
}
export interface ThemePieceSet {
  light: PieceSide;
  dark: PieceSide;
}

export const THEME_PIECES: Partial<Record<ThemeId, ThemePieceSet>> = {
  pastel: {
    light: { body: "#fff1e8", base: "#ffd28a", ink: "#5b4a63" },
    dark: { body: "#b8a6ff", base: "#8e76e6", ink: "#3a2f4a" },
  },
  croanada: {
    // snow white vs maple red — the Croatian/Canadian pairing
    light: { body: "#f7efe2", base: "#e7a33c", ink: "#2b1410" },
    dark: { body: "#d52b1e", base: "#a81d12", ink: "#2b1410" },
  },
};

export function useThemePieces(): ThemePieceSet | null {
  const theme = useSettings((s) => s.theme);
  return THEME_PIECES[theme] ?? null;
}

/** True if `owner`'s side is the lighter of a game's two piece colours. */
export function isLighterSide(colors: [string, string], owner: number): boolean {
  const lighter = luminance(colors[0]) >= luminance(colors[1]) ? 0 : 1;
  return owner === lighter;
}

/** The colour a token should actually use, honouring the active theme. */
export function resolveBody(colors: [string, string], owner: number, tp: ThemePieceSet | null): string {
  if (!tp) return colors[owner];
  return isLighterSide(colors, owner) ? tp.light.body : tp.dark.body;
}

export interface ChessPalette {
  light: string; shade: string; hi: string; rim: string; base: string; baseShade: string; ink: string;
}
export function deriveChess(side: PieceSide): ChessPalette {
  return {
    light: side.body,
    shade: darken(side.body, 0.22),
    hi: lighten(side.body, 0.32),
    rim: lighten(side.body, 0.42),
    base: side.base,
    baseShade: darken(side.base, 0.28),
    ink: side.ink,
  };
}
