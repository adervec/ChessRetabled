import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";

// Fanorona (Fanoron-Tsivy): the 5×9 Malagasy board of the tetrakis tiling.
// "Strong" intersections — where (col+row) is even — also carry the two
// diagonals, so a stone there moves in eight directions; "weak" ones only four.
// A move steps one point along a line. Captures are by APPROACH (step toward an
// enemy line) or WITHDRAWAL (step away from one); either takes the whole
// unbroken run of enemy stones along that line. Captures are compulsory, and the
// same stone may keep capturing — but never twice running in the same direction
// and never back onto a point it already touched. Take every enemy stone to win.
const COLS = 9, ROWS = 5, N = COLS * ROWS;
const PLY_CAP = 400; // ponytail: termination backstop; capture-heavy games end sooner, draw otherwise
const MAX_DEPTH = 8, MAX_SEQ = 4000; // ponytail: bound capture-chain enumeration so search stays finite

export interface FanoronaState {
  board: (Player | null)[]; // length 45; 0 = bottom (rows 3,4), 1 = top (rows 0,1)
  turn: Player;
  ply: number;
}

const DXY: [number, number][] = [
  [1, 0], [-1, 0], [0, -1], [0, 1], // orthogonal
  [1, 1], [1, -1], [-1, 1], [-1, -1], // diagonal (strong points only)
];
const idx = (c: number, r: number) => r * COLS + c;
const inB = (c: number, r: number) => c >= 0 && c < COLS && r >= 0 && r < ROWS;
const strong = (c: number, r: number) => (c + r) % 2 === 0;
const other = (p: Player): Player => (p === 0 ? 1 : 0);

/** The unbroken run of enemy stones starting at (c,r) heading (dc,dr). */
function captureLine(board: (Player | null)[], c: number, r: number, dc: number, dr: number, enemy: Player): number[] {
  const out: number[] = [];
  let cc = c, rr = r;
  while (inB(cc, rr) && board[idx(cc, rr)] === enemy) { out.push(idx(cc, rr)); cc += dc; rr += dr; }
  return out;
}

interface Seq { to: number; landings: number[]; captured: number[] }

function explore(
  board: (Player | null)[], pos: number, turn: Player, enemy: Player,
  visited: Set<number>, lastDir: number, capAcc: number[], landAcc: number[], out: Seq[], depth: number,
): void {
  if (depth >= MAX_DEPTH || out.length >= MAX_SEQ) return;
  const pc = pos % COLS, pr = Math.floor(pos / COLS);
  for (let di = 0; di < DXY.length; di++) {
    if (di === lastDir) continue; // no two consecutive steps in the same direction
    const [dc, dr] = DXY[di];
    if (di >= 4 && !strong(pc, pr)) continue; // diagonals only from strong points
    const bc = pc + dc, br = pr + dr;
    if (!inB(bc, br)) continue;
    const B = idx(bc, br);
    if (board[B] !== null || visited.has(B)) continue; // must step onto an empty, unvisited point
    const approach = captureLine(board, bc + dc, br + dr, dc, dr, enemy);
    const withdraw = captureLine(board, pc - dc, pr - dr, -dc, -dr, enemy);
    for (const captured of [approach, withdraw]) {
      if (captured.length === 0) continue;
      const nb = board.slice();
      nb[pos] = null; nb[B] = turn;
      for (const x of captured) nb[x] = null;
      const landings = [...landAcc, B], caps = [...capAcc, ...captured];
      out.push({ to: B, landings, captured: caps });
      const nv = new Set(visited); nv.add(B);
      explore(nb, B, turn, enemy, nv, di, caps, landings, out, depth + 1);
    }
  }
}

function captureMoves(board: (Player | null)[], turn: Player): GameMove[] {
  const enemy = other(turn);
  const seen = new Set<string>();
  const moves: GameMove[] = [];
  for (let i = 0; i < N; i++) {
    if (board[i] !== turn) continue;
    const out: Seq[] = [];
    explore(board, i, turn, enemy, new Set([i]), -1, [], [], out, 0);
    for (const s of out) {
      const key = `${i}-${s.to}-${[...s.captured].sort((a, b) => a - b).join(".")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      moves.push({ id: key, from: i, to: s.to, path: s.landings.slice(0, -1), affected: s.captured });
    }
  }
  return moves;
}

function paikaMoves(board: (Player | null)[], turn: Player): GameMove[] {
  const out: GameMove[] = [];
  for (let i = 0; i < N; i++) {
    if (board[i] !== turn) continue;
    const c = i % COLS, r = Math.floor(i / COLS);
    for (let di = 0; di < DXY.length; di++) {
      const [dc, dr] = DXY[di];
      if (di >= 4 && !strong(c, r)) continue;
      const nc = c + dc, nr = r + dr;
      if (inB(nc, nr) && board[idx(nc, nr)] === null) out.push({ id: `p${i}-${idx(nc, nr)}`, from: i, to: idx(nc, nr), affected: [] });
    }
  }
  return out;
}

function allMoves(board: (Player | null)[], turn: Player): GameMove[] {
  const caps = captureMoves(board, turn); // compulsory when available
  return caps.length ? caps : paikaMoves(board, turn);
}

function count(board: (Player | null)[], p: Player): number {
  let n = 0;
  for (const x of board) if (x === p) n++;
  return n;
}

export const fanorona: GameDefinition<FanoronaState> = {
  id: "fanorona",
  name: "Fanorona",
  icon: "🇲🇬",
  blurb: "Madagascar's national game — capture by approach or withdrawal in chains.",
  players: ["Black", "White"],
  geometry: (() => {
    const SP = 70, M = 50;
    const points: { x: number; y: number }[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) points.push({ x: M + c * SP, y: M + r * SP });
    const edges: [number, number][] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (c < COLS - 1) edges.push([idx(c, r), idx(c + 1, r)]);
      if (r < ROWS - 1) edges.push([idx(c, r), idx(c, r + 1)]);
      if (strong(c, r)) { // diagonals fan out from strong points
        if (c < COLS - 1 && r < ROWS - 1) edges.push([idx(c, r), idx(c + 1, r + 1)]);
        if (c > 0 && r < ROWS - 1) edges.push([idx(c, r), idx(c - 1, r + 1)]);
      }
    }
    return { kind: "points", width: M * 2 + (COLS - 1) * SP, height: M * 2 + (ROWS - 1) * SP, points, edges };
  })(),
  pieceShape: "stone",
  pieceColors: ["#2a2540", "#f1e7d2"],
  interaction: "select",
  rules:
    "Stones move one point along a line — eight directions from a strong (diagonal) intersection, four from a weak one. You capture by stepping toward an enemy line (approach) or away from one (withdrawal): the whole unbroken run of enemy stones along that line is taken. Capturing is compulsory, and the same stone may keep capturing in a chain, but it may never repeat its previous direction or land on a point it has already used. When you cannot capture, you make a single quiet 'paika' step. Capture every enemy stone to win.",

  initial() {
    const board: (Player | null)[] = Array(N).fill(null);
    for (let c = 0; c < COLS; c++) {
      board[idx(c, 0)] = 1; board[idx(c, 1)] = 1; // White home (top)
      board[idx(c, 3)] = 0; board[idx(c, 4)] = 0; // Black home (bottom)
    }
    // Middle row: centrally symmetric (180° rotation swaps colours), centre empty.
    const mid: (Player | null)[] = [0, 1, 0, 1, null, 0, 1, 0, 1];
    for (let c = 0; c < COLS; c++) board[idx(c, 2)] = mid[c];
    return { board, turn: 0, ply: 0 };
  },
  currentPlayer: (s) => s.turn,

  legalMoves: (s) => allMoves(s.board, s.turn),
  candidateMoves: (s) => allMoves(s.board, s.turn),

  applyMove(s, m) {
    const board = s.board.slice();
    board[m.from!] = null;
    for (const cap of m.affected ?? []) board[cap] = null;
    board[m.to] = s.turn; // final landing (intermediate landings end up empty)
    return { board, turn: other(s.turn), ply: s.ply + 1 };
  },

  status(s): GameStatus {
    if (count(s.board, 1) === 0) return { over: true, winner: 0, reason: "captured every stone" };
    if (count(s.board, 0) === 0) return { over: true, winner: 1, reason: "captured every stone" };
    if (allMoves(s.board, s.turn).length === 0) return { over: true, winner: other(s.turn), reason: "no moves left" };
    if (s.ply >= PLY_CAP) return { over: true, winner: null, reason: "move limit" };
    return { over: false };
  },

  evaluate(s, player) {
    const opp = other(player);
    const mat = (count(s.board, player) - count(s.board, opp)) * 100;
    const threat = captureMoves(s.board, s.turn).reduce((m, mv) => Math.max(m, mv.affected?.length ?? 0), 0);
    return mat + threat * (s.turn === player ? 3 : -3);
  },

  cells(s) {
    return s.board.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: owner === 0 ? "⚫" : "⚪" }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 2, randomness: 0.4, timeMs: 400 },
    { id: "medium", name: "Medium", depth: 3, randomness: 0.12, timeMs: 1100 },
    { id: "hard", name: "Hard", depth: 5, randomness: 0, timeMs: 2200 },
  ],
};
