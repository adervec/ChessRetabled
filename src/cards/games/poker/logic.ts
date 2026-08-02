import type { Card } from "../../core/cards.ts";
import { makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";
import { rankHand, compareHands, type HandRank } from "./eval.ts";

// Five-card draw vs one AI. Both ante; deal five; each discards up to three and
// redraws; highest hand takes the pot. Chips tracked for the human (the AI is
// the house). Seeded per round.

export type PokerPhase = "draw" | "showdown" | "done";
export type PokerResult = "win" | "loss" | "push";

export interface PokerState {
  seed: number;
  round: number;
  deck: Card[];
  player: Card[];
  ai: Card[];
  chips: number;
  ante: number;
  pot: number;
  phase: PokerPhase;
  result: PokerResult | null;
  playerRank: HandRank | null;
  aiRank: HandRank | null;
  message: string;
}

export function initPoker(seed: number, chips = 100, ante = 10): PokerState {
  return {
    seed,
    round: 0,
    deck: [],
    player: [],
    ai: [],
    chips,
    ante,
    pot: 0,
    phase: "done", // start "between hands"; UI calls deal()
    result: null,
    playerRank: null,
    aiRank: null,
    message: "Ante up to deal.",
  };
}

export function deal(s: PokerState): PokerState {
  if (s.chips < s.ante) return { ...s, message: "Not enough chips." };
  const deck = shuffle(makeDeck(), makeRng((s.seed + s.round * 40503) >>> 0));
  return {
    ...s,
    deck: deck.slice(10),
    player: deck.slice(0, 5),
    ai: deck.slice(5, 10),
    chips: s.chips - s.ante,
    pot: s.ante * 2,
    phase: "draw",
    result: null,
    playerRank: null,
    aiRank: null,
    message: "Choose up to 3 cards to discard, then draw.",
  };
}

/** Which indices the AI discards: keep paired ranks; from a no-pair hand keep the top two. */
export function aiDiscards(hand: Card[]): number[] {
  const eff = (c: Card) => (c.rank === 1 ? 14 : c.rank);
  const counts = new Map<number, number>();
  for (const c of hand) counts.set(eff(c), (counts.get(eff(c)) ?? 0) + 1);
  const hasPair = [...counts.values()].some((n) => n >= 2);
  if (hasPair) {
    return hand.map((c, i) => (counts.get(eff(c))! >= 2 ? -1 : i)).filter((i) => i >= 0);
  }
  // no pair: keep the best two cards, discard the other three
  const order = hand
    .map((c, i) => ({ i, v: eff(c) }))
    .sort((a, b) => b.v - a.v)
    .map((x) => x.i);
  return order.slice(2);
}

function drawReplace(hand: Card[], discard: number[], deck: Card[]): { hand: Card[]; deck: Card[] } {
  const keep = hand.filter((_, i) => !discard.includes(i));
  const drawn = deck.slice(0, discard.length);
  return { hand: [...keep, ...drawn], deck: deck.slice(discard.length) };
}

/** Player draws (discarding `playerDiscard`), AI draws by policy, then showdown. */
export function draw(s: PokerState, playerDiscard: number[]): PokerState {
  if (s.phase !== "draw") return s;
  const pd = playerDiscard.slice(0, 3);
  const p = drawReplace(s.player, pd, s.deck);
  const aDisc = aiDiscards(s.ai);
  const a = drawReplace(s.ai, aDisc, p.deck);

  const playerRank = rankHand(p.hand);
  const aiRank = rankHand(a.hand);
  const cmp = compareHands(playerRank, aiRank);
  let result: PokerResult;
  let payout = 0;
  let message: string;
  if (cmp > 0) { result = "win"; payout = s.pot; message = `${playerRank.name} beats ${aiRank.name} — you win the pot!`; }
  else if (cmp < 0) { result = "loss"; message = `${aiRank.name} beats ${playerRank.name}. Dealer takes it.`; }
  else { result = "push"; payout = s.ante; message = `Split pot — both have ${playerRank.name}.`; }

  return {
    ...s,
    deck: a.deck,
    player: p.hand,
    ai: a.hand,
    chips: s.chips + payout,
    phase: "showdown",
    result,
    playerRank,
    aiRank,
    message,
  };
}

export function nextRound(s: PokerState): PokerState {
  return {
    ...s,
    round: s.round + 1,
    phase: "done",
    pot: 0,
    result: null,
    message: s.chips < s.ante ? "Out of chips." : "Ante up to deal.",
  };
}
