import type { Card, Suit } from "../../core/cards.ts";
import { SUITS, makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";

// Crazy Eights for 4 seats (seat 0 is the human). Match the discard's suit or
// rank, or play an 8 to choose a new suit. First to empty their hand wins.
// Rule simplification for clean turn flow: if you hold a playable card you must
// play it; otherwise you draw (reshuffling the discard if the stock is dry);
// only a truly dry table forces a pass.

export const SEATS = 4;
export const HAND_SIZE = 5;

export type C8Phase = "play" | "done";

export interface C8State {
  seed: number;
  reshuffles: number;
  hands: Card[][];
  stock: Card[];
  discard: Card[];
  activeSuit: Suit;
  turn: number;
  phase: C8Phase;
  winner: number | null;
  /** Consecutive passes — a full lap of passes ends the hand (rare deadlock). */
  passStreak: number;
  log: string[];
}

export type C8Move =
  | { type: "play"; cardId: string; suit?: Suit }
  | { type: "draw" }
  | { type: "pass" };

export function topCard(s: C8State): Card {
  return s.discard[s.discard.length - 1];
}

export function initCrazyEights(seed: number): C8State {
  const deck = shuffle(makeDeck(), makeRng(seed));
  const hands: Card[][] = [[], [], [], []];
  let k = 0;
  for (let n = 0; n < HAND_SIZE; n++) {
    for (let seat = 0; seat < SEATS; seat++) hands[seat].push(deck[k++]);
  }
  const discard = [deck[k++]];
  const stock = deck.slice(k);
  return {
    seed,
    reshuffles: 0,
    hands,
    stock,
    discard,
    activeSuit: discard[0].suit,
    turn: 0,
    phase: "play",
    winner: null,
    passStreak: 0,
    log: [],
  };
}

export function legalPlays(s: C8State, seat: number): Card[] {
  const top = topCard(s);
  return s.hands[seat].filter(
    (c) => c.rank === 8 || c.suit === s.activeSuit || c.rank === top.rank
  );
}

/** The only kind of action available to `seat` right now. */
export function options(s: C8State, seat: number): "play" | "draw" | "pass" {
  if (legalPlays(s, seat).length > 0) return "play";
  if (s.stock.length > 0 || s.discard.length > 1) return "draw";
  return "pass";
}

function advance(s: C8State): number {
  return (s.turn + 1) % SEATS;
}

function doPass(s: C8State): C8State {
  const passStreak = s.passStreak + 1;
  if (passStreak >= SEATS) {
    // deadlock: nobody can move — fewest cards wins
    let winner = 0;
    for (let i = 1; i < SEATS; i++) if (s.hands[i].length < s.hands[winner].length) winner = i;
    return { ...s, phase: "done", winner };
  }
  return { ...s, turn: advance(s), passStreak };
}

function mostCommonSuit(cards: Card[]): Suit {
  const count: Record<Suit, number> = { S: 0, H: 0, D: 0, C: 0 };
  for (const c of cards) if (c.rank !== 8) count[c.suit]++;
  let best: Suit = "S";
  for (const su of SUITS) if (count[su] > count[best]) best = su;
  return best;
}

export function applyMove(s: C8State, move: C8Move): C8State {
  const seat = s.turn;
  if (s.phase !== "play") return s;

  if (move.type === "play") {
    const hand = s.hands[seat];
    const card = hand.find((c) => c.id === move.cardId);
    if (!card) return s;
    const hands = s.hands.map((h, i) => (i === seat ? h.filter((c) => c.id !== card.id) : h));
    const discard = [...s.discard, card];
    const activeSuit = card.rank === 8 ? move.suit ?? card.suit : card.suit;
    if (hands[seat].length === 0) {
      return { ...s, hands, discard, activeSuit, phase: "done", winner: seat, passStreak: 0 };
    }
    return { ...s, hands, discard, activeSuit, turn: advance(s), passStreak: 0 };
  }

  if (move.type === "draw") {
    let stock = s.stock;
    let discard = s.discard;
    let reshuffles = s.reshuffles;
    if (stock.length === 0) {
      if (discard.length <= 1) return doPass(s); // truly dry → pass
      const top = discard[discard.length - 1];
      stock = shuffle(discard.slice(0, -1), makeRng((s.seed + 7919 * (reshuffles + 1)) >>> 0));
      discard = [top];
      reshuffles++;
    }
    const card = stock[0];
    const hands = s.hands.map((h, i) => (i === seat ? [...h, card] : h));
    return { ...s, hands, stock: stock.slice(1), discard, reshuffles, passStreak: 0 };
  }

  return doPass(s);
}

/** Heuristic policy for an AI seat: play if able (prefer non-8s), else draw/pass. */
export function aiMove(s: C8State, seat: number): C8Move {
  const plays = legalPlays(s, seat);
  if (plays.length > 0) {
    const nonEight = plays.filter((c) => c.rank !== 8);
    if (nonEight.length > 0) {
      // shed high cards first
      const card = nonEight.slice().sort((a, b) => b.rank - a.rank)[0];
      return { type: "play", cardId: card.id };
    }
    const eight = plays[0];
    return { type: "play", cardId: eight.id, suit: mostCommonSuit(s.hands[seat]) };
  }
  return options(s, seat) === "draw" ? { type: "draw" } : { type: "pass" };
}
