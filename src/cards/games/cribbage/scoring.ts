import type { Card } from "../../core/cards.ts";

// Cribbage scoring — the show (a 4-card hand plus the cut) and the play/pegging.
// Pure and exhaustively testable; the famous 29 hand exercises every show rule.

/** Pip value for fifteens and the running count: A=1, face = 10, others = rank. */
export function pipValue(rank: number): number {
  return rank > 10 ? 10 : rank;
}

function combos<T>(items: T[]): T[][] {
  const out: T[][] = [[]];
  for (const it of items) for (let i = out.length - 1; i >= 0; i--) out.push([...out[i], it]);
  return out;
}

/** Score a 4-card hand with the cut card. `isCrib` tightens the flush rule. */
export function countHand(hand: Card[], cut: Card, isCrib = false): number {
  const all = [...hand, cut];
  let score = 0;

  // fifteens
  for (const sub of combos(all)) if (sub.length >= 2 && sub.reduce((n, c) => n + pipValue(c.rank), 0) === 15) score += 2;

  // pairs
  const byRank = new Map<number, number>();
  for (const c of all) byRank.set(c.rank, (byRank.get(c.rank) ?? 0) + 1);
  for (const k of byRank.values()) score += (k * (k - 1)) / 2 * 2;

  // runs (consecutive ranks, multiplied by duplicates)
  const ranks = [...byRank.keys()].sort((a, b) => a - b);
  let i = 0;
  while (i < ranks.length) {
    let j = i;
    while (j + 1 < ranks.length && ranks[j + 1] === ranks[j] + 1) j++;
    const len = j - i + 1;
    if (len >= 3) {
      let mult = 1;
      for (let k = i; k <= j; k++) mult *= byRank.get(ranks[k])!;
      score += len * mult;
    }
    i = j + 1;
  }

  // flush
  if (isCrib) {
    if (all.every((c) => c.suit === all[0].suit)) score += 5;
  } else if (hand.every((c) => c.suit === hand[0].suit)) {
    score += hand.length + (cut.suit === hand[0].suit ? 1 : 0);
  }

  // nobs: a Jack in hand matching the cut's suit
  if (hand.some((c) => c.rank === 11 && c.suit === cut.suit)) score += 1;

  return score;
}

/** Points the just-played card scores in the pegging pile (the run since the last reset). */
export function pegPoints(pile: Card[], count: number): number {
  let pts = 0;
  if (count === 15) pts += 2;
  if (count === 31) pts += 2;
  // pairs: trailing cards of equal rank
  let same = 1;
  for (let i = pile.length - 2; i >= 0 && pile[i].rank === pile[pile.length - 1].rank; i--) same++;
  if (same >= 2) pts += same * (same - 1); // 2→2, 3→6, 4→12
  // runs: the longest trailing block (length ≥ 3) that is a set of consecutive ranks
  for (let r = pile.length; r >= 3; r--) {
    const tail = pile.slice(pile.length - r).map((c) => c.rank).sort((a, b) => a - b);
    let run = true;
    for (let i = 1; i < tail.length; i++) if (tail[i] !== tail[i - 1] + 1) { run = false; break; }
    if (run) { pts += r; break; }
  }
  return pts;
}
