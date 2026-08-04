// Drives the review analysers headlessly: the rating scale, the board-game
// analyser against real self-played games, and the logic solve log.
//
// The load-bearing property is that the analyser is not flattering: a move the
// game's evaluation ranks last must never rate better than the engine's own
// choice from the same position.
//
//   node scripts/validate-review.mjs

import { rateMove, relativeLoss, winChance, tally, accuracy, THRESHOLDS } from "../src/review/rate.ts";
import { reviewBoardGame, refereeFor } from "../src/review/board.ts";
import { reviewLogicSolve } from "../src/review/logic.ts";
import { GAMES } from "../src/games/registry.ts";
import { chooseMove } from "../src/games/core/ai.ts";

let checks = 0;
let problems = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    problems++;
    console.error("  FAIL " + msg);
  }
}

/* ------------------------------------------------------------ the scale --- */

check(rateMove({ loss: 0 }) === "best", "no loss is the best move");
check(rateMove({ loss: 0, standout: true }) === "brilliant", "the only good move is brilliant");
check(rateMove({ loss: THRESHOLDS.best }) === "best", "boundary: best");
check(rateMove({ loss: THRESHOLDS.best + 0.001 }) === "good", "just past best is good");
check(rateMove({ loss: THRESHOLDS.good + 0.001 }) === "inaccuracy", "just past good is an inaccuracy");
check(rateMove({ loss: THRESHOLDS.inaccuracy + 0.001 }) === "mistake", "past inaccuracy is a mistake");
check(rateMove({ loss: THRESHOLDS.mistake + 0.001 }) === "blunder", "past mistake is a blunder");
check(rateMove({ loss: 1 }) === "blunder", "total loss is a blunder");
check(rateMove({ loss: 0.9, onlyMove: true }) === "forced", "a forced move is never a blunder");
check(rateMove({ loss: 0, unknown: true }) === "unrated", "unknown stays unrated");
check(rateMove({ loss: -5 }) === "best" && rateMove({ loss: 99 }) === "blunder", "loss is clamped");

check(winChance(0) === 0.5, "an equal position is 50%");
check(winChance(400) > 0.85 && winChance(-400) < 0.15, "±400cp is decisive-ish");
check(winChance(0, 1) === 1 && winChance(0, -1) === 0, "mate saturates");
check(winChance(100) > winChance(99), "win chance is monotonic in centipawns");

check(relativeLoss(5, 10, 0) === 0.5, "half the spread is half the loss");
check(relativeLoss(10, 10, 0) === 0, "playing the best move loses nothing");
check(relativeLoss(0, 10, 0) === 1, "playing the worst move loses everything");
check(relativeLoss(7, 7, 7) === 0, "no spread ⇒ nothing could be given up");
check(relativeLoss(-5, 10, 0) === 1, "below the worst move is still clamped to 1");

check(accuracy([]) === 100, "no rated moves ⇒ nothing was lost");
check(accuracy([0, 0]) === 100, "perfect moves ⇒ 100%");
check(accuracy([1, 1]) === 0, "total losses ⇒ 0%");
check(accuracy([0, 1]) === 50, "half and half");
check(tally(["best", "best", "blunder"]).length === 2, "tally groups labels");
check(tally(["blunder", "best"])[0].label === "best", "tally is in display order");

/* ------------------------------------------------- board-game analysers --- */

/** Play a real game with the game's own AI so the analyser sees real move logs. */
function selfPlay(def, maxPlies = 14) {
  const diff = def.difficulties[def.difficulties.length - 1];
  const quiet = { ...diff, randomness: 0, timeMs: Math.min(diff.timeMs, 80) };
  let s = def.initial();
  const log = [];
  for (let i = 0; i < maxPlies; i++) {
    if (def.status(s).over) break;
    const { move } = chooseMove(def, s, quiet);
    if (!move) break;
    log.push(move);
    s = def.applyMove(s, move);
  }
  return log;
}

for (const def of GAMES) {
  const log = selfPlay(def);
  check(log.length > 0, `${def.id}: self-play produced no moves`);
  const review = reviewBoardGame(def, log, 0, "test");

  check(review.moves.length === log.length, `${def.id}: reviewed ${review.moves.length}/${log.length} plies`);
  check(
    review.moves.every((m) => m.label !== "unrated"),
    `${def.id}: some plies could not be replayed`
  );
  check(
    review.moves.every((m) => m.loss >= 0 && m.loss <= 1),
    `${def.id}: a loss fell outside 0..1`
  );
  check(review.accuracy >= 0 && review.accuracy <= 100, `${def.id}: accuracy out of range`);
  check(
    review.moves.every((m, i) => m.ply === i + 1),
    `${def.id}: plies are not numbered in order`
  );
  check(review.method.length > 0 && review.gameId === def.id, `${def.id}: review metadata missing`);
}

/* ---- the analyser must discriminate ----
   The reviewer's reference is the game's own engine, so "the engine's move
   rates best" holds by construction — worth pinning anyway, since it is the
   property the whole design rests on. The test with teeth is the second one:
   a move the engine considers terrible must rate worse than the engine's own. */
for (const def of GAMES) {
  const s = def.initial();
  const legal = def.legalMoves(s);
  if (legal.length < 3) continue;
  // Same referee the reviewer uses. A different think time reaches a different
  // depth and picks a different move, which is a property worth knowing about.
  const { move: aiMove } = chooseMove(def, s, refereeFor(def));
  if (!aiMove) continue;

  const good = reviewBoardGame(def, [aiMove], 0).moves[0];
  check(
    good.label === "best" || good.label === "brilliant",
    `${def.id}: the engine's own opening move rated ${good.label} (loss ${good.loss.toFixed(3)})`
  );

  // The move the static evaluation likes least, as a stand-in for a bad move.
  const mover = def.currentPlayer(s);
  const ranked = legal
    .map((m) => ({ m, v: def.evaluate(def.applyMove(s, m), mover) }))
    .sort((a, b) => a.v - b.v);
  const bad = ranked[0].m;
  if (bad.id === aiMove.id) continue;
  const poor = reviewBoardGame(def, [bad], 0).moves[0];
  check(
    poor.loss >= good.loss,
    `${def.id}: a move the evaluation ranks last (${poor.loss.toFixed(3)}) did not rate worse than the engine's own (${good.loss.toFixed(3)})`
  );
  check(
    poor.best !== undefined,
    `${def.id}: a non-best move should say what was better`
  );
}

/* ------------------------------------------------------------ the logic --- */

const solve = reviewLogicSolve(
  [
    { i: 0, v: 5, ok: true },
    { i: 1, v: 3, ok: false },
    { i: 1, v: 0, ok: true },
    { i: 1, v: 7, ok: true },
    { i: 2, v: 9, ok: true, hint: true },
    { i: 0, v: 2, ok: false, undid: true },
  ],
  { gameId: "sudoku", gameName: "Sudoku" }
);
check(solve.moves.length === 6, "every entry is reviewed");
check(solve.moves[0].label === "best", "a correct entry is the best move");
check(solve.moves[1].label === "mistake" || solve.moves[1].label === "blunder", "a wrong entry is marked");
check(solve.moves[4].label === "forced", "a hinted entry is not credited to the player");
check(solve.moves[5].label === "blunder", "overwriting a correct square is the worst case");
check(solve.turningPointPly === 6, "the turning point is the overwrite");
check(solve.accuracy < 100 && solve.accuracy > 0, "accuracy reflects the mistakes");
check(reviewLogicSolve([], { gameId: "x", gameName: "X" }).accuracy === 100, "an empty log is not punished");

console.log(`\n[validate-review] games=${GAMES.length} checks=${checks} problems=${problems}`);
if (problems > 0) process.exit(1);
