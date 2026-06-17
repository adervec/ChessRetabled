import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";
import { colOf, hasKInARow, idx } from "../core/grid.ts";

const COLS = 7;
const ROWS = 6;
const K = 4;
const GLYPHS: [string, string] = ["🔴", "🟡"];

export interface C4State {
  board: (Player | null)[]; // length 42, row 0 on top
  turn: Player;
}

function at(board: (Player | null)[], col: number, row: number): Player | null {
  return board[idx(col, row, COLS)];
}

/** Lowest empty row in a column, or -1 if full. */
function dropRow(board: (Player | null)[], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (board[idx(col, r, COLS)] === null) return r;
  return -1;
}

function winner(board: (Player | null)[]): Player | null {
  for (const p of [0, 1] as Player[]) {
    if (hasKInARow(COLS, ROWS, K, p, (c, r) => at(board, c, r))) return p;
  }
  return null;
}

// Score every length-4 window from a player's perspective.
function windowScore(board: (Player | null)[], player: Player): number {
  const opp: Player = player === 0 ? 1 : 0;
  let score = 0;
  const dirs: [number, number][] = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dc, dr] of dirs) {
        const ec = c + dc * (K - 1);
        const er = r + dr * (K - 1);
        if (ec < 0 || ec >= COLS || er < 0 || er >= ROWS) continue;
        let me = 0;
        let them = 0;
        for (let k = 0; k < K; k++) {
          const v = at(board, c + dc * k, r + dr * k);
          if (v === player) me++;
          else if (v === opp) them++;
        }
        if (me > 0 && them > 0) continue; // mixed window — dead
        if (me === 4) score += 100000;
        else if (me === 3) score += 100;
        else if (me === 2) score += 10;
        else if (them === 4) score -= 100000;
        else if (them === 3) score -= 120; // weight defence slightly higher
        else if (them === 2) score -= 10;
      }
    }
  }
  // Center control is valuable.
  for (let r = 0; r < ROWS; r++) {
    const v = at(board, 3, r);
    if (v === player) score += 6;
    else if (v === opp) score -= 6;
  }
  return score;
}

export const connectFour: GameDefinition<C4State> = {
  id: "connect-four",
  name: "Connect Four",
  icon: "🔴",
  blurb: "Drop discs and connect four in a row before your rival does.",
  players: ["Red", "Yellow"],
  geometry: { kind: "grid", cols: COLS, rows: ROWS, dropColumns: true },
  interaction: "place",
  rules:
    "Pick a column — your disc falls to the lowest open slot. Connect four of your colour in a line (horizontal, vertical, or diagonal) to win. Fill the grid with no four for a draw.",

  initial: () => ({ board: Array(COLS * ROWS).fill(null), turn: 0 }),
  currentPlayer: (s) => s.turn,

  legalMoves(s) {
    const moves: GameMove[] = [];
    for (let c = 0; c < COLS; c++) {
      const r = dropRow(s.board, c);
      if (r >= 0) moves.push({ id: `c${c}`, to: idx(c, r, COLS) });
    }
    return moves;
  },

  applyMove(s, m) {
    const board = s.board.slice();
    board[m.to] = s.turn;
    return { board, turn: s.turn === 0 ? 1 : 0 };
  },

  status(s): GameStatus {
    const w = winner(s.board);
    if (w !== null) return { over: true, winner: w, reason: "four in a row" };
    if (s.board.every((c) => c !== null)) return { over: true, winner: null, reason: "grid full" };
    return { over: false };
  },

  evaluate(s, player) {
    return windowScore(s.board, player);
  },

  candidateMoves(s) {
    // Prefer central columns first — better move ordering for alpha-beta.
    const order = [3, 2, 4, 1, 5, 0, 6];
    const legal = this.legalMoves(s);
    return order
      .map((c) => legal.find((m) => colOf(m.to, COLS) === c))
      .filter((m): m is GameMove => m !== undefined);
  },

  cells(s) {
    return s.board.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: GLYPHS[owner] }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 2, randomness: 0.45, timeMs: 200 },
    { id: "medium", name: "Medium", depth: 5, randomness: 0.12, timeMs: 600 },
    { id: "hard", name: "Hard", depth: 8, randomness: 0, timeMs: 1200 },
  ],
};
