// Generic negamax + alpha-beta engine shared by every game definition.
//
// It mirrors src/engine/minimax.ts (the chess fallback AI) but is game-agnostic:
// it drives any GameDefinition through legalMoves / applyMove / status / evaluate.
// Iterative deepening keeps it responsive — it always has a best move from the
// last completed depth and stops once the per-move time budget is spent.
import type { Difficulty, GameDefinition, GameMove } from "./types.ts";

const MATE = 1_000_000;

interface SearchCtx<S> {
  def: GameDefinition<S>;
  deadline: number;
  timedOut: boolean;
}

/** Negamax value of `state` from the perspective of its side to move. */
function negamax<S>(
  ctx: SearchCtx<S>,
  state: S,
  depth: number,
  alpha: number,
  beta: number
): number {
  const { def } = ctx;
  const status = def.status(state);
  if (status.over) {
    if (status.winner === null) return 0; // draw
    const side = def.currentPlayer(state);
    // Terminal reached: encode "sooner is better" via the remaining depth.
    return status.winner === side ? MATE + depth : -(MATE + depth);
  }
  if (depth === 0) return def.evaluate(state, def.currentPlayer(state));

  if (Date.now() > ctx.deadline) {
    ctx.timedOut = true;
    return def.evaluate(state, def.currentPlayer(state));
  }

  const moves = orderedMoves(def, state);
  let best = -Infinity;
  for (const m of moves) {
    const child = def.applyMove(state, m);
    const val = -negamax(ctx, child, depth - 1, -beta, -alpha);
    if (val > best) best = val;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
    if (ctx.timedOut) break;
  }
  return best;
}

/** Child moves ordered by a one-ply look-ahead (cheap but effective ordering). */
function orderedMoves<S>(def: GameDefinition<S>, state: S): GameMove[] {
  const moves = def.candidateMoves ? def.candidateMoves(state) : def.legalMoves(state);
  const side = def.currentPlayer(state);
  const scored = moves.map((m) => ({
    m,
    s: def.evaluate(def.applyMove(state, m), side),
  }));
  scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.m);
}

export interface MoveChoice {
  move: GameMove | null;
  /** Search score from the mover's perspective (for an eval read-out). */
  score: number;
}

/** Pick a move for the side to move at the given difficulty. */
export function chooseMove<S>(
  def: GameDefinition<S>,
  state: S,
  diff: Difficulty
): MoveChoice {
  const legal = def.legalMoves(state);
  if (legal.length === 0) return { move: null, score: 0 };
  if (legal.length === 1) return { move: legal[0], score: 0 };

  // Weak play: sometimes just blunder a random legal move.
  if (Math.random() < diff.randomness) {
    return { move: legal[Math.floor(Math.random() * legal.length)], score: 0 };
  }

  const candidates = def.candidateMoves ? def.candidateMoves(state) : legal;
  const deadline = Date.now() + diff.timeMs;

  let bestMove = candidates[0];
  let bestScore = -Infinity;

  // Iterative deepening: each depth refines the move from the previous one.
  for (let depth = 1; depth <= diff.depth; depth++) {
    const ctx: SearchCtx<S> = { def, deadline, timedOut: false };
    let localBest = -Infinity;
    let localMove = bestMove;
    let alpha = -Infinity;
    const ordered = depth === 1 ? orderedMoves(def, state) : moveOrder(def, state, bestMove);
    for (const m of ordered) {
      const child = def.applyMove(state, m);
      const val = -negamax(ctx, child, depth - 1, -Infinity, -alpha);
      if (val > localBest) {
        localBest = val;
        localMove = m;
      }
      if (val > alpha) alpha = val;
      if (ctx.timedOut) break;
    }
    if (!ctx.timedOut) {
      bestMove = localMove;
      bestScore = localBest;
      // Found a forced win — no need to search deeper.
      if (bestScore >= MATE) break;
    } else {
      // Use the partial result only if it improved on nothing yet.
      if (bestScore === -Infinity) {
        bestMove = localMove;
        bestScore = localBest;
      }
      break;
    }
  }

  return { move: bestMove, score: bestScore };
}

/** Put `first` at the front of the ordered move list (principal-variation hint). */
function moveOrder<S>(
  def: GameDefinition<S>,
  state: S,
  first: GameMove | undefined
): GameMove[] {
  const ordered = orderedMoves(def, state);
  if (!first) return ordered;
  const rest = ordered.filter((m) => m.id !== first.id);
  const head = ordered.find((m) => m.id === first.id);
  return head ? [head, ...rest] : ordered;
}
