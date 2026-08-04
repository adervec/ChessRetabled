// Move-by-move review for the twelve board games. Replays the archived move log
// through the game's own rules and, at every ply, scores each legal move with a
// shallow search — so the verdict comes from the same evaluation the AI plays
// with, not from a table of opinions.
//
// Pure (no React, no DOM), so scripts/validate-review.mjs can drive it.

import type { Difficulty, GameDefinition, GameMove, Player } from "../games/core/types.ts";
import { chooseMove } from "../games/core/ai.ts";
import { rateMove, accuracy } from "./rate.ts";
import type { GameReview, MoveReview } from "./types.ts";

/**
 * The yardstick: the game's own engine at its strongest setting, with the
 * randomness turned off and a fixed think time so two runs of a review agree.
 * Reviewing against the same engine the player actually faced is the point —
 * "best move" then means the move that would have beaten them.
 */
export function refereeFor<S>(def: GameDefinition<S>): Difficulty {
  const strongest = def.difficulties[def.difficulties.length - 1];
  return { ...strongest, randomness: 0, timeMs: Math.max(60, Math.min(strongest.timeMs, 220)) };
}

/**
 * Turn a raw evaluation gap into a share of the position, 0..1.
 *
 * Board-game evaluations have no shared unit — one game's "+3" is another's
 * "+300" — so the gap is measured against what was on offer in that position:
 * the spread of static scores across every legal move. Give up the whole spread
 * and you gave up everything; give up a fraction of it and it costs that
 * fraction. A position where every move scores alike cannot cost you anything,
 * which is the right answer for a quiet opening.
 */
function scaledLoss<S>(
  def: GameDefinition<S>,
  s: S,
  mover: Player,
  bestValue: number,
  playedValue: number
): number {
  const gap = bestValue - playedValue;
  if (!(gap > 0)) return 0;

  let hi = -Infinity;
  let lo = Infinity;
  for (const m of def.legalMoves(s)) {
    const v = def.evaluate(def.applyMove(s, m), mover);
    if (v > hi) hi = v;
    if (v < lo) lo = v;
  }
  const spread = hi - lo;
  const scale = Math.max(spread, Math.abs(bestValue) * 0.1, 1);
  return Math.min(1, gap / scale);
}

/** A readable label for a move, from cell indices and the board geometry. */
export function moveText<S>(def: GameDefinition<S>, m: GameMove): string {
  const name = (i: number) => cellName(def, i);
  const head = m.from === undefined ? name(m.to) : `${name(m.from)}→${name(m.to)}`;
  return m.remove === undefined ? head : `${head} ×${name(m.remove)}`;
}

export function cellName<S>(def: GameDefinition<S>, i: number): string {
  const geo = def.geometry;
  if (geo.kind !== "grid") return `p${i + 1}`;
  const col = i % geo.cols;
  const row = Math.floor(i / geo.cols);
  const file = String.fromCharCode(97 + col);
  return `${file}${geo.rows - row}`;
}

/** Match a logged move against the position's legal moves (ids survive JSON). */
function findMove(legal: GameMove[], logged: GameMove): GameMove | undefined {
  const byId = legal.find((l) => l.id === logged.id);
  if (byId) return byId;
  return legal.find(
    (l) => l.to === logged.to && l.from === logged.from && l.remove === logged.remove
  );
}

export function reviewBoardGame<S>(
  def: GameDefinition<S>,
  moves: GameMove[],
  humanPlayer: Player,
  recordId = "",
): GameReview {
  const referee = refereeFor(def);
  const out: MoveReview[] = [];
  const humanLosses: number[] = [];
  let s = def.initial();
  let worst = { ply: 0, loss: 0 };

  for (let i = 0; i < moves.length; i++) {
    const logged = moves[i];
    const legal = def.legalMoves(s);
    const played = findMove(legal, logged);
    if (!played) {
      // The log and the rules disagree — a game recorded before a rules change,
      // most likely. Stop rather than invent the rest of the game.
      out.push({
        ply: i + 1,
        by: "opponent",
        text: "…",
        label: "unrated",
        loss: 0,
        note: "Could not replay from here — the move log no longer matches the rules.",
      });
      break;
    }

    const mover = def.currentPlayer(s);
    const by: MoveReview["by"] = mover === humanPlayer ? "you" : "opponent";

    let loss = 0;
    let isBest = true;
    let bestMove: GameMove | undefined;

    if (legal.length > 1) {
      // The reference is the game's OWN engine at full strength, not a private
      // search of our own. A weaker judge marks down moves it merely cannot see
      // the point of — a depth-3 reviewer called the shipped AI's own Reversi
      // openings blunders, because grabbing discs early looks good until it
      // doesn't. Judging against the same engine the player faced also means
      // "best" means something to them.
      const ref = chooseMove(def, s, referee);
      bestMove = ref.move ?? undefined;
      isBest = !!ref.move && ref.move.id === played.id;

      if (!isBest) {
        // Value of the move actually played, from this player's point of view:
        // search the position it leads to and negate the opponent's best.
        const after = chooseMove(def, def.applyMove(s, played), referee);
        const playedValue = -after.score;
        loss = scaledLoss(def, s, mover, ref.score, playedValue);
      }
    }

    const label = rateMove({ loss, onlyMove: legal.length === 1 });
    if (by === "you" && legal.length > 1) humanLosses.push(loss);
    if (by === "you" && loss > worst.loss) worst = { ply: i + 1, loss };

    out.push({
      ply: i + 1,
      by,
      text: moveText(def, played),
      label,
      loss,
      best: !isBest && bestMove ? moveText(def, bestMove) : undefined,
    });

    s = def.applyMove(s, played);
  }

  return {
    recordId,
    gameId: def.id,
    gameName: def.name,
    method: `${def.name}'s own engine at full strength as the reference for every move`,
    moves: out,
    accuracy: accuracy(humanLosses),
    turningPointPly: worst.loss > 0.25 ? worst.ply : undefined,
  };
}


