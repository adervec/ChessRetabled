// Generic combinatorial-game abstraction.
//
// Everything under src/games/ is original code, GPL-3.0 like the rest of the
// project — no third-party engine or rules dependency is pulled in. That keeps
// the licensing story trivial (see THIRD-PARTY-NOTICES.md: nothing to add) and
// lets the whole suite ship in the existing static, client-side build with no
// WASM downloads.
//
// Logic lives in `.ts` files with explicit-extension cross-imports so the Node
// verification harness (scripts/validate-games.mjs) can import and exercise it
// headlessly via Node 24 type-stripping, exactly like the chess content scripts.
// Rendering metadata is plain data, so definitions never import JSX/`.tsx`.

/** 0 = the player who moves first in the game, 1 = the second player. */
export type Player = 0 | 1;

export function other(p: Player): Player {
  return p === 0 ? 1 : 0;
}

/** Terminal status of a position. `winner: null` with `over: true` means a draw. */
export type GameStatus =
  | { over: false }
  | { over: true; winner: Player | null; reason: string };

/**
 * A full turn for one player. `from`/`to`/`remove` are cell indices that drive
 * the generic click UI; games that don't need a field omit it. Anything the
 * engine needs to apply the move is carried in the optional fields, so
 * `applyMove` never has to re-derive a move from coordinates.
 */
export interface GameMove {
  /** Unique among the legal moves of a single position. */
  id: string;
  /** Origin cell for "select" games (move a piece); omitted for placement. */
  from?: number;
  /** Primary destination / placement cell. */
  to: number;
  /** Opponent cell removed by this move (Nine Men's Morris mills). */
  remove?: number;
  /** Cells captured/flipped/jumped — used for last-move highlighting. */
  affected?: number[];
  /** Intermediate landing cells for multi-step moves (checkers jumps). */
  path?: number[];
}

/** How one occupied cell renders. */
export interface CellView {
  owner: Player;
  /** Emoji / short glyph drawn in the cell. */
  glyph: string;
  /** Promoted piece (checkers king) — for extra styling. */
  crowned?: boolean;
}

/** Board geometry: either a rectangular grid or positioned points joined by lines. */
export type BoardGeometry =
  | {
      kind: "grid";
      cols: number;
      rows: number;
      /** Checkerboard coloring (chess/checkers/reversi). */
      checkered?: boolean;
      /** Connect-Four style: a click anywhere in a column drops to the lowest cell. */
      dropColumns?: boolean;
      /** Only dark squares are playable (checkers). */
      darkOnly?: boolean;
    }
  | {
      kind: "points";
      /** SVG viewBox dimensions. */
      width: number;
      height: number;
      /** Node positions, index-aligned with the cells() array. */
      points: { x: number; y: number }[];
      /** Lines drawn between node indices. */
      edges: [number, number][];
    };

export interface Difficulty {
  id: string;
  name: string;
  /** Nominal search depth (the engine still respects the time budget). */
  depth: number;
  /** Probability of playing a random legal move instead of the best one. */
  randomness: number;
  /** Soft wall-clock budget for the search, in ms. */
  timeMs: number;
}

/**
 * A self-contained game. `S` is the (JSON-serialisable) state type. State is
 * treated as immutable: `applyMove` returns a fresh state so the AI can explore
 * by cloning rather than make/unmake.
 */
export interface GameDefinition<S = unknown> {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  /** Display names + glyphs for player 0 and player 1. */
  players: [string, string];

  geometry: BoardGeometry;
  /** "place": click a target cell. "select": click a piece, then its destination. */
  interaction: "place" | "select";
  /**
   * Per-turn override of the interaction model (Nine Men's Morris alternates
   * between placing and moving). Falls back to `interaction` when omitted.
   * When a chosen (to) or (from,to) matches several legal moves differing only
   * by `remove`, the UI prompts for the capture target automatically.
   */
  interactionFor?(s: S): "place" | "select";

  initial(): S;
  currentPlayer(s: S): Player;
  legalMoves(s: S): GameMove[];
  applyMove(s: S, m: GameMove): S;
  status(s: S): GameStatus;

  /** Heuristic score from `player`'s perspective (higher = better for player). */
  evaluate(s: S, player: Player): number;

  /** One view per cell index (null = empty), length = number of cells. */
  cells(s: S): (CellView | null)[];

  /**
   * Pruned + ordered move list for the AI (e.g. Gomoku neighbourhood). Falls
   * back to legalMoves when omitted. Human interaction always uses legalMoves.
   */
  candidateMoves?(s: S): GameMove[];

  difficulties: Difficulty[];

  /** Short, human-readable how-to shown above the board. */
  rules: string;
}
