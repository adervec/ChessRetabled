// A single, flat catalogue of everything playable in the app — chess, the board
// games, the card room, and the Logic Lab — keyed by the same id that finished
// games are archived under (GameRecord.gameId). The dashboard cross-references
// the archive against this list to see what's been played and what hasn't.

import { GAMES } from "./games/registry.ts";
import { CARD_GAMES } from "./cards/registry.ts";
import { LOGIC_PUZZLES } from "./logic/registry.ts";

export type CatalogCategory = "chess" | "board" | "cards" | "logic";
/** "versus" games resolve win/draw/loss; "solo" games are cleared or abandoned. */
export type CatalogKind = "versus" | "solo";

export interface CatalogEntry {
  id: string;
  name: string;
  icon: string;
  category: CatalogCategory;
  kind: CatalogKind;
  /** Route that opens this game/puzzle. */
  path: string;
}

export const CATALOG: CatalogEntry[] = [
  { id: "chess", name: "Chess", icon: "♟", category: "chess", kind: "versus", path: "/play" },
  ...GAMES.map((g): CatalogEntry => ({
    id: g.id, name: g.name, icon: g.icon, category: "board", kind: "versus", path: "/games",
  })),
  ...CARD_GAMES.map((g): CatalogEntry => ({
    id: g.id, name: g.name, icon: g.icon, category: "cards",
    kind: g.kind === "solo" ? "solo" : "versus", path: "/cards",
  })),
  ...LOGIC_PUZZLES.map((p): CatalogEntry => ({
    id: p.id, name: p.name, icon: p.icon, category: "logic", kind: "solo", path: "/logic",
  })),
];

export const CATALOG_BY_ID: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG.map((e) => [e.id, e]),
);

export const CATEGORY_LABEL: Record<CatalogCategory, string> = {
  chess: "Chess",
  board: "Board games",
  cards: "Card room",
  logic: "Logic Lab",
};

export const CATEGORY_ORDER: CatalogCategory[] = ["chess", "board", "cards", "logic"];

export function catalogEntry(gameId: string): CatalogEntry | undefined {
  return CATALOG_BY_ID[gameId];
}
