import type { Card } from "../../core/cards.ts";
import { makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";
import { bestMeld, bestDiscard } from "./melds.ts";

// Gin rummy, single hand vs the AI (seat 0 human). Draw from stock or discard,
// then discard one — or knock when your deadwood is ≤10 (gin at 0). No lay-offs;
// the lower deadwood wins, with an undercut bonus to the defender.

export type GinPhase = "draw" | "discard" | "done";
export type GinResult = "win" | "loss";

export interface GinState {
  seed: number;
  hands: [Card[], Card[]];
  stock: Card[];
  discard: Card[];
  turn: number;
  phase: GinPhase;
  winner: number | null;
  result: GinResult | null;
  scores: [number, number];
  message: string;
}

export function deadwood(hand: Card[]): number {
  return bestMeld(hand).deadwoodValue;
}

export function initGin(seed: number): GinState {
  const deck = shuffle(makeDeck(), makeRng(seed));
  return {
    seed,
    hands: [deck.slice(0, 10), deck.slice(10, 20)],
    stock: deck.slice(21),
    discard: [deck[20]],
    turn: 0,
    phase: "draw",
    winner: null,
    result: null,
    scores: [0, 0],
    message: "Draw from the stock or the discard pile.",
  };
}

export function drawStock(s: GinState): GinState {
  if (s.phase !== "draw" || s.stock.length === 0) return s;
  const card = s.stock[0];
  const hands = s.hands.map((h, i) => (i === s.turn ? [...h, card] : h)) as [Card[], Card[]];
  return { ...s, hands, stock: s.stock.slice(1), phase: "discard", message: "Discard a card." };
}

export function drawDiscard(s: GinState): GinState {
  if (s.phase !== "draw" || s.discard.length === 0) return s;
  const card = s.discard[s.discard.length - 1];
  const hands = s.hands.map((h, i) => (i === s.turn ? [...h, card] : h)) as [Card[], Card[]];
  return { ...s, hands, discard: s.discard.slice(0, -1), phase: "discard", message: "Discard a card." };
}

export function discardCard(s: GinState, cardId: string): GinState {
  if (s.phase !== "discard") return s;
  const seat = s.turn;
  if (!s.hands[seat].some((c) => c.id === cardId)) return s;
  const hands = s.hands.map((h, i) => (i === seat ? h.filter((c) => c.id !== cardId) : h)) as [Card[], Card[]];
  const card = s.hands[seat].find((c) => c.id === cardId)!;
  const next = (seat + 1) % 2;
  // if the next player can't draw (stock empty), end the hand by exhaustion
  const stockEmpty = s.stock.length === 0;
  const base: GinState = { ...s, hands, discard: [...s.discard, card], turn: next, phase: "draw", message: "" };
  if (stockEmpty) return endHand(base, null);
  return { ...base, message: `Seat ${next} to draw.` };
}

export function canKnock(s: GinState): boolean {
  if (s.phase !== "discard") return false;
  return bestDiscard(s.hands[s.turn]).deadwoodValue <= 10;
}

/** Knock by discarding the deadwood-minimising card and comparing hands. */
export function knock(s: GinState, cardId?: string): GinState {
  if (s.phase !== "discard") return s;
  const seat = s.turn;
  const choice = cardId ?? bestDiscard(s.hands[seat]).cardId;
  const card = s.hands[seat].find((c) => c.id === choice);
  if (!card) return s;
  const hand = s.hands[seat].filter((c) => c.id !== choice);
  const hands = s.hands.map((h, i) => (i === seat ? hand : h)) as [Card[], Card[]];
  const base: GinState = { ...s, hands, discard: [...s.discard, card] };
  return endHand(base, seat);
}

function endHand(s: GinState, knocker: number | null): GinState {
  const dw0 = deadwood(s.hands[0]);
  const dw1 = deadwood(s.hands[1]);
  let winner: number;
  let points: number;
  let message: string;

  if (knocker === null) {
    // stock exhausted — lower deadwood wins, no bonus
    winner = dw0 <= dw1 ? 0 : 1;
    points = Math.abs(dw0 - dw1);
    message = `Stock empty. Seat ${winner} wins by ${points}.`;
  } else {
    const kDw = knocker === 0 ? dw0 : dw1;
    const oDw = knocker === 0 ? dw1 : dw0;
    if (kDw === 0) {
      winner = knocker;
      points = 25 + oDw;
      message = `Gin! Seat ${knocker} scores ${points}.`;
    } else if (kDw < oDw) {
      winner = knocker;
      points = oDw - kDw;
      message = `Knock — seat ${knocker} wins by ${points}.`;
    } else {
      winner = (knocker + 1) % 2;
      points = kDw - oDw + 25; // undercut bonus
      message = `Undercut! Seat ${winner} steals it (+${points}).`;
    }
  }
  const scores: [number, number] = [0, 0];
  scores[winner] = points;
  return {
    ...s,
    phase: "done",
    winner,
    result: winner === 0 ? "win" : "loss",
    scores,
    message: winner === 0 ? message.replace(/Seat 0/g, "You") + " 🎉" : message,
  };
}

/** Run a full turn for the side to move (used by the AI and the harness). */
export function aiTurn(s: GinState): GinState {
  if (s.phase !== "draw") return s;
  const seat = s.turn;
  const top = s.discard[s.discard.length - 1];
  const base = deadwood(s.hands[seat]);
  const withTop = top ? bestDiscard([...s.hands[seat], top]).deadwoodValue : Infinity;

  let s2: GinState;
  if (s.discard.length > 0 && withTop < base) s2 = drawDiscard(s);
  else if (s.stock.length > 0) s2 = drawStock(s);
  else return endHand({ ...s }, null);

  const pick = bestDiscard(s2.hands[seat]);
  if (pick.deadwoodValue <= 10) return knock(s2, pick.cardId);
  return discardCard(s2, pick.cardId);
}
