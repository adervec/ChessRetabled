// Headless verification for the card-games wing. Drives the pure, seeded game
// logic via Node 24 type-stripping — no UI involved.
import { makeDeck, cardCode } from "../src/cards/core/cards.ts";
import { makeRng, shuffle } from "../src/cards/core/rng.ts";
import { blackjackValue } from "../src/cards/core/helpers.ts";
import { initBlackjack, placeBet, hit, stand, nextRound } from "../src/cards/games/blackjack/logic.ts";
import {
  initCrazyEights, applyMove as c8Apply, aiMove as c8Ai, legalPlays,
} from "../src/cards/games/crazy-eights/logic.ts";
import {
  initHearts, applyMove as hApply, aiMove as hAi, legalMoves as hLegal, pointsOf,
} from "../src/cards/games/hearts/logic.ts";
import { initKlondike, legalMoves as kLegal, applyMove as kApply, allCards, isWon } from "../src/cards/games/klondike/logic.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  ✗ ${msg}`); problems++; }
}
const SEEDS = [1, 2, 3, 7, 42, 99, 123, 777, 2024, 31337];
const uniqueCount = (cards) => new Set(cards.map((c) => c.id)).size;

console.log("Core:");
{
  const d = makeDeck();
  check(d.length === 52 && uniqueCount(d) === 52, "deck has 52 unique cards");
  const a = shuffle(d, makeRng(5));
  const b = shuffle(d, makeRng(5));
  check(a.map(cardCode).join() === b.map(cardCode).join(), "shuffle is deterministic per seed");
  check(shuffle(d, makeRng(6)).map(cardCode).join() !== a.map(cardCode).join(), "different seed → different order");
  check(blackjackValue([{ suit: "S", rank: 1 }, { suit: "H", rank: 13 }]).total === 21, "A+K = 21");
  check(blackjackValue([{ suit: "S", rank: 1 }, { suit: "H", rank: 1 }]).total === 12, "A+A = 12 (one soft)");
  check(blackjackValue([{ suit: "S", rank: 10 }, { suit: "H", rank: 7 }, { suit: "C", rank: 8 }]).total === 25, "10+7+8 busts at 25");
}

console.log("\nBlackjack:");
for (const seed of SEEDS) {
  let s = initBlackjack(seed, 100);
  let guard = 0;
  let okChips = true, okResolve = true, okCards = true;
  while (s.chips > 0 && guard++ < 60) {
    s = placeBet(s, Math.min(10, s.chips));
    while (s.phase === "player") s = blackjackValue(s.player).total < 17 ? hit(s) : stand(s);
    if (s.phase !== "done" || s.result === null) okResolve = false;
    if (![...s.player, ...s.dealer].every(Boolean)) okCards = false;
    if (s.chips < 0 || !Number.isInteger(s.chips)) okChips = false;
    s = nextRound(s);
  }
  check(okResolve, `bj seed ${seed}: every round resolves`);
  check(okCards, `bj seed ${seed}: no undefined cards drawn`);
  check(okChips, `bj seed ${seed}: chips stay a non-negative integer`);
}

console.log("\nCrazy Eights (AI vs AI):");
for (const seed of SEEDS) {
  let s = initCrazyEights(seed);
  let guard = 0, illegal = false;
  while (s.phase === "play" && guard++ < 6000) {
    const seat = s.turn;
    const m = c8Ai(s, seat);
    if (m.type === "play" && !legalPlays(s, seat).some((c) => c.id === m.cardId)) illegal = true;
    s = c8Apply(s, m);
  }
  check(!illegal, `c8 seed ${seed}: AI never plays an illegal card`);
  check(s.phase === "done" && s.winner !== null, `c8 seed ${seed}: hand terminates with a winner`);
  const total = s.hands.flat().length + s.stock.length + s.discard.length;
  check(total === 52 && uniqueCount([...s.hands.flat(), ...s.stock, ...s.discard]) === 52, `c8 seed ${seed}: 52 cards conserved`);
}

console.log("\nHearts (AI vs AI):");
for (const seed of SEEDS) {
  let s = initHearts(seed);
  let guard = 0, illegal = false;
  while (s.phase === "play" && guard++ < 200) {
    const seat = s.turn;
    const m = hAi(s, seat);
    if (!hLegal(s, seat).some((c) => c.id === m.cardId)) illegal = true;
    s = hApply(s, m);
  }
  check(!illegal, `hearts seed ${seed}: AI always plays a legal card`);
  check(s.phase === "done", `hearts seed ${seed}: all 13 tricks played`);
  check(s.hands.every((h) => h.length === 0), `hearts seed ${seed}: every hand emptied`);
  const totalPts = s.scores.reduce((a, b) => a + b, 0);
  check(totalPts === 26 || totalPts === 78, `hearts seed ${seed}: scores sum to 26 (or 78 on a moon), got ${totalPts}`);
  const takenPts = s.taken.flat().reduce((n, c) => n + pointsOf(c), 0);
  check(takenPts === 26, `hearts seed ${seed}: 26 points were captured in total`);
}

console.log("\nKlondike:");
for (const seed of SEEDS) {
  let s = initKlondike(seed);
  const tabCards = s.tableau.reduce((n, p) => n + p.down.length + p.up.length, 0);
  check(tabCards === 28 && s.stock.length === 24, `klondike seed ${seed}: deal is 28 tableau + 24 stock`);
  check(uniqueCount(allCards(s)) === 52, `klondike seed ${seed}: 52 unique cards at deal`);
  // play bounded random legal moves; legality + conservation must hold throughout
  let guard = 0, ok = true;
  while (guard++ < 400) {
    const moves = kLegal(s);
    if (moves.length === 0) break;
    // avoid trivial draw/recycle loops: prefer a non-draw move when available
    const nonDraw = moves.filter((m) => m.type !== "draw" && m.type !== "recycle");
    const pool = nonDraw.length && guard % 2 === 0 ? nonDraw : moves;
    s = kApply(s, pool[(seed + guard) % pool.length]);
    if (uniqueCount(allCards(s)) !== 52) { ok = false; break; }
  }
  check(ok, `klondike seed ${seed}: 52 cards conserved across random play`);
  check(typeof isWon(s) === "boolean", `klondike seed ${seed}: win check evaluates`);
}

console.log(`\n[validate-cards] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
