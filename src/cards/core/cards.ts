// Playing-card primitives shared by every card game.
//
// Like the board-games suite, all logic lives in `.ts` (no JSX) so the Node
// harness (scripts/validate-cards.mjs) can exercise it headlessly, and games are
// seeded so they're reproducible and serialisable for the archive.

export type Suit = "S" | "H" | "D" | "C";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13; // A=1 … K=13

export interface Card {
  /** Stable id (e.g. "S1", "HD" → "H13"); unique within a deck, drives animation. */
  id: string;
  suit: Suit;
  rank: Rank;
}

export const SUITS: Suit[] = ["S", "H", "D", "C"];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export const SUIT_SYMBOL: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_NAME: Record<Suit, string> = {
  S: "Spades",
  H: "Hearts",
  D: "Diamonds",
  C: "Clubs",
};

export function isRed(suit: Suit): boolean {
  return suit === "H" || suit === "D";
}

const RANK_LABEL: Record<Rank, string> = {
  1: "A", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7",
  8: "8", 9: "9", 10: "10", 11: "J", 12: "Q", 13: "K",
};
export function rankLabel(rank: Rank): string {
  return RANK_LABEL[rank];
}

export function cardId(suit: Suit, rank: Rank): string {
  return `${suit}${rank}`;
}

export function makeCard(suit: Suit, rank: Rank): Card {
  return { id: cardId(suit, rank), suit, rank };
}

/** A fresh, ordered 52-card deck. */
export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) deck.push(makeCard(s, r));
  return deck;
}

/** Short code like "AS", "TD", "KH" — handy for logs and tests. */
export function cardCode(c: Card): string {
  const r = c.rank === 10 ? "T" : RANK_LABEL[c.rank];
  return `${r}${c.suit}`;
}
