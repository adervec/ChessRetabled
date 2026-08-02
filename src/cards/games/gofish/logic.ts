import type { Card, Rank } from "../../core/cards.ts";
import { makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";

// Go Fish, two seats (0 = human, 1 = AI). Ask the opponent for a rank you hold;
// they hand over all of it and you go again, or you "go fish" from the ocean.
// Four of a rank = a book. Most books when the cards run out wins.

export type GFPhase = "ask" | "done";

export interface GFState {
  seed: number;
  hands: [Card[], Card[]];
  stock: Card[];
  books: [Rank[], Rank[]];
  /** Ranks each seat is publicly known to hold (from their asks) — AI memory. */
  known: [Rank[], Rank[]];
  turn: number;
  phase: GFPhase;
  message: string;
  winner: number | null;
  lastFish: boolean;
}

export interface GFMove {
  rank: Rank;
}

export function initGoFish(seed: number): GFState {
  const deck = shuffle(makeDeck(), makeRng(seed));
  const hands: [Card[], Card[]] = [deck.slice(0, 7), deck.slice(7, 14)];
  const s: GFState = {
    seed,
    hands,
    stock: deck.slice(14),
    books: [[], []],
    known: [[], []],
    turn: 0,
    phase: "ask",
    message: "Ask for a rank you hold.",
    winner: null,
    lastFish: false,
  };
  harvest(s, 0);
  harvest(s, 1);
  return normalize(s);
}

export function legalRanks(s: GFState, seat: number): Rank[] {
  return [...new Set(s.hands[seat].map((c) => c.rank))];
}

function addKnown(s: GFState, seat: number, rank: Rank) {
  if (!s.known[seat].includes(rank)) s.known[seat].push(rank);
}
function dropKnown(s: GFState, rank: Rank) {
  s.known = [s.known[0].filter((r) => r !== rank), s.known[1].filter((r) => r !== rank)];
}

/** Move completed books out of a hand. Mutates `s`. */
function harvest(s: GFState, seat: number) {
  for (let r = 1 as Rank; r <= 13; r = (r + 1) as Rank) {
    if (s.hands[seat].filter((c) => c.rank === r).length === 4) {
      s.hands[seat] = s.hands[seat].filter((c) => c.rank !== r);
      s.books[seat] = [...s.books[seat], r];
      dropKnown(s, r);
    }
  }
}

function totalBooks(s: GFState): number {
  return s.books[0].length + s.books[1].length;
}

/** Ensure the side to move can act; otherwise advance or end. Mutates + returns. */
function normalize(s: GFState): GFState {
  if (totalBooks(s) === 13) return finish(s);
  let guard = 0;
  while (guard++ < 10) {
    if (s.hands[s.turn].length > 0) return s;
    if (s.stock.length > 0) {
      s.hands[s.turn] = [...s.hands[s.turn], s.stock[0]];
      s.stock = s.stock.slice(1);
      harvest(s, s.turn);
      if (totalBooks(s) === 13) return finish(s);
      if (s.hands[s.turn].length > 0) return s;
    } else {
      // can't draw; if both empty, end; else pass
      if (s.hands[1 - s.turn].length === 0) return finish(s);
      s.turn = 1 - s.turn;
    }
  }
  return s;
}

function finish(s: GFState): GFState {
  const w = s.books[0].length > s.books[1].length ? 0 : s.books[1].length > s.books[0].length ? 1 : null;
  return { ...s, phase: "done", winner: w, message: w === 0 ? "Most books — you win! 🎉" : w === 1 ? "Your rival booked more." : "A tie!" };
}

export function applyMove(s0: GFState, move: GFMove): GFState {
  if (s0.phase !== "ask") return s0;
  const s: GFState = {
    ...s0,
    hands: [s0.hands[0].slice(), s0.hands[1].slice()],
    books: [s0.books[0].slice(), s0.books[1].slice()],
    known: [s0.known[0].slice(), s0.known[1].slice()],
    stock: s0.stock.slice(),
  };
  const seat = s.turn;
  const opp = 1 - seat;
  if (!s.hands[seat].some((c) => c.rank === move.rank)) return s0; // illegal
  addKnown(s, seat, move.rank);

  const give = s.hands[opp].filter((c) => c.rank === move.rank);
  if (give.length > 0) {
    s.hands[opp] = s.hands[opp].filter((c) => c.rank !== move.rank);
    s.hands[seat] = [...s.hands[seat], ...give];
    dropKnown(s, move.rank);
    addKnown(s, seat, move.rank);
    harvest(s, seat);
    s.message = `Seat ${seat} got ${give.length}×${move.rank}. Go again.`;
    s.lastFish = false;
    return normalize(s);
  }

  // go fish
  if (s.stock.length > 0) {
    const drawn = s.stock[0];
    s.stock = s.stock.slice(1);
    s.hands[seat] = [...s.hands[seat], drawn];
    harvest(s, seat);
    s.lastFish = true;
    if (drawn.rank === move.rank) {
      s.message = "Fished it — go again!";
      return normalize(s);
    }
    s.message = "Go fish.";
    s.turn = opp;
    return normalize(s);
  }

  s.turn = opp;
  s.lastFish = false;
  return normalize(s);
}

export function aiMove(s: GFState, seat: number): GFMove {
  const opp = 1 - seat;
  const ranks = legalRanks(s, seat);
  // best: a rank we hold that the opponent is known to hold
  const known = ranks.filter((r) => s.known[opp].includes(r));
  if (known.length > 0) return { rank: known[0] };
  // else ask for the rank we hold the most of
  const count = (r: Rank) => s.hands[seat].filter((c) => c.rank === r).length;
  return { rank: ranks.slice().sort((a, b) => count(b) - count(a))[0] };
}
