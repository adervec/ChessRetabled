import type { Card, Suit } from "../../core/cards.ts";
import { SUITS, isRed, makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";

// Klondike solitaire (draw one, unlimited redeals). Pure + seeded. legalMoves /
// applyMove power both the UI and the verification harness; isWon checks the win.

export interface Pile {
  down: Card[]; // face-down
  up: Card[]; // face-up (top = last)
}

export interface KState {
  seed: number;
  tableau: Pile[]; // 7 piles
  foundations: Record<Suit, Card[]>;
  stock: Card[];
  waste: Card[];
  moves: number;
}

export type KMove =
  | { type: "draw" }
  | { type: "recycle" }
  | { type: "wf" } // waste → foundation
  | { type: "wt"; to: number } // waste → tableau
  | { type: "tf"; from: number } // tableau top → foundation
  | { type: "tt"; from: number; index: number; to: number }; // tableau run → tableau

export function initKlondike(seed: number): KState {
  const deck = shuffle(makeDeck(), makeRng(seed));
  const tableau: Pile[] = [];
  let k = 0;
  for (let p = 0; p < 7; p++) {
    const down: Card[] = [];
    for (let j = 0; j < p; j++) down.push(deck[k++]);
    const up = [deck[k++]];
    tableau.push({ down, up });
  }
  return {
    seed,
    tableau,
    foundations: { S: [], H: [], D: [], C: [] },
    stock: deck.slice(k),
    waste: [],
    moves: 0,
  };
}

function top<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

function canFoundation(card: Card, found: Record<Suit, Card[]>): boolean {
  return card.rank === found[card.suit].length + 1;
}

function canStack(card: Card, onto: Card | undefined): boolean {
  if (!onto) return card.rank === 13; // empty pile takes a King
  return isRed(card.suit) !== isRed(onto.suit) && onto.rank === card.rank + 1;
}

/** Is up[i..] a valid alternating-colour descending run? */
function validRun(up: Card[], i: number): boolean {
  for (let j = i; j < up.length - 1; j++) {
    if (!(isRed(up[j].suit) !== isRed(up[j + 1].suit) && up[j].rank === up[j + 1].rank + 1)) {
      return false;
    }
  }
  return true;
}

export function legalMoves(s: KState): KMove[] {
  const moves: KMove[] = [];
  if (s.stock.length > 0) moves.push({ type: "draw" });
  else if (s.waste.length > 0) moves.push({ type: "recycle" });

  const w = top(s.waste);
  if (w && canFoundation(w, s.foundations)) moves.push({ type: "wf" });
  if (w) {
    for (let q = 0; q < 7; q++) {
      if (canStack(w, top(s.tableau[q].up))) moves.push({ type: "wt", to: q });
    }
  }
  for (let p = 0; p < 7; p++) {
    const up = s.tableau[p].up;
    const t = top(up);
    if (t && canFoundation(t, s.foundations)) moves.push({ type: "tf", from: p });
    for (let i = 0; i < up.length; i++) {
      if (!validRun(up, i)) continue;
      const head = up[i];
      for (let q = 0; q < 7; q++) {
        if (q === p) continue;
        if (canStack(head, top(s.tableau[q].up))) moves.push({ type: "tt", from: p, index: i, to: q });
      }
    }
  }
  return moves;
}

function flipIfNeeded(pile: Pile): Pile {
  if (pile.up.length === 0 && pile.down.length > 0) {
    const down = pile.down.slice();
    const card = down.pop()!;
    return { down, up: [card] };
  }
  return pile;
}

export function applyMove(s: KState, m: KMove): KState {
  const moves = s.moves + 1;
  switch (m.type) {
    case "draw": {
      const card = s.stock[s.stock.length - 1];
      return { ...s, stock: s.stock.slice(0, -1), waste: [...s.waste, card], moves };
    }
    case "recycle": {
      return { ...s, stock: s.waste.slice().reverse(), waste: [], moves };
    }
    case "wf": {
      const card = top(s.waste)!;
      return {
        ...s,
        waste: s.waste.slice(0, -1),
        foundations: { ...s.foundations, [card.suit]: [...s.foundations[card.suit], card] },
        moves,
      };
    }
    case "wt": {
      const card = top(s.waste)!;
      const tableau = s.tableau.slice();
      tableau[m.to] = { ...tableau[m.to], up: [...tableau[m.to].up, card] };
      return { ...s, waste: s.waste.slice(0, -1), tableau, moves };
    }
    case "tf": {
      const pile = s.tableau[m.from];
      const card = top(pile.up)!;
      const tableau = s.tableau.slice();
      tableau[m.from] = flipIfNeeded({ down: pile.down, up: pile.up.slice(0, -1) });
      return {
        ...s,
        tableau,
        foundations: { ...s.foundations, [card.suit]: [...s.foundations[card.suit], card] },
        moves,
      };
    }
    case "tt": {
      const from = s.tableau[m.from];
      const run = from.up.slice(m.index);
      const tableau = s.tableau.slice();
      tableau[m.from] = flipIfNeeded({ down: from.down, up: from.up.slice(0, m.index) });
      tableau[m.to] = { ...tableau[m.to], up: [...tableau[m.to].up, ...run] };
      return { ...s, tableau, moves };
    }
  }
}

export function isWon(s: KState): boolean {
  return SUITS.reduce((n, su) => n + s.foundations[su].length, 0) === 52;
}

/** All cards across every zone — for the harness's conservation check. */
export function allCards(s: KState): Card[] {
  const cards: Card[] = [...s.stock, ...s.waste];
  for (const su of SUITS) cards.push(...s.foundations[su]);
  for (const p of s.tableau) cards.push(...p.down, ...p.up);
  return cards;
}
