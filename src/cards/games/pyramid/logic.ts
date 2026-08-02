import type { Card } from "../../core/cards.ts";
import { makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";

// Pyramid solitaire. 28 cards in a 7-row pyramid + a stock. Remove exposed pairs
// that sum to 13 (A=1 … Q=12); a King (13) goes alone. Clear the pyramid to win.

export interface PyramidState {
  seed: number;
  pyramid: (Card | null)[]; // 28 slots, null = removed
  stock: Card[];
  waste: Card[];
  recycles: number;
  phase: "play" | "done";
  won: boolean;
}

export const PYRAMID_SLOTS = 28;
export const WASTE_REF = -1;

export function value(rank: number): number {
  return rank; // A=1 … K=13
}

function rowOf(i: number): number {
  let r = 0;
  while ((r + 1) * (r + 2) / 2 <= i) r++;
  return r;
}

/** The two slots that cover slot i from the row below (or null on the bottom row). */
export function coverers(i: number): [number, number] | null {
  const r = rowOf(i);
  if (r === 6) return null;
  const p = i - (r * (r + 1)) / 2;
  const below = ((r + 1) * (r + 2)) / 2;
  return [below + p, below + p + 1];
}

export function isExposed(s: PyramidState, i: number): boolean {
  if (s.pyramid[i] === null) return false;
  const cov = coverers(i);
  if (!cov) return true;
  return s.pyramid[cov[0]] === null && s.pyramid[cov[1]] === null;
}

export function initPyramid(seed: number): PyramidState {
  const deck = shuffle(makeDeck(), makeRng(seed));
  return {
    seed,
    pyramid: deck.slice(0, PYRAMID_SLOTS),
    stock: deck.slice(PYRAMID_SLOTS),
    waste: [],
    recycles: 0,
    phase: "play",
    won: false,
  };
}

function cardOfRef(s: PyramidState, ref: number): Card | null {
  if (ref === WASTE_REF) return s.waste[s.waste.length - 1] ?? null;
  return isExposed(s, ref) ? s.pyramid[ref] : null;
}

/** Remove one King or a pair summing to 13. refs are pyramid indices or WASTE_REF. */
export function removeRefs(s: PyramidState, refs: number[]): PyramidState {
  const cards = refs.map((r) => cardOfRef(s, r));
  if (cards.some((c) => c === null)) return s;
  const sum = cards.reduce((n, c) => n + value(c!.rank), 0);
  if (!((refs.length === 1 && sum === 13) || (refs.length === 2 && sum === 13))) return s;
  const pyramid = s.pyramid.slice();
  let waste = s.waste;
  for (const r of refs) {
    if (r === WASTE_REF) waste = waste.slice(0, -1);
    else pyramid[r] = null;
  }
  const won = pyramid.every((c) => c === null);
  return { ...s, pyramid, waste, won, phase: won ? "done" : "play" };
}

export function draw(s: PyramidState): PyramidState {
  if (s.stock.length === 0) return s;
  return { ...s, stock: s.stock.slice(0, -1), waste: [...s.waste, s.stock[s.stock.length - 1]] };
}

export function recycle(s: PyramidState): PyramidState {
  if (s.stock.length > 0 || s.waste.length === 0) return s;
  return { ...s, stock: s.waste.slice().reverse(), waste: [], recycles: s.recycles + 1 };
}

export function isWon(s: PyramidState): boolean {
  return s.pyramid.every((c) => c === null);
}

/** Exposed pyramid slots (for highlighting / the harness). */
export function exposedSlots(s: PyramidState): number[] {
  const out: number[] = [];
  for (let i = 0; i < PYRAMID_SLOTS; i++) if (isExposed(s, i)) out.push(i);
  return out;
}
