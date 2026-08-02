import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";
import { idx } from "../core/grid.ts";

// Surakarta: 6×6 of intersections, 12 stones each on your two home rows. An
// ordinary move is one step to any empty neighbour (orthogonal or diagonal). A
// capture slides in a STRAIGHT line, turning only where the eight corner loops
// curve one grid line into another; it must round at least one loop and then
// land on the first enemy stone it meets (it may glide over empty points, even
// twice, but may never hop a stone). Only the border lines (the outer circuit)
// and the second-from-edge lines (the inner circuit) carry loops — the two
// centre lines on each axis have none. Capture every enemy stone to win.
const N = 6;
const PLY_CAP = 300; // ponytail: termination backstop; capture games end far sooner, draw otherwise

export interface SurakartaState {
  board: (Player | null)[]; // length 36; 0 = bottom home (rows 4,5), 1 = top home (rows 0,1)
  turn: Player;
  ply: number;
}

// Direction table: 0=E, 1=W, 2=N, 3=S.
const DXY: [number, number][] = [[1, 0], [-1, 0], [0, -1], [0, 1]];
const STEP8: [number, number][] = [[1, 0], [-1, 0], [0, -1], [0, 1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

// Loop transitions: arriving at a line-end heading `dir` and about to leave the
// board, a loop (if present) deposits the stone at `point` heading `ndir`. Outer
// loops turn at the same corner point; inner loops cross to the partner line-end.
const LOOPS: Record<string, { point: number; ndir: number }> = (() => {
  const m: Record<string, { point: number; ndir: number }> = {};
  const P = (c: number, r: number) => idx(c, r, N);
  const add = (c: number, r: number, dir: number, ec: number, er: number, ndir: number) => {
    m[`${P(c, r)},${dir}`] = { point: P(ec, er), ndir };
  };
  // Outer circuit (border lines), exit point == entry corner.
  add(5, 0, 0, 5, 0, 3); add(5, 0, 2, 5, 0, 1); // TR: E→S, N→W
  add(5, 5, 3, 5, 5, 1); add(5, 5, 0, 5, 5, 2); // BR: S→W, E→N
  add(0, 5, 1, 0, 5, 2); add(0, 5, 3, 0, 5, 0); // BL: W→N, S→E
  add(0, 0, 2, 0, 0, 0); add(0, 0, 1, 0, 0, 3); // TL: N→E, W→S
  // Inner circuit (second-from-edge lines), exit crosses to the partner line-end.
  add(1, 0, 2, 0, 1, 0); add(0, 1, 1, 1, 0, 3); // TL: col1↑→row1→E, row1←→col1↓
  add(4, 0, 2, 5, 1, 1); add(5, 1, 0, 4, 0, 3); // TR: col4↑→row1←W, row1→→col4↓
  add(4, 5, 3, 5, 4, 1); add(5, 4, 0, 4, 5, 2); // BR: col4↓→row4←W, row4→→col4↑
  add(1, 5, 3, 0, 4, 0); add(0, 4, 1, 1, 5, 2); // BL: col1↓→row4→E, row4←→col1↑
  return m;
})();

/** All capture destinations reachable from the stone at `from`. */
function captureMoves(board: (Player | null)[], from: number, turn: Player): GameMove[] {
  const enemy: Player = turn === 0 ? 1 : 0;
  const out: GameMove[] = [];
  const occupied = (p: number) => p !== from && board[p] !== null; // the mover's own square is vacated
  for (let d0 = 0; d0 < 4; d0++) {
    let cur = from, dir = d0, loops = 0;
    const seen = new Set<string>();
    while (true) {
      const key = `${cur},${dir}`;
      if (seen.has(key)) break; // came all the way round with nothing to take
      seen.add(key);
      const c = cur % N + DXY[dir][0], r = Math.floor(cur / N) + DXY[dir][1];
      if (c >= 0 && c < N && r >= 0 && r < N) {
        const next = idx(c, r, N);
        if (occupied(next)) {
          if (board[next] === enemy && loops >= 1) out.push({ id: `cap${from}-${next}-${d0}`, from, to: next, affected: [next] });
          break; // first stone met stops the slide either way
        }
        cur = next; // glide over the empty point
      } else {
        const t = LOOPS[`${cur},${dir}`];
        if (!t) break; // a line with no loop at this end — the slide dies
        loops++;
        cur = t.point; dir = t.ndir;
        if (occupied(cur)) { // the loop deposits us straight onto a stone
          if (board[cur] === enemy) out.push({ id: `cap${from}-${cur}-${d0}`, from, to: cur, affected: [cur] });
          break;
        }
      }
    }
  }
  return out;
}

function ordinaryMoves(board: (Player | null)[], from: number): GameMove[] {
  const out: GameMove[] = [];
  const c0 = from % N, r0 = Math.floor(from / N);
  for (const [dc, dr] of STEP8) {
    const c = c0 + dc, r = r0 + dr;
    if (c < 0 || c >= N || r < 0 || r >= N) continue;
    const t = idx(c, r, N);
    if (board[t] === null) out.push({ id: `mv${from}-${t}`, from, to: t });
  }
  return out;
}

function allMoves(board: (Player | null)[], turn: Player): GameMove[] {
  const caps: GameMove[] = [], quiet: GameMove[] = [];
  for (let i = 0; i < N * N; i++) {
    if (board[i] !== turn) continue;
    caps.push(...captureMoves(board, i, turn));
    quiet.push(...ordinaryMoves(board, i));
  }
  return [...caps, ...quiet]; // captures first to help move ordering
}

function pieces(board: (Player | null)[], p: Player): number {
  let n = 0;
  for (const x of board) if (x === p) n++;
  return n;
}

export const surakarta: GameDefinition<SurakartaState> = {
  id: "surakarta",
  name: "Surakarta",
  icon: "🪢",
  blurb: "Indonesian capture game — slide around the corner loops to take a stone.",
  players: ["Red", "Blue"],
  geometry: (() => {
    const points: { x: number; y: number }[] = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) points.push({ x: 60 + c * 96, y: 60 + r * 96 });
    const edges: [number, number][] = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (c < N - 1) edges.push([idx(c, r, N), idx(c + 1, r, N)]);
      if (r < N - 1) edges.push([idx(c, r, N), idx(c, r + 1, N)]);
    }
    return { kind: "points", width: 60 * 2 + (N - 1) * 96, height: 60 * 2 + (N - 1) * 96, points, edges };
  })(),
  pieceShape: "stone",
  pieceColors: ["#d8442a", "#3b82f6"],
  interaction: "select",
  rules:
    "Move one stone per turn. An ordinary move steps to any adjacent empty point, in any of the eight directions. To capture, slide a stone in a straight line along the grid lines, looping around at least one of the eight corner curves, until you reach an enemy stone — which you take. You may glide over empty points (even the same one twice) but can never pass over a stone. The two centre lines on each side carry no loops. Capture all of your opponent's stones to win.",

  initial() {
    const board: (Player | null)[] = Array(N * N).fill(null);
    for (let c = 0; c < N; c++) {
      board[idx(c, 0, N)] = 1; board[idx(c, 1, N)] = 1; // Blue home (top)
      board[idx(c, N - 1, N)] = 0; board[idx(c, N - 2, N)] = 0; // Red home (bottom)
    }
    return { board, turn: 0, ply: 0 };
  },
  currentPlayer: (s) => s.turn,

  legalMoves: (s) => allMoves(s.board, s.turn),
  candidateMoves: (s) => allMoves(s.board, s.turn),

  applyMove(s, m) {
    const board = s.board.slice();
    board[m.from!] = null;
    for (const cap of m.affected ?? []) board[cap] = null;
    board[m.to] = s.turn;
    return { board, turn: s.turn === 0 ? 1 : 0, ply: s.ply + 1 };
  },

  status(s): GameStatus {
    if (pieces(s.board, 1) === 0) return { over: true, winner: 0, reason: "captured every stone" };
    if (pieces(s.board, 0) === 0) return { over: true, winner: 1, reason: "captured every stone" };
    if (allMoves(s.board, s.turn).length === 0) return { over: true, winner: s.turn === 0 ? 1 : 0, reason: "no moves left" };
    if (s.ply >= PLY_CAP) return { over: true, winner: null, reason: "move limit" };
    return { over: false };
  },

  evaluate(s, player) {
    const opp: Player = player === 0 ? 1 : 0;
    const mat = (pieces(s.board, player) - pieces(s.board, opp)) * 100;
    const threat = allMoves(s.board, s.turn).filter((m) => m.affected?.length).length * (s.turn === player ? 2 : -2);
    return mat + threat;
  },

  cells(s) {
    return s.board.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: owner === 0 ? "🔴" : "🔵" }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 2, randomness: 0.4, timeMs: 400 },
    { id: "medium", name: "Medium", depth: 3, randomness: 0.12, timeMs: 1000 },
    { id: "hard", name: "Hard", depth: 4, randomness: 0, timeMs: 2000 },
  ],
};
