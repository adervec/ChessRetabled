import type { CellView, GameDefinition } from "../core/types";

/** A rendered piece with a stable id so it animates across moves (no teleport). */
export interface Token {
  id: string;
  cell: number;
  owner: 0 | 1;
  crowned?: boolean;
}

/**
 * The minimal surface GameBoard renders from. Both the full game hook
 * (useGenericGame) and the lesson player (useLessonPosition) implement it, so
 * the same 2.5D board powers live play and tutorials alike.
 */
export interface BoardView {
  def: GameDefinition<unknown>;
  cells: (CellView | null)[];
  tokens: Token[];
  graveyard: Token[];
  targets: number[];
  selected: number | null;
  removalTargets: number[];
  lastMoveCells: number[];
  /** Cells highlighted by the progressive hint (optional — lessons omit it). */
  hintCells?: number[];
  isHumanTurn: boolean;
  onCellClick: (index: number) => void;
}
