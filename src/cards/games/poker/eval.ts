import type { Card } from "../../core/cards.ts";

// 5-card poker hand evaluator. Ace is high, with the A-2-3-4-5 "wheel" treated as
// a 5-high straight. rankHand returns a category plus tiebreak ranks (high→low);
// compareHands orders two hands.

export const CATEGORY_NAMES = [
  "High Card", "Pair", "Two Pair", "Three of a Kind", "Straight",
  "Flush", "Full House", "Four of a Kind", "Straight Flush",
] as const;

export interface HandRank {
  category: number; // 0..8 (index into CATEGORY_NAMES)
  tiebreak: number[]; // ranks high→low for breaking ties within a category
  name: string;
}

export function rankHand(cards: Card[]): HandRank {
  const eff = cards.map((c) => (c.rank === 1 ? 14 : c.rank));
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);
  const sortedDesc = [...eff].sort((a, b) => b - a);
  const distinct = [...new Set(sortedDesc)];

  let straightHigh = 0;
  if (distinct.length === 5) {
    if (sortedDesc[0] - sortedDesc[4] === 4) straightHigh = sortedDesc[0];
    else if (sortedDesc.join(",") === "14,5,4,3,2") straightHigh = 5; // wheel
  }

  const cnt = new Map<number, number>();
  for (const r of eff) cnt.set(r, (cnt.get(r) ?? 0) + 1);
  const groups = [...cnt.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const pattern = groups.map((g) => g[1]).join("");
  const groupRanks = groups.map((g) => g[0]);

  let category: number;
  let tiebreak: number[];
  if (isFlush && straightHigh) { category = 8; tiebreak = [straightHigh]; }
  else if (pattern === "41") { category = 7; tiebreak = groupRanks; }
  else if (pattern === "32") { category = 6; tiebreak = groupRanks; }
  else if (isFlush) { category = 5; tiebreak = sortedDesc; }
  else if (straightHigh) { category = 4; tiebreak = [straightHigh]; }
  else if (pattern === "311") { category = 3; tiebreak = groupRanks; }
  else if (pattern === "221") { category = 2; tiebreak = groupRanks; }
  else if (pattern === "2111") { category = 1; tiebreak = groupRanks; }
  else { category = 0; tiebreak = sortedDesc; }

  const name = category === 8 && straightHigh === 14 ? "Royal Flush" : CATEGORY_NAMES[category];
  return { category, tiebreak, name };
}

/** >0 if a beats b, <0 if b beats a, 0 if tie. */
export function compareHands(a: HandRank, b: HandRank): number {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < Math.max(a.tiebreak.length, b.tiebreak.length); i++) {
    const d = (a.tiebreak[i] ?? 0) - (b.tiebreak[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
