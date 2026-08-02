import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";
import { idx } from "../core/grid.ts";

// Kōnane (Hawaiian checkers): an 8×8 board filled with alternating black and
// white stones. Black lifts one stone from a corner or the centre, then White
// lifts a stone orthogonally next to that hole. After that every move is a jump:
// hop orthogonally over an adjacent enemy into the empty space beyond, capturing
// it, and you may keep hopping in the SAME straight line. The first player with
// no jump loses. Only captures — no quiet moves — so material falls every turn.
const N = 8;

export interface KonaneState {
  board: (Player | null)[]; // length 64, row 0 on top; 0 = Black, 1 = White
  turn: Player;
  opened: number; // 0 = Black to lift, 1 = White to lift, 2 = normal jump play
}

const ORTHO: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function inBoard(c: number, r: number): boolean {
  return c >= 0 && c < N && r >= 0 && r < N;
}

/** The canonical Black opening cells: the four corners and four centre squares. */
function openingCells(): number[] {
  const m = N / 2;
  return [
    idx(0, 0, N), idx(N - 1, 0, N), idx(0, N - 1, N), idx(N - 1, N - 1, N),
    idx(m - 1, m - 1, N), idx(m, m - 1, N), idx(m - 1, m, N), idx(m, m, N),
  ];
}

function jumpMoves(board: (Player | null)[], turn: Player): GameMove[] {
  const enemy: Player = turn === 0 ? 1 : 0;
  const out: GameMove[] = [];
  for (let i = 0; i < N * N; i++) {
    if (board[i] !== turn) continue;
    const c0 = i % N, r0 = Math.floor(i / N);
    for (const [dc, dr] of ORTHO) {
      // Walk the straight line, accumulating enemy/empty pairs.
      const captured: number[] = [];
      const landings: number[] = [];
      let c = c0, r = r0;
      while (true) {
        const mc = c + dc, mr = r + dr;
        const lc = c + 2 * dc, lr = r + 2 * dr;
        if (!inBoard(lc, lr)) break;
        const mid = idx(mc, mr, N);
        const land = idx(lc, lr, N);
        if (board[mid] === enemy && board[land] === null) {
          captured.push(mid);
          landings.push(land);
          out.push({
            id: `${i}-${land}-${captured.join(".")}`,
            from: i,
            to: land,
            path: landings.slice(0, -1),
            affected: captured.slice(),
          });
          c = lc; r = lr; // continue jumping in the same direction
        } else break;
      }
    }
  }
  return out;
}

function legal(s: KonaneState): GameMove[] {
  if (s.opened === 0) {
    return openingCells()
      .filter((i) => s.board[i] === 0)
      .map((i) => ({ id: `lift${i}`, to: i, affected: [i] }));
  }
  if (s.opened === 1) {
    const hole = s.board.indexOf(null);
    const c = hole % N, r = Math.floor(hole / N);
    const out: GameMove[] = [];
    for (const [dc, dr] of ORTHO) {
      const nc = c + dc, nr = r + dr;
      if (!inBoard(nc, nr)) continue;
      const i = idx(nc, nr, N);
      if (s.board[i] === 1) out.push({ id: `lift${i}`, to: i, affected: [i] });
    }
    return out;
  }
  return jumpMoves(s.board, s.turn);
}

export const konane: GameDefinition<KonaneState> = {
  id: "konane",
  name: "Kōnane",
  icon: "🌺",
  blurb: "Hawaiian checkers: hop in straight lines to capture, last to move wins.",
  players: ["Black", "White"],
  geometry: { kind: "grid", cols: N, rows: N, checkered: true },
  pieceShape: "stone",
  pieceColors: ["#2a2540", "#f1e7d2"],
  interaction: "select",
  interactionFor: (s) => (s.opened < 2 ? "place" : "select"),
  rules:
    "The board starts full of alternating stones. Black lifts one stone from a corner or the centre, then White lifts a stone next to that gap. After that, every move is a jump: hop orthogonally over an adjacent enemy stone into the empty square beyond to capture it, and you may keep hopping in the same straight line. No diagonal moves and no quiet moves. The first player who cannot jump loses.",

  initial() {
    const board: (Player | null)[] = Array(N * N).fill(null);
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) board[idx(c, r, N)] = (c + r) % 2 === 0 ? 0 : 1;
    return { board, turn: 0, opened: 0 };
  },
  currentPlayer: (s) => s.turn,

  legalMoves: (s) => legal(s),

  applyMove(s, m) {
    const board = s.board.slice();
    if (s.opened < 2) {
      board[m.to] = null; // lift a stone off the board
      return { board, turn: s.turn === 0 ? 1 : 0, opened: s.opened + 1 };
    }
    board[m.from!] = null;
    for (const cap of m.affected ?? []) board[cap] = null;
    board[m.to] = s.turn;
    return { board, turn: s.turn === 0 ? 1 : 0, opened: 2 };
  },

  status(s): GameStatus {
    if (s.opened < 2) return { over: false };
    if (jumpMoves(s.board, s.turn).length === 0)
      return { over: true, winner: s.turn === 0 ? 1 : 0, reason: "no jump available" };
    return { over: false };
  },

  evaluate(s, player) {
    const opp: Player = player === 0 ? 1 : 0;
    let mat = 0;
    for (const c of s.board) {
      if (c === player) mat++;
      else if (c === opp) mat--;
    }
    // Mobility is the real currency in Kōnane — running out of jumps loses.
    const myMob = jumpMoves(s.board, player).length;
    const oppMob = jumpMoves(s.board, opp).length;
    return (myMob - oppMob) * 6 + mat;
  },

  cells(s) {
    return s.board.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: owner === 0 ? "⚫" : "⚪" }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 2, randomness: 0.4, timeMs: 300 },
    { id: "medium", name: "Medium", depth: 5, randomness: 0.12, timeMs: 800 },
    { id: "hard", name: "Hard", depth: 8, randomness: 0, timeMs: 1600 },
  ],
};
