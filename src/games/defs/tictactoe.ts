import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";

export interface TttState {
  board: (Player | null)[]; // length 9, index = row*3 + col, row 0 on top
  turn: Player;
}

const LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

const GLYPHS: [string, string] = ["✕", "◯"];

function winner(board: (Player | null)[]): Player | null {
  for (const [a, b, c] of LINES) {
    if (board[a] !== null && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export const ticTacToe: GameDefinition<TttState> = {
  id: "tic-tac-toe",
  name: "Tic-Tac-Toe",
  icon: "⭕",
  blurb: "Three in a row on a 3×3 grid. The friendly classic.",
  players: ["Crosses", "Noughts"],
  geometry: { kind: "grid", cols: 3, rows: 3 },
  interaction: "place",
  rules:
    "Take turns placing your mark. First to line up three in a row — across, down, or diagonally — wins. Fill the board with no line for a draw.",

  initial: () => ({ board: Array(9).fill(null), turn: 0 }),
  currentPlayer: (s) => s.turn,

  legalMoves(s) {
    const moves: GameMove[] = [];
    for (let i = 0; i < 9; i++) if (s.board[i] === null) moves.push({ id: `p${i}`, to: i });
    return moves;
  },

  applyMove(s, m) {
    const board = s.board.slice();
    board[m.to] = s.turn;
    return { board, turn: s.turn === 0 ? 1 : 0 };
  },

  status(s): GameStatus {
    const w = winner(s.board);
    if (w !== null) return { over: true, winner: w, reason: "three in a row" };
    if (s.board.every((c) => c !== null)) return { over: true, winner: null, reason: "board full" };
    return { over: false };
  },

  evaluate(s, player) {
    const w = winner(s.board);
    if (w !== null) return w === player ? 1000 : -1000;
    // Count lines still winnable, weighted by how full they are.
    let score = 0;
    for (const line of LINES) {
      const cells = line.map((i) => s.board[i]);
      const me = cells.filter((c) => c === player).length;
      const opp = cells.filter((c) => c !== null && c !== player).length;
      if (me > 0 && opp === 0) score += me * me;
      else if (opp > 0 && me === 0) score -= opp * opp;
    }
    return score;
  },

  cells(s) {
    return s.board.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: GLYPHS[owner] }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 1, randomness: 0.55, timeMs: 50 },
    { id: "medium", name: "Medium", depth: 4, randomness: 0.2, timeMs: 100 },
    { id: "perfect", name: "Perfect", depth: 9, randomness: 0, timeMs: 500 },
  ],
};
