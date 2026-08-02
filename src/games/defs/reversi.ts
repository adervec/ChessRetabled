import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";
import { idx } from "../core/grid.ts";

const N = 8;
const GLYPHS: [string, string] = ["⚫", "⚪"];

export interface ReversiState {
  board: (Player | null)[]; // length 64, row 0 on top
  turn: Player; // 0 = Black moves first
}

const DIRS: [number, number][] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

// Positional weights — corners are gold, the cells next to them are traps.
// prettier-ignore
const WEIGHTS = [
  120, -20,  20,   5,   5,  20, -20, 120,
  -20, -40,  -5,  -5,  -5,  -5, -40, -20,
   20,  -5,  15,   3,   3,  15,  -5,  20,
    5,  -5,   3,   3,   3,   3,  -5,   5,
    5,  -5,   3,   3,   3,   3,  -5,   5,
   20,  -5,  15,   3,   3,  15,  -5,  20,
  -20, -40,  -5,  -5,  -5,  -5, -40, -20,
  120, -20,  20,   5,   5,  20, -20, 120,
];

function flipsFor(board: (Player | null)[], cell: number, player: Player): number[] {
  if (board[cell] !== null) return [];
  const opp: Player = player === 0 ? 1 : 0;
  const col = cell % N;
  const row = Math.floor(cell / N);
  const flips: number[] = [];
  for (const [dc, dr] of DIRS) {
    const line: number[] = [];
    let c = col + dc;
    let r = row + dr;
    while (c >= 0 && c < N && r >= 0 && r < N) {
      const i = idx(c, r, N);
      if (board[i] === opp) line.push(i);
      else if (board[i] === player) {
        if (line.length) flips.push(...line);
        break;
      } else break;
      c += dc;
      r += dr;
    }
  }
  return flips;
}

function movesFor(board: (Player | null)[], player: Player): GameMove[] {
  const moves: GameMove[] = [];
  for (let i = 0; i < N * N; i++) {
    const flips = flipsFor(board, i, player);
    if (flips.length) moves.push({ id: `m${i}`, to: i, affected: flips });
  }
  return moves;
}

export const reversi: GameDefinition<ReversiState> = {
  id: "reversi",
  name: "Reversi",
  icon: "⚫",
  blurb: "Outflank your opponent to flip their discs. Own the board by the end.",
  players: ["Black", "White"],
  geometry: { kind: "grid", cols: N, rows: N },
  pieceShape: "disc",
  pieceColors: ["#2a2540", "#f1e7d2"],
  interaction: "place",
  rules:
    "Place a disc so it traps one or more of your opponent's discs in a straight line between the new disc and another of yours — every trapped disc flips to your colour. No legal move? You pass automatically. Most discs when neither side can move wins.",

  initial() {
    const board: (Player | null)[] = Array(N * N).fill(null);
    board[idx(3, 3, N)] = 1;
    board[idx(4, 4, N)] = 1;
    board[idx(4, 3, N)] = 0;
    board[idx(3, 4, N)] = 0;
    return { board, turn: 0 };
  },
  currentPlayer: (s) => s.turn,

  legalMoves: (s) => movesFor(s.board, s.turn),

  applyMove(s, m) {
    const board = s.board.slice();
    board[m.to] = s.turn;
    for (const i of m.affected ?? []) board[i] = s.turn;
    const opp: Player = s.turn === 0 ? 1 : 0;
    // Skip the opponent if they have no reply; if neither can move it's terminal
    // and `turn` is left unchanged (status() detects the dead position).
    let next = s.turn;
    if (movesFor(board, opp).length) next = opp;
    else if (movesFor(board, s.turn).length) next = s.turn;
    return { board, turn: next };
  },

  status(s): GameStatus {
    if (movesFor(s.board, s.turn).length) return { over: false };
    // current side has no move => (by the applyMove invariant) neither does.
    let b = 0;
    let w = 0;
    for (const c of s.board) {
      if (c === 0) b++;
      else if (c === 1) w++;
    }
    const winner: Player | null = b === w ? null : b > w ? 0 : 1;
    return { over: true, winner, reason: `${b}–${w} discs` };
  },

  evaluate(s, player) {
    const opp: Player = player === 0 ? 1 : 0;
    let pos = 0;
    let mine = 0;
    let theirs = 0;
    for (let i = 0; i < N * N; i++) {
      const c = s.board[i];
      if (c === player) { pos += WEIGHTS[i]; mine++; }
      else if (c === opp) { pos -= WEIGHTS[i]; theirs++; }
    }
    const myMob = movesFor(s.board, player).length;
    const oppMob = movesFor(s.board, opp).length;
    const mobility = (myMob - oppMob) * 10;
    const filled = mine + theirs;
    // Disc count only matters near the end; positional play dominates early.
    const discDiff = filled > 50 ? (mine - theirs) * 8 : (mine - theirs);
    return pos + mobility + discDiff;
  },

  cells(s) {
    return s.board.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: GLYPHS[owner] }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 1, randomness: 0.4, timeMs: 200 },
    { id: "medium", name: "Medium", depth: 3, randomness: 0.1, timeMs: 600 },
    { id: "hard", name: "Hard", depth: 6, randomness: 0, timeMs: 1400 },
  ],
};
