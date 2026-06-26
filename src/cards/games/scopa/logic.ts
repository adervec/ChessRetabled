import type { Card } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";
import { makeDeck40, scopaValue, primeValue, COINS } from "../../core/italian.ts";

// Scopa, two seats (0 = human). 40-card Italian deck. Play a card to capture a
// table card of equal value, or a set of table cards summing to it — but an
// equal single must be taken in preference to a sum. Clearing the table is a
// "scopa". One round uses the whole deck (3-card hands re-dealt until the stock
// runs out); the last capturer sweeps the leftover table. Score: most cards,
// most coins (diamonds), the settebello (7♦), primiera, and a point per scopa.

export type ScopaPhase = "play" | "done";

export interface ScopaState {
  seed: number;
  stock: Card[];
  hands: [Card[], Card[]];
  table: Card[];
  captured: [Card[], Card[]];
  scopas: [number, number];
  lastCapturer: number; // -1 until someone captures
  turn: number;
  phase: ScopaPhase;
  scores: [number, number];
  breakdown: string;
  winner: number | null;
  message: string;
}

export interface ScopaMove { cardId: string; captureIds: string[] }

const SETTEBELLO = `${COINS}7`;

export function initScopa(seed: number): ScopaState {
  const deck = shuffle(makeDeck40(), makeRng(seed));
  const hands: [Card[], Card[]] = [deck.slice(0, 3), deck.slice(3, 6)];
  const table = deck.slice(6, 10);
  const stock = deck.slice(10);
  return {
    seed, stock, hands, table, captured: [[], []], scopas: [0, 0], lastCapturer: -1,
    turn: 0, phase: "play", scores: [0, 0], breakdown: "", winner: null,
    message: "Your turn — play a card to capture.",
  };
}

/** All capture sets for `card`: equal singles take precedence over sums. */
export function captureOptions(table: Card[], card: Card): Card[][] {
  const v = scopaValue(card.rank);
  const singles = table.filter((c) => scopaValue(c.rank) === v);
  if (singles.length) return singles.map((c) => [c]); // an equal card must be taken
  // otherwise any subset summing to v
  const out: Card[][] = [];
  const rec = (i: number, acc: Card[], sum: number): void => {
    if (sum === v && acc.length) { out.push(acc.slice()); return; }
    if (sum >= v || i >= table.length) return;
    rec(i + 1, [...acc, table[i]], sum + scopaValue(table[i].rank));
    rec(i + 1, acc, sum);
  };
  rec(0, [], 0);
  return out;
}

/** Pick the most valuable capture set automatically (settebello, then coins, then size). */
export function bestCapture(options: Card[][]): Card[] {
  const score = (set: Card[]) =>
    (set.some((c) => c.id === SETTEBELLO) ? 1000 : 0) +
    set.filter((c) => c.suit === COINS).length * 30 +
    set.length;
  return options.slice().sort((a, b) => score(b) - score(a))[0];
}

function dealIfNeeded(s: { hands: [Card[], Card[]]; stock: Card[] }): void {
  if (s.hands[0].length === 0 && s.hands[1].length === 0 && s.stock.length >= 6) {
    s.hands[0] = s.stock.slice(0, 3);
    s.hands[1] = s.stock.slice(3, 6);
    s.stock = s.stock.slice(6);
  }
}

export function applyMove(s: ScopaState, move: ScopaMove): ScopaState {
  if (s.phase !== "play") return s;
  const seat = s.turn;
  const card = s.hands[seat].find((c) => c.id === move.cardId);
  if (!card) return s;

  const hands: [Card[], Card[]] = [s.hands[0].slice(), s.hands[1].slice()];
  hands[seat] = hands[seat].filter((c) => c.id !== card.id);
  let table = s.table.slice();
  const captured: [Card[], Card[]] = [s.captured[0].slice(), s.captured[1].slice()];
  const scopas: [number, number] = [s.scopas[0], s.scopas[1]];
  let lastCapturer = s.lastCapturer;

  const capSet = move.captureIds.length ? move.captureIds : [];
  const taken = table.filter((c) => capSet.includes(c.id));
  let stock = s.stock.slice();

  if (taken.length) {
    table = table.filter((c) => !capSet.includes(c.id));
    captured[seat] = [...captured[seat], card, ...taken];
    lastCapturer = seat;
    const more = hands[0].length > 0 || hands[1].length > 0 || stock.length >= 6;
    if (table.length === 0 && more) scopas[seat]++; // sweep — but not on the very last card
  } else {
    table = [...table, card]; // trail
  }

  const next = { hands, stock };
  dealIfNeeded(next);
  const over = next.hands[0].length === 0 && next.hands[1].length === 0 && next.stock.length === 0;

  if (over) {
    // last capturer sweeps the rest of the table
    if (lastCapturer >= 0 && table.length) { captured[lastCapturer] = [...captured[lastCapturer], ...table]; table = []; }
    return score({ ...s, hands: next.hands, stock: next.stock, table, captured, scopas, lastCapturer, turn: (seat + 1) % 2 });
  }
  return {
    ...s, hands: next.hands, stock: next.stock, table, captured, scopas, lastCapturer,
    turn: (seat + 1) % 2,
    message: (seat + 1) % 2 === 0 ? "Your turn." : "Rival is thinking…",
  };
}

function primiera(cards: Card[]): number {
  const best: Record<string, number> = { S: 0, H: 0, D: 0, C: 0 };
  for (const c of cards) best[c.suit] = Math.max(best[c.suit], primeValue(c.rank));
  return best.S + best.H + best.D + best.C;
}

function score(s: ScopaState): ScopaState {
  const [a, b] = s.captured;
  const pts: [number, number] = [s.scopas[0], s.scopas[1]];
  const lines: string[] = [];
  const award = (label: string, x: number, y: number) => {
    if (x > y) { pts[0]++; lines.push(`${label}: you`); }
    else if (y > x) { pts[1]++; lines.push(`${label}: rival`); }
    else lines.push(`${label}: split`);
  };
  award("Cards", a.length, b.length);
  award("Coins", a.filter((c) => c.suit === COINS).length, b.filter((c) => c.suit === COINS).length);
  const seven = (cards: Card[]) => (cards.some((c) => c.id === SETTEBELLO) ? 1 : 0);
  award("Settebello", seven(a), seven(b));
  award("Primiera", primiera(a), primiera(b));
  if (s.scopas[0] || s.scopas[1]) lines.push(`Scope: ${s.scopas[0]}–${s.scopas[1]}`);
  const winner = pts[0] > pts[1] ? 0 : pts[1] > pts[0] ? 1 : null;
  return {
    ...s, phase: "done", scores: pts, winner, breakdown: lines.join(" · "),
    message: winner === 0 ? `You win ${pts[0]}–${pts[1]}! 🎉` : winner === 1 ? `You lose ${pts[0]}–${pts[1]}.` : `Tied ${pts[0]}–${pts[1]}.`,
  };
}

export function aiMove(s: ScopaState, seat: number): ScopaMove {
  const hand = s.hands[seat];
  let best: { move: ScopaMove; val: number } | null = null;
  for (const card of hand) {
    const opts = captureOptions(s.table, card);
    if (opts.length) {
      for (const set of opts) {
        const clears = s.table.length === set.length;
        const v = (clears ? 100 : 0) + (set.some((c) => c.id === SETTEBELLO) ? 50 : 0) +
          set.filter((c) => c.suit === COINS).length * 10 + set.length + scopaValue(card.rank) * 0.1;
        if (!best || v > best.val) best = { move: { cardId: card.id, captureIds: set.map((c) => c.id) }, val: v };
      }
    } else {
      // trailing: avoid handing the rival an easy capture — trail a low card
      const v = -scopaValue(card.rank) - 5;
      if (!best || v > best.val) best = { move: { cardId: card.id, captureIds: [] }, val: v };
    }
  }
  return best!.move;
}
