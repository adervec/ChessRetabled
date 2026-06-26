import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";
import { idx } from "../core/grid.ts";

// Lines of Action: 8×8. A piece slides in a straight line exactly as many
// squares as there are pieces (either colour) on that whole line. It may leap
// its own pieces but not the enemy's, and may capture by landing on an enemy.
// You win the instant all of your pieces form one connected group (king-move
// adjacency). If a move connects both sides, the mover wins.
const N = 8;
const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];

const PLY_CAP = 300; // ponytail: termination backstop; real games end far sooner, draw if not

export interface LoaState {
  board: (Player | null)[]; // length 64; 0 = Black (top/bottom edges), 1 = White (left/right edges)
  turn: Player;
  ply: number;
}

function inBoard(c: number, r: number): boolean {
  return c >= 0 && c < N && r >= 0 && r < N;
}
function other(p: Player): Player {
  return p === 0 ? 1 : 0;
}

/** Pieces (either colour) on the full line through (c,r) in orientation (dc,dr). */
function lineCount(board: (Player | null)[], c: number, r: number, dc: number, dr: number): number {
  let n = 1;
  for (const s of [1, -1]) {
    let cc = c + dc * s, rr = r + dr * s;
    while (inBoard(cc, rr)) {
      if (board[idx(cc, rr, N)] !== null) n++;
      cc += dc * s; rr += dr * s;
    }
  }
  return n;
}

function movesFor(board: (Player | null)[], turn: Player): GameMove[] {
  const enemy = other(turn);
  const out: GameMove[] = [];
  for (let i = 0; i < N * N; i++) {
    if (board[i] !== turn) continue;
    const c = i % N, r = Math.floor(i / N);
    for (const [dc, dr] of DIRS) {
      const dist = lineCount(board, c, r, dc, dr);
      const tc = c + dc * dist, tr = r + dr * dist;
      if (!inBoard(tc, tr)) continue;
      const dest = idx(tc, tr, N);
      if (board[dest] === turn) continue; // can't land on your own
      let blocked = false;
      for (let k = 1; k < dist; k++) {
        if (board[idx(c + dc * k, r + dr * k, N)] === enemy) { blocked = true; break; } // can't leap enemy
      }
      if (blocked) continue;
      out.push({ id: `${i}-${dest}`, from: i, to: dest, affected: board[dest] === enemy ? [dest] : [] });
    }
  }
  return out;
}

/** Number of connected groups of `player`'s pieces (≤1 piece counts as connected). */
function groupsOf(board: (Player | null)[], player: Player): { groups: number; total: number; spread: number } {
  const own: number[] = [];
  for (let i = 0; i < N * N; i++) if (board[i] === player) own.push(i);
  if (own.length === 0) return { groups: 0, total: 0, spread: 0 };
  const seen = new Set<number>();
  let groups = 0;
  for (const start of own) {
    if (seen.has(start)) continue;
    groups++;
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const i = stack.pop()!;
      const c = i % N, r = Math.floor(i / N);
      for (const [dc, dr] of DIRS) {
        const nc = c + dc, nr = r + dr;
        if (!inBoard(nc, nr)) continue;
        const n = idx(nc, nr, N);
        if (board[n] === player && !seen.has(n)) { seen.add(n); stack.push(n); }
      }
    }
  }
  // Spread: total Chebyshev distance of pieces from their centroid (lower = tighter).
  let sc = 0, sr = 0;
  for (const i of own) { sc += i % N; sr += Math.floor(i / N); }
  const cc = sc / own.length, cr = sr / own.length;
  let spread = 0;
  for (const i of own) spread += Math.max(Math.abs((i % N) - cc), Math.abs(Math.floor(i / N) - cr));
  return { groups, total: own.length, spread };
}

export const loa: GameDefinition<LoaState> = {
  id: "loa",
  name: "Lines of Action",
  icon: "🧲",
  blurb: "Slide pieces along lines and pull them into one connected group to win.",
  players: ["Black", "White"],
  geometry: { kind: "grid", cols: N, rows: N, checkered: true },
  pieceShape: "disc",
  pieceColors: ["#2a2540", "#f1e7d2"],
  interaction: "select",
  rules:
    "On your turn a piece slides in a straight line — orthogonally or diagonally — exactly as many squares as there are pieces (yours and your opponent's) on that entire line. You may jump over your own pieces but not the enemy's, and you capture by landing on an enemy piece. You win the moment all of your pieces are joined into one single group, counting diagonal touches. If one move connects both armies, the player who moved wins.",

  initial() {
    const board: (Player | null)[] = Array(N * N).fill(null);
    for (let k = 1; k < N - 1; k++) {
      board[idx(k, 0, N)] = 0; board[idx(k, N - 1, N)] = 0; // Black on top & bottom edges
      board[idx(0, k, N)] = 1; board[idx(N - 1, k, N)] = 1; // White on left & right edges
    }
    return { board, turn: 0, ply: 0 };
  },
  currentPlayer: (s) => s.turn,

  legalMoves: (s) => movesFor(s.board, s.turn),

  applyMove(s, m) {
    const board = s.board.slice();
    board[m.from!] = null;
    board[m.to] = s.turn; // overwrites a captured enemy
    return { board, turn: other(s.turn), ply: s.ply + 1 };
  },

  status(s): GameStatus {
    const mover = other(s.turn); // the side that just moved wins ties
    if (groupsOf(s.board, mover).groups <= 1) return { over: true, winner: mover, reason: "all pieces connected" };
    if (groupsOf(s.board, s.turn).groups <= 1) return { over: true, winner: s.turn, reason: "all pieces connected" };
    if (movesFor(s.board, s.turn).length === 0) return { over: true, winner: mover, reason: "no moves left" };
    if (s.ply >= PLY_CAP) return { over: true, winner: null, reason: "move limit" };
    return { over: false };
  },

  evaluate(s, player) {
    const opp = other(player);
    const me = groupsOf(s.board, player);
    const them = groupsOf(s.board, opp);
    const quality = (g: { groups: number; spread: number }) => -(g.groups * 40) - g.spread * 3;
    return quality(me) - quality(them);
  },

  cells(s) {
    return s.board.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: owner === 0 ? "⚫" : "⚪" }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 2, randomness: 0.4, timeMs: 300 },
    { id: "medium", name: "Medium", depth: 4, randomness: 0.12, timeMs: 900 },
    { id: "hard", name: "Hard", depth: 6, randomness: 0, timeMs: 1800 },
  ],
};
