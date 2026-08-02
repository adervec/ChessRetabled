import type { BoardGeometry, CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";

// Hex: place a stone on any empty cell of an 11×11 rhombus. Blue links the top
// and bottom edges; Red links the left and right edges. Hex can never end in a
// draw — exactly one player always completes a connection. No captures, no
// movement; pure connection.
const N = 11;

export interface HexState {
  board: (Player | null)[]; // length N*N, axial grid (row*N + col)
  turn: Player;
}

// The six axial neighbours of a hex cell.
const HEX: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

function neighbours(i: number): number[] {
  const c = i % N, r = Math.floor(i / N);
  const out: number[] = [];
  for (const [dc, dr] of HEX) {
    const nc = c + dc, nr = r + dr;
    if (nc >= 0 && nc < N && nr >= 0 && nr < N) out.push(nr * N + nc);
  }
  return out;
}

/** Cells on a player's two home edges. 0 joins top↔bottom (rows), 1 joins left↔right (cols). */
function edges(player: Player): [number[], number[]] {
  const a: number[] = [], b: number[] = [];
  for (let k = 0; k < N; k++) {
    if (player === 0) { a.push(k); b.push((N - 1) * N + k); } // row 0 and row N-1
    else { a.push(k * N); b.push(k * N + (N - 1)); } // col 0 and col N-1
  }
  return [a, b];
}

/** Is `player` connected edge-to-edge through their own stones? */
function connected(board: (Player | null)[], player: Player): boolean {
  const [start, goal] = edges(player);
  const goalSet = new Set(goal);
  const seen = new Set<number>();
  const stack = start.filter((i) => board[i] === player);
  for (const s of stack) seen.add(s);
  while (stack.length) {
    const i = stack.pop()!;
    if (goalSet.has(i)) return true;
    for (const n of neighbours(i)) {
      if (board[n] === player && !seen.has(n)) { seen.add(n); stack.push(n); }
    }
  }
  return false;
}

/** 0–1 BFS distances from one home edge: cost 0 to pass own stones, 1 per empty, enemy blocks. */
function bfsFrom(board: (Player | null)[], player: Player, startEdge: number[]): number[] {
  const dist = new Array<number>(N * N).fill(Infinity);
  const deque: number[] = [];
  const enter = (i: number) => (board[i] === player ? 0 : 1);
  for (const i of startEdge) {
    if (board[i] !== null && board[i] !== player) continue;
    const d = enter(i);
    if (d < dist[i]) { dist[i] = d; if (d === 0) deque.unshift(i); else deque.push(i); }
  }
  while (deque.length) {
    const i = deque.shift()!;
    for (const n of neighbours(i)) {
      if (board[n] !== null && board[n] !== player) continue; // enemy stone blocks
      const nd = dist[i] + enter(n);
      if (nd < dist[n]) { dist[n] = nd; if (enter(n) === 0) deque.unshift(n); else deque.push(n); }
    }
  }
  return dist;
}

/**
 * Connection potential: `dist` = empty cells still needed to connect (0 = won),
 * `width` = how many empty cells lie on *some* shortest connecting path. Wider is
 * stronger — more independent threats, fewer of which a single block can kill. The
 * two distinguish the many positions that tie on distance alone.
 */
function potential(board: (Player | null)[], player: Player): { dist: number; width: number } {
  const [e1, e2] = edges(player);
  const dA = bfsFrom(board, player, e1);
  const dB = bfsFrom(board, player, e2);
  let dist = Infinity;
  for (const i of e2) dist = Math.min(dist, dA[i]);
  if (dist === Infinity) return { dist: Infinity, width: 0 };
  let width = 0;
  for (let i = 0; i < N * N; i++) {
    if (board[i] !== null) continue; // only empty cells we'd place on count as threats
    if (dA[i] + dB[i] - 1 === dist) width++; // on a shortest path (−1 corrects the double count)
  }
  return { dist, width };
}

const GEOMETRY: BoardGeometry = (() => {
  const SP = 36, RISE = SP * 0.866, M = 34;
  const points: { x: number; y: number }[] = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) points.push({ x: M + (c + r * 0.5) * SP, y: M + r * RISE });
  const edgeList: [number, number][] = [];
  for (let i = 0; i < N * N; i++)
    for (const [dc, dr] of [[1, 0], [0, 1], [-1, 1]] as [number, number][]) {
      const c = i % N + dc, r = Math.floor(i / N) + dr;
      if (c >= 0 && c < N && r >= 0 && r < N) edgeList.push([i, r * N + c]);
    }
  const width = M * 2 + (N - 1 + (N - 1) * 0.5) * SP;
  const height = M * 2 + (N - 1) * RISE;
  return { kind: "points", width, height, points, edges: edgeList };
})();

export const hex: GameDefinition<HexState> = {
  id: "hex",
  name: "Hex",
  icon: "⬡",
  blurb: "Connect your two edges across the rhombus. There are no draws in Hex.",
  players: ["Blue", "Red"],
  geometry: GEOMETRY,
  pieceShape: "stone",
  pieceColors: ["#3b82f6", "#e0533d"],
  interaction: "place",
  rules:
    "Take turns placing one stone on any empty cell. Blue wins by linking the top and bottom edges with an unbroken chain of blue stones; Red wins by linking the left and right edges. Stones never move or get captured, and because of how the board interlocks, the game can never be a draw — somebody always connects.",

  initial: () => ({ board: Array(N * N).fill(null), turn: 0 }),
  currentPlayer: (s) => s.turn,

  legalMoves(s) {
    const out: GameMove[] = [];
    for (let i = 0; i < N * N; i++) if (s.board[i] === null) out.push({ id: `h${i}`, to: i });
    return out;
  },

  candidateMoves(s) {
    const near = new Set<number>();
    for (let i = 0; i < N * N; i++)
      if (s.board[i] !== null) for (const n of neighbours(i)) if (s.board[n] === null) near.add(n);
    if (near.size === 0) return [{ id: `h${Math.floor((N * N) / 2)}`, to: Math.floor((N * N) / 2) }];
    return [...near].map((i) => ({ id: `h${i}`, to: i }));
  },

  applyMove(s, m) {
    const board = s.board.slice();
    board[m.to] = s.turn;
    return { board, turn: s.turn === 0 ? 1 : 0 };
  },

  status(s): GameStatus {
    if (connected(s.board, 0)) return { over: true, winner: 0, reason: "connected top to bottom" };
    if (connected(s.board, 1)) return { over: true, winner: 1, reason: "connected left to right" };
    return { over: false };
  },

  evaluate(s, player) {
    const opp: Player = player === 0 ? 1 : 0;
    const me = potential(s.board, player);
    const them = potential(s.board, opp);
    if (me.dist === 0) return 100000;
    if (them.dist === 0) return -100000;
    // Distance dominates; among equal distances the wider (more-threatening)
    // connection wins, and the side to move breaks remaining ties.
    return (them.dist - me.dist) * 100 + (me.width - them.width) * 3 + (s.turn === player ? 5 : -5);
  },

  cells(s) {
    return s.board.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: owner === 0 ? "🔵" : "🔴" }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 1, randomness: 0.4, timeMs: 300 },
    { id: "medium", name: "Medium", depth: 2, randomness: 0.12, timeMs: 900 },
    { id: "hard", name: "Hard", depth: 3, randomness: 0, timeMs: 1800 },
  ],
};
