// Move-by-move review for chess. Walks the archived SAN list through chess.js
// and asks the engine what each position was worth; the gap between what you had
// before your move and what you had after it is the whole verdict.
//
// Engine-bound, so it is async, cancellable and reports progress — a 40-move
// game is ~80 short searches.

import { Chess } from "chess.js";
import { getEngine } from "../engine";
import { rateMove, winChance, accuracy } from "./rate";
import type { GameReview, MoveReview } from "./types";

export interface ChessReviewOpts {
  /** Human's colour, "w" or "b". */
  humanSide?: string;
  startFen?: string;
  /** Per-position search budget. 120ms keeps a long game under ~15s. */
  movetimeMs?: number;
  onProgress?: (done: number, total: number) => void;
  signal?: { cancelled: boolean };
}

export async function reviewChessGame(
  san: string[],
  opts: ChessReviewOpts = {}
): Promise<GameReview> {
  const movetimeMs = opts.movetimeMs ?? 120;
  const engine = getEngine();
  const chess = new Chess(opts.startFen || undefined);

  // Replay first: a bad SAN list should fail cleanly, before any engine work.
  const plies: { san: string; fenBefore: string; fenAfter: string; mover: "w" | "b" }[] = [];
  for (const m of san) {
    const fenBefore = chess.fen();
    const mover = chess.turn() as "w" | "b";
    let ok = true;
    try {
      ok = !!chess.move(m);
    } catch {
      ok = false;
    }
    if (!ok) break;
    plies.push({ san: m, fenBefore, fenAfter: chess.fen(), mover });
  }

  const moves: MoveReview[] = [];
  const humanLosses: number[] = [];
  let worst = { ply: 0, loss: 0 };

  const total = plies.length + 1;
  let done = 0;
  const evalCache = new Map<string, number>();

  /** Winning chances for the side to move in this position. */
  const chanceToMove = async (fen: string): Promise<number> => {
    const hit = evalCache.get(fen);
    if (hit !== undefined) return hit;
    const score = await engine.evaluate(fen, { movetimeMs });
    const wc = winChance(score.cp, score.mate);
    evalCache.set(fen, wc);
    opts.onProgress?.(++done, total);
    return wc;
  };

  for (let i = 0; i < plies.length; i++) {
    if (opts.signal?.cancelled) break;
    const p = plies[i];
    const before = await chanceToMove(p.fenBefore);
    // After the move it is the opponent's turn, so their chance is the
    // complement of the mover's.
    const after = 1 - (await chanceToMove(p.fenAfter));
    const loss = Math.max(0, before - after);

    const legalCount = new Chess(p.fenBefore).moves().length;
    const by: MoveReview["by"] = opts.humanSide && p.mover === opts.humanSide ? "you" : "opponent";
    const label = rateMove({ loss, onlyMove: legalCount === 1 });

    // Only ask what was better when it actually mattered — one extra search per
    // bad move instead of one per move.
    let best: string | undefined;
    if ((label === "mistake" || label === "blunder") && !opts.signal?.cancelled) {
      const bm = await engine.bestMove(p.fenBefore, { movetimeMs });
      if (bm) {
        const probe = new Chess(p.fenBefore);
        try {
          const played = probe.move({ from: bm.from, to: bm.to, promotion: bm.promotion });
          if (played && played.san !== p.san) best = played.san;
        } catch {
          /* engine suggested something chess.js won't take — just omit it */
        }
      }
    }

    if (by === "you" && legalCount > 1) humanLosses.push(loss);
    if (by === "you" && loss > worst.loss) worst = { ply: i + 1, loss };

    moves.push({
      ply: i + 1,
      by,
      text: p.san,
      label,
      loss,
      best,
      chance: Math.round(after * 100),
    });
  }

  return {
    recordId: "",
    gameId: "chess",
    gameName: "Chess",
    method: `${engine.backendName} evaluation at ${movetimeMs}ms per position`,
    moves,
    accuracy: accuracy(humanLosses),
    turningPointPly: worst.loss > 0.25 ? worst.ply : undefined,
    unavailable: plies.length < san.length ? "The move list stops partway — the rest could not be replayed." : undefined,
  };
}
