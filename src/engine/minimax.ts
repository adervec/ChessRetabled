import { Chess, type Move as ChessMove } from "chess.js";
import {
  type ChessEngine,
  type EngineLevel,
  type EngineMove,
  type EvalScore,
} from "./types";
import type { PieceSymbol } from "../chess/types";

const VALUE: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simplified piece-square tables (white POV, a1 = index 0 ... h8 = 63).
// prettier-ignore
const PST: Record<PieceSymbol, number[]> = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10,-20,-20, 10, 10,  5,
     5, -5,-10,  0,  0,-10, -5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5,  5, 10, 25, 25, 10,  5,  5,
    10, 10, 20, 30, 30, 20, 10, 10,
    50, 50, 50, 50, 50, 50, 50, 50,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  5,  5,  0,  0,  0,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     5, 10, 10, 10, 10, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -10,  5,  5,  5,  5,  5,  0,-10,
      0,  0,  5,  5,  5,  5,  0, -5,
     -5,  0,  5,  5,  5,  5,  0, -5,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
     20, 30, 10,  0,  0, 10, 30, 20,
     20, 20,  0,  0,  0,  0, 20, 20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
  ],
};

function sqIndex(square: string): number {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return rank * 8 + file;
}

/** Static evaluation from White's perspective, in centipawns. */
function evaluateBoard(chess: Chess): number {
  let score = 0;
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue;
      const idx = sqIndex(cell.square);
      const pstIdx = cell.color === "w" ? idx : 63 - idx;
      const v = VALUE[cell.type] + PST[cell.type][pstIdx];
      score += cell.color === "w" ? v : -v;
    }
  }
  return score;
}

function orderMoves(moves: ChessMove[]): ChessMove[] {
  return [...moves].sort((a, b) => score(b) - score(a));
  function score(m: ChessMove): number {
    let s = 0;
    if (m.captured) s += 10 * VALUE[m.captured] - VALUE[m.piece];
    if (m.promotion) s += VALUE[m.promotion];
    return s;
  }
}

const MATE = 1_000_000;

function negamax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  color: number // +1 white to move, -1 black to move
): number {
  if (chess.isGameOver()) {
    if (chess.isCheckmate()) return -MATE - depth; // worse the sooner
    return 0; // draw
  }
  if (depth === 0) return color * evaluateBoard(chess);

  let best = -Infinity;
  const moves = orderMoves(chess.moves({ verbose: true }) as ChessMove[]);
  for (const m of moves) {
    chess.move(m);
    const val = -negamax(chess, depth - 1, -beta, -alpha, -color);
    chess.undo();
    if (val > best) best = val;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function levelToDepth(level: EngineLevel): number {
  if (level.depth != null) return Math.max(1, Math.min(3, level.depth));
  if (level.elo != null) return level.elo >= 1600 ? 3 : level.elo >= 1200 ? 2 : 1;
  const skill = level.skill ?? 12;
  return skill >= 15 ? 3 : skill >= 7 ? 2 : 1;
}

function levelRandomness(level: EngineLevel): number {
  // probability of taking a clearly suboptimal move (weak play)
  if (level.elo != null) return level.elo < 1000 ? 0.35 : level.elo < 1500 ? 0.12 : 0;
  const skill = level.skill ?? 12;
  if (skill <= 2) return 0.5;
  if (skill <= 6) return 0.25;
  if (skill <= 10) return 0.1;
  return 0;
}

/** Minimax engine — a self-contained fallback when Stockfish can't load. */
export class MinimaxEngine implements ChessEngine {
  readonly name = "ChessRetabled AI";
  private isReady = false;

  ready(): boolean {
    return this.isReady;
  }

  async init(): Promise<void> {
    this.isReady = true;
  }

  async bestMove(fen: string, level: EngineLevel): Promise<EngineMove | null> {
    // yield to the event loop so the UI can paint the "thinking" state
    await new Promise((r) => setTimeout(r, 10));
    const chess = new Chess(fen);
    const moves = orderMoves(chess.moves({ verbose: true }) as ChessMove[]);
    if (moves.length === 0) return null;

    if (Math.random() < levelRandomness(level)) {
      const m = moves[Math.floor(Math.random() * moves.length)];
      return { from: m.from, to: m.to, promotion: m.promotion, uci: m.lan };
    }

    const depth = levelToDepth(level);
    const color = chess.turn() === "w" ? 1 : -1;
    let bestVal = -Infinity;
    const scored: { m: ChessMove; v: number }[] = [];
    for (const m of moves) {
      chess.move(m);
      const v = -negamax(chess, depth - 1, -Infinity, Infinity, -color);
      chess.undo();
      scored.push({ m, v });
      if (v > bestVal) bestVal = v;
    }
    // pick randomly among near-best moves for variety
    const pool = scored.filter((s) => s.v >= bestVal - 15);
    const chosen = pool[Math.floor(Math.random() * pool.length)].m;
    return {
      from: chosen.from,
      to: chosen.to,
      promotion: chosen.promotion,
      uci: chosen.lan,
    };
  }

  async evaluate(fen: string): Promise<EvalScore> {
    const chess = new Chess(fen);
    if (chess.isCheckmate()) return { mate: 0 };
    const white = evaluateBoard(chess);
    // EvalScore is from side-to-move perspective
    return { cp: chess.turn() === "w" ? white : -white };
  }

  stop(): void {}
  dispose(): void {
    this.isReady = false;
  }
}
