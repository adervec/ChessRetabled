import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";
import { idx } from "../core/grid.ts";

// English draughts (American checkers): 8×8, play on dark squares, men capture
// forward only, multi-jumps are mandatory, men promote to kings on the far row,
// and reaching the king row ends the turn.
const N = 8;
const IDLE_DRAW = 80; // plies without a capture or promotion => draw

type Piece = { owner: Player; king: boolean };

export interface CheckersState {
  board: (Piece | null)[]; // length 64, row 0 on top
  turn: Player; // 0 = Red (bottom, moves up), 1 = White (top, moves down)
  idle: number;
}

function playable(c: number, r: number): boolean {
  return (c + r) % 2 === 1;
}
function inBoard(c: number, r: number): boolean {
  return c >= 0 && c < N && r >= 0 && r < N;
}
function kingRow(owner: Player): number {
  return owner === 0 ? 0 : N - 1;
}
/** Diagonal directions [dc, dr] a piece may travel. */
function dirsFor(owner: Player, king: boolean): [number, number][] {
  if (king) return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const dr = owner === 0 ? -1 : 1; // red moves up (row-), white moves down (row+)
  return [[1, dr], [-1, dr]];
}

interface Seq {
  path: number[]; // landing squares, last = final
  captured: number[];
}

function explore(
  board: (Piece | null)[],
  c: number,
  r: number,
  piece: Piece,
  capturedAcc: number[],
  pathAcc: number[],
  out: Seq[]
): void {
  let found = false;
  for (const [dc, dr] of dirsFor(piece.owner, piece.king)) {
    const mc = c + dc, mr = r + dr;
    const lc = c + 2 * dc, lr = r + 2 * dr;
    if (!inBoard(lc, lr) || !playable(lc, lr)) continue;
    const mid = board[idx(mc, mr, N)];
    const land = board[idx(lc, lr, N)];
    if (mid && mid.owner !== piece.owner && land === null) {
      found = true;
      const nb = board.slice();
      nb[idx(c, r, N)] = null;
      nb[idx(mc, mr, N)] = null;
      let nking = piece.king;
      let stop = false;
      if (!piece.king && lr === kingRow(piece.owner)) { nking = true; stop = true; }
      const np: Piece = { owner: piece.owner, king: nking };
      nb[idx(lc, lr, N)] = np;
      const cap2 = [...capturedAcc, idx(mc, mr, N)];
      const path2 = [...pathAcc, idx(lc, lr, N)];
      if (stop) out.push({ path: path2, captured: cap2 });
      else explore(nb, lc, lr, np, cap2, path2, out);
    }
  }
  if (!found && pathAcc.length > 0) out.push({ path: pathAcc, captured: capturedAcc });
}

function genMoves(s: CheckersState): GameMove[] {
  const captures: GameMove[] = [];
  const quiet: GameMove[] = [];
  for (let i = 0; i < N * N; i++) {
    const p = s.board[i];
    if (!p || p.owner !== s.turn) continue;
    const c = i % N, r = Math.floor(i / N);
    const seqs: Seq[] = [];
    explore(s.board, c, r, p, [], [], seqs);
    for (const seq of seqs) {
      const to = seq.path[seq.path.length - 1];
      captures.push({
        id: `${i}-${to}-${seq.captured.join(".")}`,
        from: i,
        to,
        path: seq.path.slice(0, -1),
        affected: seq.captured,
      });
    }
  }
  if (captures.length) return captures; // forced capture

  for (let i = 0; i < N * N; i++) {
    const p = s.board[i];
    if (!p || p.owner !== s.turn) continue;
    const c = i % N, r = Math.floor(i / N);
    for (const [dc, dr] of dirsFor(p.owner, p.king)) {
      const tc = c + dc, tr = r + dr;
      if (!inBoard(tc, tr) || !playable(tc, tr)) continue;
      const t = idx(tc, tr, N);
      if (s.board[t] === null) quiet.push({ id: `${i}-${t}`, from: i, to: t, affected: [] });
    }
  }
  return quiet;
}

export const checkers: GameDefinition<CheckersState> = {
  id: "checkers",
  name: "Checkers",
  icon: "🔴",
  blurb: "English draughts: jump to capture, crown your men, and trap the enemy.",
  players: ["Red", "White"],
  geometry: { kind: "grid", cols: N, rows: N, checkered: true, darkOnly: true },
  interaction: "select",
  rules:
    "Move diagonally forward onto a dark square. Jump an adjacent enemy to capture it — captures are forced, and you must keep jumping with the same piece while you can. Reach the far row to crown a King, which moves and jumps in all four directions. Capture every enemy piece, or leave your opponent with no move, to win.",

  initial() {
    const board: (Piece | null)[] = Array(N * N).fill(null);
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!playable(c, r)) continue;
        if (r <= 2) board[idx(c, r, N)] = { owner: 1, king: false };
        else if (r >= 5) board[idx(c, r, N)] = { owner: 0, king: false };
      }
    }
    return { board, turn: 0, idle: 0 };
  },
  currentPlayer: (s) => s.turn,

  legalMoves: (s) => genMoves(s),

  applyMove(s, m) {
    const board = s.board.slice();
    const piece = board[m.from!]!;
    board[m.from!] = null;
    for (const cap of m.affected ?? []) board[cap] = null;
    const promoted = !piece.king && Math.floor(m.to / N) === kingRow(piece.owner);
    board[m.to] = { owner: piece.owner, king: piece.king || promoted };
    const captured = (m.affected?.length ?? 0) > 0;
    const idle = captured || promoted ? 0 : s.idle + 1;
    return { board, turn: s.turn === 0 ? 1 : 0, idle };
  },

  status(s): GameStatus {
    if (genMoves(s).length === 0) {
      return { over: true, winner: s.turn === 0 ? 1 : 0, reason: "no moves left" };
    }
    if (s.idle >= IDLE_DRAW) return { over: true, winner: null, reason: "40-move rule" };
    return { over: false };
  },

  evaluate(s, player) {
    let score = 0;
    for (let i = 0; i < N * N; i++) {
      const p = s.board[i];
      if (!p) continue;
      const r = Math.floor(i / N);
      let v = p.king ? 175 : 100;
      if (!p.king) {
        // reward advancement toward the crowning row
        const adv = p.owner === 0 ? N - 1 - r : r;
        v += adv * 4;
      }
      // back-row guards make you harder to crown against
      if (!p.king && r === kingRow(p.owner === 0 ? 1 : 0)) v += 5;
      score += p.owner === player ? v : -v;
    }
    // small mobility nudge for the side to move
    const mob = genMoves(s).length * (s.turn === player ? 1 : -1);
    return score + mob;
  },

  cells(s) {
    return s.board.map<CellView | null>((p) =>
      p === null ? null : { owner: p.owner, glyph: p.owner === 0 ? "🔴" : "⚪", crowned: p.king }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 3, randomness: 0.4, timeMs: 300 },
    { id: "medium", name: "Medium", depth: 6, randomness: 0.12, timeMs: 800 },
    { id: "hard", name: "Hard", depth: 9, randomness: 0, timeMs: 1600 },
  ],
};
