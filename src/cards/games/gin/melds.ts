import type { Card } from "../../core/cards.ts";

// Gin rummy meld analysis. Finds the arrangement of a hand into sets (3–4 of a
// rank) and runs (3+ in suit, ace low) that MINIMISES deadwood, via exact
// weighted set-packing over candidate melds (hands are ≤11 cards, so a bitmask
// DP is instant). This is the testable core both the AI and scoring rely on.

export function cardValue(rank: number): number {
  if (rank === 1) return 1; // ace low, worth 1
  return rank >= 10 ? 10 : rank; // J/Q/K = 10
}

export interface MeldAnalysis {
  melds: Card[][];
  deadwood: Card[];
  deadwoodValue: number;
}

export function bestMeld(hand: Card[]): MeldAnalysis {
  const n = hand.length;
  const val = hand.map((c) => cardValue(c.rank));
  const totalVal = val.reduce((a, b) => a + b, 0);
  const cands: { mask: number; value: number; idx: number[] }[] = [];

  function addCand(idx: number[]) {
    let mask = 0;
    let value = 0;
    for (const i of idx) { mask |= 1 << i; value += val[i]; }
    cands.push({ mask, value, idx: idx.slice() });
  }

  // sets (same rank)
  const byRank = new Map<number, number[]>();
  hand.forEach((c, i) => { const a = byRank.get(c.rank) ?? []; a.push(i); byRank.set(c.rank, a); });
  for (const idxs of byRank.values()) {
    if (idxs.length === 3) addCand(idxs);
    else if (idxs.length === 4) {
      addCand(idxs);
      for (let drop = 0; drop < 4; drop++) addCand(idxs.filter((_, k) => k !== drop));
    }
  }

  // runs (same suit, consecutive ranks, ace low)
  const bySuit = new Map<string, number[]>();
  hand.forEach((c, i) => { const a = bySuit.get(c.suit) ?? []; a.push(i); bySuit.set(c.suit, a); });
  for (const idxs of bySuit.values()) {
    const sorted = idxs.slice().sort((a, b) => hand[a].rank - hand[b].rank);
    let run: number[] = [];
    const emit = (r: number[]) => {
      for (let a = 0; a < r.length; a++)
        for (let b = a + 2; b < r.length; b++) addCand(r.slice(a, b + 1));
    };
    for (let k = 0; k < sorted.length; k++) {
      if (run.length === 0 || hand[sorted[k]].rank === hand[run[run.length - 1]].rank + 1) {
        run.push(sorted[k]);
      } else if (hand[sorted[k]].rank === hand[run[run.length - 1]].rank) {
        // duplicate rank in suit shouldn't happen; skip
      } else {
        emit(run);
        run = [sorted[k]];
      }
    }
    emit(run);
  }

  const containing: number[][] = Array.from({ length: n }, () => []);
  cands.forEach((c, ci) => { for (const i of c.idx) containing[i].push(ci); });

  const full = (1 << n) - 1;
  const memo = new Map<number, { value: number; melds: number[] }>();
  function best(done: number): { value: number; melds: number[] } {
    if (done === full) return { value: 0, melds: [] };
    const hit = memo.get(done);
    if (hit) return hit;
    let i = 0;
    while (done & (1 << i)) i++;
    let res = best(done | (1 << i)); // leave card i as deadwood
    for (const ci of containing[i]) {
      const c = cands[ci];
      if ((c.mask & done) === 0) {
        const sub = best(done | c.mask);
        if (c.value + sub.value > res.value) res = { value: c.value + sub.value, melds: [ci, ...sub.melds] };
      }
    }
    memo.set(done, res);
    return res;
  }

  const r = best(0);
  const meldMask = r.melds.reduce((mm, ci) => mm | cands[ci].mask, 0);
  return {
    melds: r.melds.map((ci) => cands[ci].idx.map((i) => hand[i])),
    deadwood: hand.filter((_, i) => !(meldMask & (1 << i))),
    deadwoodValue: totalVal - r.value,
  };
}

/** From an 11-card hand, the discard that leaves the lowest deadwood. */
export function bestDiscard(hand: Card[]): { cardId: string; deadwoodValue: number; deadwood: Card[] } {
  let best = { cardId: hand[0].id, deadwoodValue: Infinity, deadwood: [] as Card[] };
  for (const c of hand) {
    const remaining = hand.filter((x) => x.id !== c.id);
    const a = bestMeld(remaining);
    if (a.deadwoodValue < best.deadwoodValue) {
      best = { cardId: c.id, deadwoodValue: a.deadwoodValue, deadwood: a.deadwood };
    }
  }
  return best;
}
