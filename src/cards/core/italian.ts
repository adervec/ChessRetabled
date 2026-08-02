import type { Card } from "./cards.ts";
import { makeDeck } from "./cards.ts";

// Helpers for the 40-card Italian deck (no 8/9/10) and the value tables Briscola
// and Scopa use. Suits map to the Italian ones for scoring: Diamonds = coins
// (denari), so the 7♦ is the settebello.

export function makeDeck40(): Card[] {
  return makeDeck().filter((c) => c.rank <= 7 || c.rank >= 11);
}

const BRISCOLA_POINTS: Record<number, number> = { 1: 11, 3: 10, 13: 4, 12: 3, 11: 2 };
export function briscolaPoints(rank: number): number {
  return BRISCOLA_POINTS[rank] ?? 0;
}

// Trick strength, weakest → strongest: 2 4 5 6 7 J Q K 3 A
const STRENGTH = [2, 4, 5, 6, 7, 11, 12, 13, 3, 1];
export function briscolaStrength(rank: number): number {
  return STRENGTH.indexOf(rank);
}

/** Scopa capture value: A=1 … 7=7, J=8, Q=9, K=10. */
export function scopaValue(rank: number): number {
  return rank <= 7 ? rank : rank - 3;
}

// Primiera "prime" points per rank.
const PRIME: Record<number, number> = {
  7: 21, 6: 18, 1: 16, 5: 15, 4: 14, 3: 13, 2: 12, 11: 10, 12: 10, 13: 10,
};
export function primeValue(rank: number): number {
  return PRIME[rank] ?? 0;
}

export const COINS = "D"; // Diamonds stand in for the Italian coins suit
