import type { Card } from "../../core/cards.ts";
import { makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";

// Golf solitaire. 7 columns of 5 cards over a single foundation. Move a column's
// top card to the foundation when it is one rank above or below the foundation
// top (no wrap). Draw from stock when stuck. Empty every column to win.

export interface GolfState {
  seed: number;
  columns: Card[][]; // 7 columns, last entry = top (playable)
  stock: Card[];
  foundation: Card[]; // last entry = current top
  phase: "play" | "done";
  won: boolean;
}

export const COLUMNS = 7;
export const PER_COLUMN = 5;

export function initGolf(seed: number): GolfState {
  const deck = shuffle(makeDeck(), makeRng(seed));
  const columns: Card[][] = [];
  let k = 0;
  for (let c = 0; c < COLUMNS; c++) columns.push(deck.slice(k, (k += PER_COLUMN)));
  const foundation = [deck[k++]];
  const stock = deck.slice(k);
  return { seed, columns, stock, foundation, phase: "play", won: false };
}

export function canPlay(card: Card, foundationTop: Card | undefined): boolean {
  if (!foundationTop) return false;
  return Math.abs(card.rank - foundationTop.rank) === 1;
}

/** Move the top of a column onto the foundation, if legal. */
export function playColumn(s: GolfState, col: number): GolfState {
  const column = s.columns[col];
  if (column.length === 0) return s;
  const card = column[column.length - 1];
  if (!canPlay(card, s.foundation[s.foundation.length - 1])) return s;
  const columns = s.columns.map((c, i) => (i === col ? c.slice(0, -1) : c));
  const foundation = [...s.foundation, card];
  const won = columns.every((c) => c.length === 0);
  return { ...s, columns, foundation, won, phase: won ? "done" : "play" };
}

export function draw(s: GolfState): GolfState {
  if (s.stock.length === 0) return s;
  return { ...s, stock: s.stock.slice(0, -1), foundation: [...s.foundation, s.stock[s.stock.length - 1]] };
}

/** Columns whose top card can currently be played. */
export function playableColumns(s: GolfState): number[] {
  const top = s.foundation[s.foundation.length - 1];
  const out: number[] = [];
  s.columns.forEach((c, i) => { if (c.length && canPlay(c[c.length - 1], top)) out.push(i); });
  return out;
}

export function isWon(s: GolfState): boolean {
  return s.columns.every((c) => c.length === 0);
}

export function isStuck(s: GolfState): boolean {
  return !isWon(s) && s.stock.length === 0 && playableColumns(s).length === 0;
}
