import type { Card } from "../../core/cards.ts";
import { cardId, makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";

// Hearts for 4 seats (seat 0 is the human). One hand of 13 tricks, no passing.
// Each heart = 1 point, Q♠ = 13; lowest score wins. Shooting the moon (taking all
// 26) scores you 0 and everyone else 26. Ace is high.

export const SEATS = 4;
const TWO_CLUBS = cardId("C", 2);

export type HeartsPhase = "play" | "done";
export interface TrickCard {
  seat: number;
  card: Card;
}
export interface HeartsState {
  seed: number;
  hands: Card[][];
  trick: TrickCard[];
  lastTrick: TrickCard[] | null;
  leader: number;
  turn: number;
  taken: Card[][];
  heartsBroken: boolean;
  trickNo: number;
  phase: HeartsPhase;
  scores: number[];
  winner: number | null;
}

export interface HeartsMove {
  cardId: string;
}

function effRank(c: Card): number {
  return c.rank === 1 ? 14 : c.rank; // ace high
}
export function pointsOf(c: Card): number {
  if (c.suit === "H") return 1;
  if (c.suit === "S" && c.rank === 12) return 13; // Q♠
  return 0;
}

export function initHearts(seed: number): HeartsState {
  const deck = shuffle(makeDeck(), makeRng(seed));
  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < deck.length; i++) hands[i % SEATS].push(deck[i]);
  const leader = hands.findIndex((h) => h.some((c) => c.id === TWO_CLUBS));
  return {
    seed,
    hands,
    trick: [],
    lastTrick: null,
    leader,
    turn: leader,
    taken: [[], [], [], []],
    heartsBroken: false,
    trickNo: 0,
    phase: "play",
    scores: [0, 0, 0, 0],
    winner: null,
  };
}

export function legalMoves(s: HeartsState, seat: number): Card[] {
  const hand = s.hands[seat];
  const leading = s.trick.length === 0;
  if (s.trickNo === 0 && leading) {
    const two = hand.find((c) => c.id === TWO_CLUBS);
    return two ? [two] : hand;
  }
  if (leading) {
    if (!s.heartsBroken) {
      const nonHearts = hand.filter((c) => c.suit !== "H");
      if (nonHearts.length > 0) return nonHearts;
    }
    return hand;
  }
  const led = s.trick[0].card.suit;
  const inSuit = hand.filter((c) => c.suit === led);
  if (inSuit.length > 0) return inSuit;
  if (s.trickNo === 0) {
    const safe = hand.filter((c) => pointsOf(c) === 0);
    if (safe.length > 0) return safe;
  }
  return hand;
}

function trickWinner(trick: TrickCard[]): number {
  const led = trick[0].card.suit;
  let best = trick[0];
  for (const t of trick) {
    if (t.card.suit === led && effRank(t.card) > effRank(best.card)) best = t;
  }
  return best.seat;
}

function computeScores(taken: Card[][]): { scores: number[]; winner: number } {
  const raw = taken.map((cards) => cards.reduce((n, c) => n + pointsOf(c), 0));
  const shooter = raw.findIndex((p) => p === 26);
  const scores = shooter >= 0 ? raw.map((_, i) => (i === shooter ? 0 : 26)) : raw;
  let winner = 0;
  for (let i = 1; i < SEATS; i++) if (scores[i] < scores[winner]) winner = i;
  return { scores, winner };
}

export function applyMove(s: HeartsState, move: HeartsMove): HeartsState {
  if (s.phase !== "play") return s;
  const seat = s.turn;
  const card = s.hands[seat].find((c) => c.id === move.cardId);
  if (!card) return s;

  const hands = s.hands.map((h, i) => (i === seat ? h.filter((c) => c.id !== card.id) : h));
  const trick = [...s.trick, { seat, card }];
  const heartsBroken = s.heartsBroken || card.suit === "H";

  if (trick.length < SEATS) {
    return { ...s, hands, trick, heartsBroken, turn: (seat + 1) % SEATS };
  }

  // trick complete
  const winner = trickWinner(trick);
  const taken = s.taken.map((cards, i) =>
    i === winner ? [...cards, ...trick.map((t) => t.card)] : cards
  );
  const trickNo = s.trickNo + 1;
  if (trickNo === 13) {
    const { scores, winner: best } = computeScores(taken);
    return { ...s, hands, trick: [], lastTrick: trick, taken, heartsBroken, trickNo, phase: "done", scores, winner: best };
  }
  return {
    ...s,
    hands,
    trick: [],
    lastTrick: trick,
    taken,
    heartsBroken,
    trickNo,
    leader: winner,
    turn: winner,
  };
}

/** Risk-averse AI: duck under the trick when following, dump danger when void. */
export function aiMove(s: HeartsState, seat: number): HeartsMove {
  const legal = legalMoves(s, seat);
  const byRankAsc = (a: Card, b: Card) => effRank(a) - effRank(b);
  const leading = s.trick.length === 0;

  if (leading) {
    const sorted = legal.slice().sort(byRankAsc);
    return { cardId: sorted[0].id };
  }

  const led = s.trick[0].card.suit;
  const inSuit = legal.filter((c) => c.suit === led);
  if (inSuit.length > 0) {
    const curMax = Math.max(
      ...s.trick.filter((t) => t.card.suit === led).map((t) => effRank(t.card))
    );
    const under = inSuit.filter((c) => effRank(c) < curMax).sort(byRankAsc);
    if (under.length > 0) return { cardId: under[under.length - 1].id }; // highest safe duck
    const low = inSuit.slice().sort(byRankAsc)[0];
    return { cardId: low.id }; // forced to win — lose the least
  }

  // void in led suit — dump the most dangerous card
  const queen = legal.find((c) => c.suit === "S" && c.rank === 12);
  if (queen) return { cardId: queen.id };
  const hearts = legal.filter((c) => c.suit === "H").sort(byRankAsc);
  if (hearts.length > 0) return { cardId: hearts[hearts.length - 1].id };
  const highest = legal.slice().sort(byRankAsc);
  return { cardId: highest[highest.length - 1].id };
}
