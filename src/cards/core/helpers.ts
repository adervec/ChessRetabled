import type { Card, Rank, Suit } from "./cards.ts";

// Small game-agnostic helpers used across several card games.

/** Sort by suit then rank (ascending), for tidy hands. */
export function sortHand(cards: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = { S: 0, H: 1, C: 2, D: 3 };
  return cards.slice().sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || a.rank - b.rank);
}

/** Group cards by rank (for rummy/go-fish style books). */
export function groupByRank(cards: Card[]): Map<Rank, Card[]> {
  const m = new Map<Rank, Card[]>();
  for (const c of cards) {
    const arr = m.get(c.rank) ?? [];
    arr.push(c);
    m.set(c.rank, arr);
  }
  return m;
}

/** Blackjack hand value: aces count 11 unless that busts, then 1. */
export function blackjackValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === 1) {
      aces++;
      total += 11;
    } else {
      total += Math.min(c.rank, 10); // J/Q/K = 10
    }
  }
  let soft = aces > 0;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
    soft = aces > 0;
  }
  return { total, soft };
}
