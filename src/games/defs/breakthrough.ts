import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";
import { idx } from "../core/grid.ts";

// Breakthrough: a modern abstract on an 8×8 board. Each side starts with two
// rows of pawns. A pawn steps one square straight or diagonally forward into an
// empty square, but captures ONLY diagonally forward (never straight ahead).
// First pawn to reach the far edge wins; trapping the opponent with no move also
// wins. Pure race — no draws.
const N = 8;

export interface BreakthroughState {
  board: (Player | null)[]; // length 64, row 0 on top; 0 = Light (bottom, up), 1 = Dark (top, down)
  turn: Player;
}

function inBoard(c: number, r: number): boolean {
  return c >= 0 && c < N && r >= 0 && r < N;
}
function forward(owner: Player): number {
  return owner === 0 ? -1 : 1; // 0 marches up (row-), 1 marches down (row+)
}
function goalRow(owner: Player): number {
  return owner === 0 ? 0 : N - 1;
}

function movesFor(board: (Player | null)[], turn: Player): GameMove[] {
  const out: GameMove[] = [];
  const dr = forward(turn);
  const enemy: Player = turn === 0 ? 1 : 0;
  for (let i = 0; i < N * N; i++) {
    if (board[i] !== turn) continue;
    const c = i % N, r = Math.floor(i / N);
    const nr = r + dr;
    if (!inBoard(c, nr)) continue;
    // Straight ahead: only into an empty square (no straight capture).
    if (board[idx(c, nr, N)] === null) out.push({ id: `${i}-${idx(c, nr, N)}`, from: i, to: idx(c, nr, N), affected: [] });
    // Diagonals: into an empty square or onto an enemy (capture).
    for (const dc of [-1, 1]) {
      const nc = c + dc;
      if (!inBoard(nc, nr)) continue;
      const t = idx(nc, nr, N);
      if (board[t] === null) out.push({ id: `${i}-${t}`, from: i, to: t, affected: [] });
      else if (board[t] === enemy) out.push({ id: `${i}-${t}x`, from: i, to: t, affected: [t] });
    }
  }
  return out;
}

function reachedGoal(board: (Player | null)[]): Player | null {
  for (let c = 0; c < N; c++) {
    if (board[idx(c, goalRow(0), N)] === 0) return 0;
    if (board[idx(c, goalRow(1), N)] === 1) return 1;
  }
  return null;
}

export const breakthrough: GameDefinition<BreakthroughState> = {
  id: "breakthrough",
  name: "Breakthrough",
  icon: "🛡",
  blurb: "Race a pawn to the far edge — step forward, capture only on the diagonal.",
  players: ["Light", "Dark"],
  geometry: { kind: "grid", cols: N, rows: N, checkered: true },
  pieceShape: "stone",
  pieceColors: ["#e6c84f", "#3a3550"],
  interaction: "select",
  rules:
    "Each pawn moves one square forward — straight or diagonal — into an empty square, but it can only capture diagonally forward, never straight ahead. There are no draws: the first player to land a pawn on the opponent's back row wins, and so does anyone who leaves the opponent with no legal move.",

  initial() {
    const board: (Player | null)[] = Array(N * N).fill(null);
    for (let c = 0; c < N; c++) {
      board[idx(c, 0, N)] = 1; board[idx(c, 1, N)] = 1; // Dark home rows (top)
      board[idx(c, N - 1, N)] = 0; board[idx(c, N - 2, N)] = 0; // Light home rows (bottom)
    }
    return { board, turn: 0 };
  },
  currentPlayer: (s) => s.turn,

  legalMoves: (s) => movesFor(s.board, s.turn),

  applyMove(s, m) {
    const board = s.board.slice();
    board[m.from!] = null;
    board[m.to] = s.turn; // overwrites a captured enemy if present
    return { board, turn: s.turn === 0 ? 1 : 0 };
  },

  status(s): GameStatus {
    const reached = reachedGoal(s.board);
    if (reached !== null) return { over: true, winner: reached, reason: "reached the far edge" };
    if (movesFor(s.board, s.turn).length === 0)
      return { over: true, winner: s.turn === 0 ? 1 : 0, reason: "no moves left" };
    return { over: false };
  },

  evaluate(s, player) {
    let score = 0;
    for (let i = 0; i < N * N; i++) {
      const p = s.board[i];
      if (p === null) continue;
      const r = Math.floor(i / N);
      const adv = p === 0 ? N - 1 - r : r; // squares marched toward the goal
      const v = 100 + adv * adv; // closing on the goal grows sharply
      score += p === player ? v : -v;
    }
    return score;
  },

  cells(s) {
    return s.board.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: owner === 0 ? "🟡" : "🟣" }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 2, randomness: 0.4, timeMs: 300 },
    { id: "medium", name: "Medium", depth: 4, randomness: 0.12, timeMs: 800 },
    { id: "hard", name: "Hard", depth: 6, randomness: 0, timeMs: 1600 },
  ],
};
