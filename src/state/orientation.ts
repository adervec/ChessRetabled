// Which arrangement a game screen uses, and where that decision comes from.
// Pure and headless (scripts/validate-orientation.mjs drives it), so no React or
// zustand in here — the store lives in state/activeGame.ts and the wiring in
// App.tsx.

import { GAMES } from "../games/registry.ts";
import { CATALOG_BY_ID } from "../catalog.ts";

/** "landscape" puts the side panel beside the board; "portrait" stacks it below. */
export type Layout = "portrait" | "landscape";
export type LayoutChoice = "auto" | Layout;

/** Card tables that need every pixel of width — seven columns, or a pyramid. */
const WIDE_CARD_TABLES = new Set(["klondike", "golf", "pyramid"]);

/**
 * The arrangement a game defaults to when the viewport is wide enough to offer a
 * choice. The rule reads backwards until you follow the pixels: a **square**
 * board on a wide, short screen is limited by height, so the leftover width
 * should carry the panel (landscape). A **wide** board wants that width for
 * itself, so the panel goes underneath (portrait).
 *
 * Board games answer this from their own geometry, so adding a game needs no
 * entry here. Total by construction: anything unknown gets "landscape".
 */
export function logicalOrientation(gameId: string): Layout {
  const def = GAMES.find((g) => g.id === gameId);
  if (def) {
    const geo = def.geometry;
    const [w, h] = geo.kind === "grid" ? [geo.cols, geo.rows] : [geo.width, geo.height];
    return w > h * 1.15 ? "portrait" : "landscape";
  }
  const entry = CATALOG_BY_ID[gameId];
  if (entry?.category === "cards") {
    return WIDE_CARD_TABLES.has(gameId) ? "portrait" : "landscape";
  }
  // Logic grids carry clue gutters on two sides and no side panel at all, so
  // they always want the full width.
  if (entry?.category === "logic") return "portrait";
  return "landscape";
}

/**
 * Most specific explicit choice wins, then the game's logical default, then —
 * only with no game open at all — the device. A game screen therefore never
 * rearranges itself because the phone was turned.
 */
export function resolveLayout(input: {
  gameId: string | null;
  perGame: Record<string, LayoutChoice>;
  global: LayoutChoice;
  deviceIsLandscape: boolean;
}): Layout {
  const { gameId, perGame, global, deviceIsLandscape } = input;
  const pinned = gameId ? perGame[gameId] : undefined;
  if (pinned && pinned !== "auto") return pinned;
  if (global !== "auto") return global;
  if (gameId) return logicalOrientation(gameId);
  return deviceIsLandscape ? "landscape" : "portrait";
}
