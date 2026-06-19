// Headless verification for the card-games wing. Drives the pure, seeded game
// logic via Node 24 type-stripping — no UI involved.
import { makeDeck, makeCard, cardCode } from "../src/cards/core/cards.ts";
import { makeRng, shuffle } from "../src/cards/core/rng.ts";
import { initWar, step as warStep } from "../src/cards/games/war/logic.ts";
import { initGoFish, applyMove as gfApply, aiMove as gfAi, legalRanks } from "../src/cards/games/gofish/logic.ts";
import { initMemory, reveal as memReveal, resolve as memResolve, aiPick } from "../src/cards/games/memory/logic.ts";
import { rankHand, compareHands } from "../src/cards/games/poker/eval.ts";
import { initPoker, deal as pokerDeal, draw as pokerDraw, nextRound as pokerNext, aiDiscards } from "../src/cards/games/poker/logic.ts";
import { initOldMaid, step as omStep } from "../src/cards/games/oldmaid/logic.ts";
import { initHoldem, deal as heDeal, playerCheck, playerCall, playerFold as heFold, nextRound as heNext, bestHand } from "../src/cards/games/holdem/logic.ts";
import { initGin, aiTurn as ginTurn } from "../src/cards/games/gin/logic.ts";
import { bestMeld, bestDiscard } from "../src/cards/games/gin/melds.ts";
import { initBriscola, applyMove as briscApply, aiMove as briscAi, legalPlays as briscLegal } from "../src/cards/games/briscola/logic.ts";
import { makeDeck40 } from "../src/cards/core/italian.ts";

function parseCards(codes) {
  return codes.map((c) => {
    const suit = c[c.length - 1];
    const r = c.slice(0, -1);
    const rank = r === "A" ? 1 : r === "K" ? 13 : r === "Q" ? 12 : r === "J" ? 11 : r === "T" ? 10 : Number(r);
    return makeCard(suit, rank);
  });
}
import { blackjackValue } from "../src/cards/core/helpers.ts";
import { initBlackjack, placeBet, hit, stand, nextRound } from "../src/cards/games/blackjack/logic.ts";
import {
  initCrazyEights, applyMove as c8Apply, aiMove as c8Ai, legalPlays,
} from "../src/cards/games/crazy-eights/logic.ts";
import {
  initHearts, applyMove as hApply, aiMove as hAi, legalMoves as hLegal, pointsOf,
} from "../src/cards/games/hearts/logic.ts";
import { initKlondike, legalMoves as kLegal, applyMove as kApply, allCards, isWon } from "../src/cards/games/klondike/logic.ts";
import { initPyramid, removeRefs, draw as pyDraw, recycle as pyRecycle, isWon as pyWon, value as pyVal, exposedSlots, WASTE_REF } from "../src/cards/games/pyramid/logic.ts";
import { initGolf, playColumn, draw as golfDraw, playableColumns, isWon as golfWon, isStuck as golfStuck, canPlay } from "../src/cards/games/golf/logic.ts";

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

console.log("\nPyramid:");
for (const seed of SEEDS) {
  let s = initPyramid(seed);
  check(s.pyramid.filter(Boolean).length === 28 && s.stock.length === 24, `pyramid seed ${seed}: 28 pyramid + 24 stock`);
  const remaining = (st) => [...st.pyramid.filter(Boolean), ...st.stock, ...st.waste];
  check(uniqueCount(remaining(s)) === 52, `pyramid seed ${seed}: 52 unique at deal`);
  let guard = 0, ok = true;
  while (guard++ < 3000) {
    const refs = exposedSlots(s);
    if (s.waste.length) refs.push(WASTE_REF);
    const valOf = (r) => (r === WASTE_REF ? pyVal(s.waste[s.waste.length - 1].rank) : pyVal(s.pyramid[r].rank));
    const king = refs.find((r) => valOf(r) === 13);
    let moved = false;
    if (king !== undefined) { s = removeRefs(s, [king]); moved = true; }
    else {
      pair: for (let a = 0; a < refs.length; a++) for (let b = a + 1; b < refs.length; b++) {
        if (valOf(refs[a]) + valOf(refs[b]) === 13) { s = removeRefs(s, [refs[a], refs[b]]); moved = true; break pair; }
      }
    }
    if (!moved) {
      if (s.stock.length) s = pyDraw(s);
      else if (s.waste.length) s = pyRecycle(s);
      else break;
    }
    const rem = remaining(s);
    if (uniqueCount(rem) !== rem.length) { ok = false; break; }
    if (pyWon(s) || s.recycles > 3) break;
  }
  check(ok, `pyramid seed ${seed}: no card duplicated or created across play`);
  check(typeof pyWon(s) === "boolean", `pyramid seed ${seed}: win check evaluates`);
  // non-13 pair removal must be a no-op
  const fresh = initPyramid(seed);
  const ex = exposedSlots(fresh);
  const sum = pyVal(fresh.pyramid[ex[0]].rank) + pyVal(fresh.pyramid[ex[1]].rank);
  if (sum !== 13) {
    const before = remaining(fresh).length;
    check(remaining(removeRefs(fresh, [ex[0], ex[1]])).length === before, `pyramid seed ${seed}: illegal pair is rejected`);
  }
  check(pyWon({ ...fresh, pyramid: new Array(28).fill(null) }), `pyramid seed ${seed}: cleared pyramid is a win`);
}

console.log("\nGolf:");
for (const seed of SEEDS) {
  let s = initGolf(seed);
  const colCards = s.columns.reduce((n, c) => n + c.length, 0);
  check(colCards === 35 && s.foundation.length === 1 && s.stock.length === 16, `golf seed ${seed}: 35 columns + 1 foundation + 16 stock`);
  const all = (st) => [...st.columns.flat(), ...st.stock, ...st.foundation];
  check(uniqueCount(all(s)) === 52, `golf seed ${seed}: 52 unique at deal`);
  let guard = 0, ok = true;
  while (guard++ < 200) {
    if (golfWon(s) || golfStuck(s)) break;
    const pc = playableColumns(s);
    if (pc.length) s = playColumn(s, pc[(seed + guard) % pc.length]);
    else if (s.stock.length) s = golfDraw(s);
    else break;
    if (uniqueCount(all(s)) !== 52) { ok = false; break; }
  }
  check(ok, `golf seed ${seed}: 52 cards conserved across play`);
  check(golfWon(s) || golfStuck(s), `golf seed ${seed}: reaches a terminal state`);
}
check(canPlay(makeCard("S", 5), makeCard("H", 6)) && canPlay(makeCard("S", 5), makeCard("H", 4)), "golf: a 5 plays on a 4 or a 6");
check(!canPlay(makeCard("S", 5), makeCard("H", 7)) && !canPlay(makeCard("S", 1), makeCard("H", 13)), "golf: no jumps and no A–K wrap");

console.log("\nWar:");
for (const seed of SEEDS) {
  let s = initWar(seed);
  let guard = 0;
  while (s.phase === "play" && guard++ < 5000) s = warStep(s);
  check(s.phase === "done", `war seed ${seed}: terminates`);
  check(s.decks[0].length + s.decks[1].length === 52, `war seed ${seed}: 52 cards conserved`);
}

console.log("\nGo Fish (AI vs AI):");
for (const seed of SEEDS) {
  let s = initGoFish(seed);
  let guard = 0, illegal = false;
  while (s.phase !== "done" && guard++ < 3000) {
    const seat = s.turn;
    const m = gfAi(s, seat);
    if (!legalRanks(s, seat).includes(m.rank)) illegal = true;
    s = gfApply(s, m);
  }
  check(!illegal, `gofish seed ${seed}: AI only asks ranks it holds`);
  check(s.phase === "done", `gofish seed ${seed}: terminates`);
  const books = s.books[0].length + s.books[1].length;
  check(books === 13, `gofish seed ${seed}: 13 books made (got ${books})`);
  const cards = s.hands[0].length + s.hands[1].length + s.stock.length + 4 * books;
  check(cards === 52, `gofish seed ${seed}: 52 cards conserved`);
}

console.log("\nMemory (AI vs AI):");
for (const seed of SEEDS) {
  let s = initMemory(seed);
  let guard = 0;
  while (s.phase !== "done" && guard++ < 3000) {
    s = s.phase === "resolve" ? memResolve(s) : memReveal(s, aiPick(s));
  }
  check(s.phase === "done", `memory seed ${seed}: terminates`);
  check(s.matched.every(Boolean), `memory seed ${seed}: all pairs found`);
  check(s.scores[0] + s.scores[1] === 10, `memory seed ${seed}: 10 pairs scored`);
}

console.log("\nPoker evaluator:");
{
  const h = (codes) => codes.map((c) => {
    const suit = c[c.length - 1];
    const r = c.slice(0, -1);
    const rank = r === "A" ? 1 : r === "K" ? 13 : r === "Q" ? 12 : r === "J" ? 11 : r === "T" ? 10 : Number(r);
    return makeCard(suit, rank);
  });
  const named = {
    royal: h(["AS", "KS", "QS", "JS", "TS"]),
    sf: h(["9H", "8H", "7H", "6H", "5H"]),
    quads: h(["7S", "7H", "7D", "7C", "2S"]),
    full: h(["KS", "KH", "KD", "2S", "2H"]),
    flush: h(["AS", "JS", "9S", "5S", "2S"]),
    straight: h(["6S", "5H", "4D", "3C", "2S"]),
    wheel: h(["AS", "2H", "3D", "4C", "5S"]),
    trips: h(["9S", "9H", "9D", "KS", "2H"]),
    twoPair: h(["JS", "JH", "4D", "4C", "AS"]),
    pair: h(["TS", "TH", "KD", "7C", "2S"]),
    high: h(["AS", "QH", "9D", "5C", "3S"]),
  };
  const cat = (k) => rankHand(named[k]).category;
  check(rankHand(named.royal).name === "Royal Flush", "royal flush named");
  check(cat("royal") === 8 && cat("sf") === 8, "straight flushes are category 8");
  check(cat("quads") === 7, "four of a kind = 7");
  check(cat("full") === 6, "full house = 6");
  check(cat("flush") === 5, "flush = 5");
  check(cat("straight") === 4 && cat("wheel") === 4, "straights = 4 (incl. wheel)");
  check(rankHand(named.wheel).tiebreak[0] === 5, "wheel is a 5-high straight");
  check(cat("trips") === 3 && cat("twoPair") === 2 && cat("pair") === 1 && cat("high") === 0, "lower categories correct");
  // ordering
  const order = ["royal", "sf", "quads", "full", "flush", "straight", "trips", "twoPair", "pair", "high"];
  let ordered = true;
  for (let i = 0; i < order.length - 1; i++) {
    if (compareHands(rankHand(named[order[i]]), rankHand(named[order[i + 1]])) <= 0) ordered = false;
  }
  check(ordered, "full hand-strength ordering holds");
  check(compareHands(rankHand(named.straight), rankHand(named.wheel)) > 0, "6-high straight beats the wheel");
  // kicker tiebreak within a category
  const kHi = h(["KS", "KH", "AD", "5C", "2S"]);
  const kLo = h(["KS", "KH", "QD", "5C", "2S"]);
  check(compareHands(rankHand(kHi), rankHand(kLo)) > 0, "pair of kings: ace kicker beats queen kicker");
}

console.log("\nPoker (5-card draw):");
for (const seed of SEEDS) {
  let s = initPoker(seed, 100, 10);
  let guard = 0, ok = true;
  while (s.chips >= s.ante && guard++ < 40) {
    s = pokerDeal(s);
    if (s.phase !== "draw") break;
    s = pokerDraw(s, aiDiscards(s.player));
    if (s.phase !== "showdown" || s.result === null) ok = false;
    if (s.player.length !== 5 || s.ai.length !== 5) ok = false;
    if (s.chips < 0 || !Number.isInteger(s.chips)) ok = false;
    s = pokerNext(s);
  }
  check(ok, `poker seed ${seed}: rounds resolve with 5-card hands and sane chips`);
}

console.log("\nOld Maid (auto):");
for (const seed of SEEDS) {
  let s = initOldMaid(seed);
  let guard = 0;
  while (s.phase === "play" && guard++ < 3000) s = omStep(s);
  check(s.phase === "done", `oldmaid seed ${seed}: terminates`);
  check(s.loser !== null, `oldmaid seed ${seed}: has a loser`);
  const left = s.hands.flat();
  check(left.length === 1 && left[0].rank === 12, `oldmaid seed ${seed}: ends on the lone queen`);
}

console.log("\nTexas Hold'em:");
check(bestHand(parseCards(["AS", "KS", "QS", "JS", "TS", "2H", "3D"])).category === 8, "best-of-7 finds the royal flush");
check(bestHand(parseCards(["7S", "7H", "7D", "KS", "KH", "2C", "9D"])).category === 6, "best-of-7 finds the full house");
check(bestHand(parseCards(["2S", "5S", "9S", "JS", "KS", "AS", "3D"])).category === 5, "best-of-7 finds the flush");
for (const seed of SEEDS) {
  let s = initHoldem(seed, 100, 10, 20);
  let guard = 0, ok = true;
  while (s.chips >= s.ante && guard++ < 60) {
    s = heDeal(s);
    if (s.phase !== "bet") break;
    s = playerCheck(s);
    if (s.phase === "callfold") s = s.chips >= s.betSize ? playerCall(s) : heFold(s);
    if (s.phase !== "showdown" || s.result === null) ok = false;
    if (s.chips < 0 || !Number.isInteger(s.chips)) ok = false;
    s = heNext(s);
  }
  check(ok, `holdem seed ${seed}: rounds resolve with sane chips`);
}

console.log("\nGin Rummy:");
check(bestMeld(parseCards(["AS", "2S", "3S", "4S", "5H", "6H", "7H", "8D", "9D", "TD"])).deadwoodValue === 0, "a fully-melded hand is gin (0 deadwood)");
check(bestMeld(parseCards(["AS", "2S", "3S", "5H", "6H", "7H", "8D", "9D", "TD", "KC"])).deadwoodValue === 10, "a lone king is 10 deadwood");
check(bestDiscard(parseCards(["AS", "2S", "3S", "4S", "5H", "6H", "7H", "8D", "9D", "TD", "KC"])).deadwoodValue === 0, "discarding the junk king yields gin");
check(bestMeld(parseCards(["7S", "7H", "7D", "8C", "9C", "TC", "2S", "3S", "4S", "KD"])).deadwoodValue === 10, "set + two runs leaves the lone king");
for (const seed of SEEDS) {
  let s = initGin(seed);
  let guard = 0;
  while (s.phase !== "done" && guard++ < 300) s = ginTurn(s);
  check(s.phase === "done", `gin seed ${seed}: terminates`);
  check(s.winner !== null && s.scores[s.winner] >= 0, `gin seed ${seed}: resolves with a winner`);
}

console.log("\nBriscola (AI vs AI):");
check(makeDeck40().length === 40 && uniqueCount(makeDeck40()) === 40, "Italian deck has 40 unique cards");
for (const seed of SEEDS) {
  let s = initBriscola(seed);
  let guard = 0, illegal = false;
  while (s.phase === "play" && guard++ < 200) {
    const seat = s.turn;
    const m = briscAi(s, seat);
    if (!briscLegal(s, seat).some((c) => c.id === m.cardId)) illegal = true;
    s = briscApply(s, m);
  }
  check(!illegal, `briscola seed ${seed}: AI plays a card from hand`);
  check(s.phase === "done", `briscola seed ${seed}: terminates`);
  const cap = s.captured[0].length + s.captured[1].length;
  check(cap === 40, `briscola seed ${seed}: all 40 cards captured`);
  check(s.scores[0] + s.scores[1] === 120, `briscola seed ${seed}: points total 120 (got ${s.scores[0] + s.scores[1]})`);
}

console.log(`\n[validate-cards] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
