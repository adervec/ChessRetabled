import type { Card, Suit } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";
import { makeDeck40, briscolaPoints, briscolaStrength } from "../../core/italian.ts";

// Briscola, two seats (0 = human). 40-card deck, 3-card hands, one trump suit
// (the briscola). No need to follow suit. Win a trick to capture its points and
// lead next; refill from the stock until it's empty. 120 points total — 61 wins.

export type BriscolaPhase = "play" | "done";
export interface TrickCard { seat: number; card: Card; }

export interface BriscolaState {
  seed: number;
  stock: Card[]; // trump card sits at the bottom (drawn last)
  trump: Suit;
  trumpCard: Card;
  hands: [Card[], Card[]];
  trick: TrickCard[];
  lastTrick: TrickCard[] | null;
  leader: number;
  turn: number;
  captured: [Card[], Card[]];
  phase: BriscolaPhase;
  scores: [number, number];
  winner: number | null;
  message: string;
}

export interface BriscolaMove { cardId: string; }

export function initBriscola(seed: number): BriscolaState {
  const deck = shuffle(makeDeck40(), makeRng(seed));
  const hands: [Card[], Card[]] = [deck.slice(0, 3), deck.slice(3, 6)];
  const trumpCard = deck[6];
  const stock = [...deck.slice(7), trumpCard]; // trump drawn last
  return {
    seed,
    stock,
    trump: trumpCard.suit,
    trumpCard,
    hands,
    trick: [],
    lastTrick: null,
    leader: 0,
    turn: 0,
    captured: [[], []],
    phase: "play",
    scores: [0, 0],
    winner: null,
    message: `Trump is ${trumpCard.suit}. Your lead.`,
  };
}

function winnerOf(trick: TrickCard[], trump: Suit): number {
  let best = trick[0];
  for (let i = 1; i < trick.length; i++) {
    const c = trick[i].card;
    const b = best.card;
    const cT = c.suit === trump;
    const bT = b.suit === trump;
    if (cT && !bT) best = trick[i];
    else if (cT === bT && c.suit === b.suit && briscolaStrength(c.rank) > briscolaStrength(b.rank)) best = trick[i];
  }
  return best.seat;
}

function points(cards: Card[]): number {
  return cards.reduce((n, c) => n + briscolaPoints(c.rank), 0);
}

export function legalPlays(s: BriscolaState, seat: number): Card[] {
  return s.turn === seat && s.phase === "play" ? s.hands[seat] : [];
}

export function applyMove(s: BriscolaState, move: BriscolaMove): BriscolaState {
  if (s.phase !== "play") return s;
  const seat = s.turn;
  const card = s.hands[seat].find((c) => c.id === move.cardId);
  if (!card) return s;

  const hands: [Card[], Card[]] = [s.hands[0].slice(), s.hands[1].slice()];
  hands[seat] = hands[seat].filter((c) => c.id !== card.id);
  const trick = [...s.trick, { seat, card }];

  if (trick.length < 2) {
    return { ...s, hands, trick, turn: (seat + 1) % 2, message: "" };
  }

  // resolve trick
  const w = winnerOf(trick, s.trump);
  const captured: [Card[], Card[]] = [s.captured[0].slice(), s.captured[1].slice()];
  captured[w] = [...captured[w], ...trick.map((t) => t.card)];

  // draw: winner first, then loser
  let stock = s.stock.slice();
  const order = [w, (w + 1) % 2];
  for (const p of order) {
    if (stock.length > 0) {
      hands[p] = [...hands[p], stock[0]];
      stock = stock.slice(1);
    }
  }

  const over = hands[0].length === 0 && hands[1].length === 0 && stock.length === 0;
  if (over) {
    const scores: [number, number] = [points(captured[0]), points(captured[1])];
    const winner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : null;
    return {
      ...s, hands, stock, trick: [], lastTrick: trick, captured, leader: w, turn: w, phase: "done", scores, winner,
      message: winner === 0 ? `You win ${scores[0]}–${scores[1]}! 🎉` : winner === 1 ? `You lose ${scores[0]}–${scores[1]}.` : `Tied 60–60.`,
    };
  }
  return { ...s, hands, stock, trick: [], lastTrick: trick, captured, leader: w, turn: w, message: w === 0 ? "You won the trick — your lead." : "Rival leads." };
}

export function aiMove(s: BriscolaState, seat: number): BriscolaMove {
  const hand = s.hands[seat];
  const byPts = (a: Card, b: Card) => briscolaPoints(a.rank) - briscolaPoints(b.rank) || briscolaStrength(a.rank) - briscolaStrength(b.rank);

  if (s.trick.length === 0) {
    // lead a low, point-free, non-trump card
    const safe = hand.filter((c) => c.suit !== s.trump && briscolaPoints(c.rank) === 0);
    const pool = safe.length ? safe : hand;
    return { cardId: pool.slice().sort(byPts)[0].id };
  }

  // following: can we win, and is it worth it?
  const leadCard = s.trick[0].card;
  const trickValue = briscolaPoints(leadCard.rank);
  const wins = hand.filter((c) => winnerOf([s.trick[0], { seat, card: c }], s.trump) === seat);
  if (wins.length > 0 && (trickValue >= 3 || s.stock.length === 0)) {
    // win as cheaply as possible (prefer non-trump, then low points)
    const nonTrumpWins = wins.filter((c) => c.suit !== s.trump);
    const pick = (nonTrumpWins.length ? nonTrumpWins : wins).slice().sort(byPts)[0];
    return { cardId: pick.id };
  }
  // otherwise dump the lowest-value card, keeping trumps
  const dumps = hand.filter((c) => c.suit !== s.trump);
  return { cardId: (dumps.length ? dumps : hand).slice().sort(byPts)[0].id };
}
