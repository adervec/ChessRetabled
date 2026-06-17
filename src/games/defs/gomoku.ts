import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";
import { hasKInARow, idx } from "../core/grid.ts";

const N = 15;
const K = 5;
const GLYPHS: [string, string] = ["⚫", "⚪"];
const AI_LIMIT = 14;

export interface GomokuState {
  board: (Player | null)[]; // length 225, row 0 on top
  turn: Player; // 0 = Black moves first
}

const DIRS: [number, number][] = [[1, 0], [0, 1], [1, 1], [1, -1]];

function at(board: (Player | null)[], c: number, r: number): Player | null {
  if (c < 0 || c >= N || r < 0 || r >= N) return null;
  return board[idx(c, r, N)];
}

function winner(board: (Player | null)[]): Player | null {
  for (const p of [0, 1] as Player[]) {
    if (hasKInARow(N, N, K, p, (c, r) => at(board, c, r))) return p;
  }
  return null;
}

function runScore(len: number, openEnds: number): number {
  if (len >= K) return 1_000_000;
  if (len === 4) return openEnds === 2 ? 100_000 : openEnds === 1 ? 10_000 : 0;
  if (len === 3) return openEnds === 2 ? 1_000 : openEnds === 1 ? 100 : 0;
  if (len === 2) return openEnds === 2 ? 50 : openEnds === 1 ? 8 : 0;
  if (len === 1) return openEnds === 2 ? 2 : 0;
  return 0;
}

/** Total pattern score for `player` across the whole board. */
function lineScore(board: (Player | null)[], player: Player): number {
  let score = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (at(board, c, r) !== player) continue;
      for (const [dc, dr] of DIRS) {
        if (at(board, c - dc, r - dr) === player) continue; // not run start
        let len = 1;
        let cc = c + dc;
        let rr = r + dr;
        while (at(board, cc, rr) === player) { len++; cc += dc; rr += dr; }
        const afterEmpty = at(board, cc, rr) === null ? 1 : 0;
        const beforeEmpty = at(board, c - dc, r - dr) === null ? 1 : 0;
        score += runScore(len, afterEmpty + beforeEmpty);
      }
    }
  }
  return score;
}

/** Value of placing `player`'s stone at `cell` (the 4 lines through it). */
function scoreThrough(board: (Player | null)[], cell: number, player: Player): number {
  const c0 = cell % N;
  const r0 = Math.floor(cell / N);
  let score = 0;
  for (const [dc, dr] of DIRS) {
    let len = 1;
    let cc = c0 + dc, rr = r0 + dr;
    while (at(board, cc, rr) === player) { len++; cc += dc; rr += dr; }
    const aEmpty = at(board, cc, rr) === null ? 1 : 0;
    cc = c0 - dc; rr = r0 - dr;
    while (at(board, cc, rr) === player) { len++; cc += dc; rr += dr; }
    const bEmpty = at(board, cc, rr) === null ? 1 : 0;
    score += runScore(len, aEmpty + bEmpty);
  }
  return score;
}

function hasNeighbor(board: (Player | null)[], c: number, r: number, dist: number): boolean {
  for (let dr = -dist; dr <= dist; dr++) {
    for (let dc = -dist; dc <= dist; dc++) {
      if (dc === 0 && dr === 0) continue;
      if (at(board, c + dc, r + dr) !== null) return true;
    }
  }
  return false;
}

export const gomoku: GameDefinition<GomokuState> = {
  id: "gomoku",
  name: "Gomoku",
  icon: "⚫",
  blurb: "Five stones in an unbroken row on a 15×15 grid. Simple, deep, ruthless.",
  players: ["Black", "White"],
  geometry: { kind: "grid", cols: N, rows: N },
  interaction: "place",
  rules:
    "Place a stone on any empty point. The first player to get five of their stones in an unbroken row — horizontally, vertically, or diagonally — wins.",

  initial: () => ({ board: Array(N * N).fill(null), turn: 0 }),
  currentPlayer: (s) => s.turn,

  legalMoves(s) {
    const moves: GameMove[] = [];
    for (let i = 0; i < N * N; i++) if (s.board[i] === null) moves.push({ id: `p${i}`, to: i });
    return moves;
  },

  candidateMoves(s) {
    const opp: Player = s.turn === 0 ? 1 : 0;
    const empties: number[] = [];
    let anyStone = false;
    for (let i = 0; i < N * N; i++) if (s.board[i] !== null) { anyStone = true; break; }
    if (!anyStone) return [{ id: `p${idx(7, 7, N)}`, to: idx(7, 7, N) }]; // center

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const i = idx(c, r, N);
        if (s.board[i] === null && hasNeighbor(s.board, c, r, 2)) empties.push(i);
      }
    }
    const scored = empties.map((i) => ({
      i,
      // attack value + slightly discounted defensive value
      v: scoreThrough(s.board, i, s.turn) + 0.9 * scoreThrough(s.board, i, opp),
    }));
    scored.sort((a, b) => b.v - a.v);
    return scored.slice(0, AI_LIMIT).map((x) => ({ id: `p${x.i}`, to: x.i }));
  },

  applyMove(s, m) {
    const board = s.board.slice();
    board[m.to] = s.turn;
    return { board, turn: s.turn === 0 ? 1 : 0 };
  },

  status(s): GameStatus {
    const w = winner(s.board);
    if (w !== null) return { over: true, winner: w, reason: "five in a row" };
    if (s.board.every((c) => c !== null)) return { over: true, winner: null, reason: "board full" };
    return { over: false };
  },

  evaluate(s, player) {
    const opp: Player = player === 0 ? 1 : 0;
    return lineScore(s.board, player) - 1.05 * lineScore(s.board, opp);
  },

  cells(s) {
    return s.board.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: GLYPHS[owner] }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 1, randomness: 0.35, timeMs: 300 },
    { id: "medium", name: "Medium", depth: 3, randomness: 0.05, timeMs: 800 },
    { id: "hard", name: "Hard", depth: 5, randomness: 0, timeMs: 1600 },
  ],
};
