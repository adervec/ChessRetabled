import type { Card } from "../../core/cards.ts";
import { makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";

// Old Maid, three seats (0 = human, 1 & 2 = AI). One queen is removed so a single
// queen can never be paired. Discard pairs, then take turns drawing a hidden card
// from the next player; whoever is left holding the lone queen loses. Pure chance
// — your "move" is just choosing to draw — so it plays like War with a circle.

export type OMPhase = "play" | "done";

export interface OMState {
  seed: number;
  draws: number;
  hands: Card[][];
  turn: number;
  phase: OMPhase;
  loser: number | null;
  lastDraw: { from: number; by: number; card: Card; paired: boolean } | null;
  message: string;
}

const SEATS = 3;

function discardPairs(hand: Card[]): Card[] {
  const byRank = new Map<number, Card[]>();
  for (const c of hand) {
    const arr = byRank.get(c.rank) ?? [];
    arr.push(c);
    byRank.set(c.rank, arr);
  }
  const keep: Card[] = [];
  for (const arr of byRank.values()) {
    if (arr.length % 2 === 1) keep.push(arr[0]); // one left over when odd
  }
  return keep;
}

export function initOldMaid(seed: number): OMState {
  // remove one queen (Q♣) so there are three queens — one is the Old Maid
  const deck = shuffle(makeDeck().filter((c) => !(c.suit === "C" && c.rank === 12)), makeRng(seed));
  const hands: Card[][] = [[], [], []];
  deck.forEach((c, i) => hands[i % SEATS].push(c));
  for (let i = 0; i < SEATS; i++) hands[i] = discardPairs(hands[i]);
  return {
    seed,
    draws: 0,
    hands,
    turn: 0,
    phase: "play",
    loser: null,
    lastDraw: null,
    message: "Draw a card from the next player.",
  };
}

function nextActive(hands: Card[][], start: number): number {
  for (let k = 0; k < SEATS; k++) {
    const seat = (start + k) % SEATS;
    if (hands[seat].length > 0) return seat;
  }
  return -1;
}

function totalCards(hands: Card[][]): number {
  return hands.reduce((n, h) => n + h.length, 0);
}

/** The current player draws one hidden card from the next player and discards any new pair. */
export function step(s: OMState): OMState {
  if (s.phase !== "play") return s;
  const by = s.turn;
  const from = nextActive(s.hands, (by + 1) % SEATS);
  if (from === -1 || from === by) {
    return { ...s, phase: "done", loser: by, message: `Seat ${by} is the Old Maid!` };
  }
  const rng = makeRng((s.seed + s.draws * 2654435761) >>> 0);
  const idx = rng.int(s.hands[from].length);
  const card = s.hands[from][idx];

  const hands = s.hands.map((h) => h.slice());
  hands[from].splice(idx, 1);
  hands[by] = discardPairs([...hands[by], card]);
  const paired = hands[by].length <= s.hands[by].length; // pair removed if count didn't grow

  if (totalCards(hands) === 1) {
    const loser = hands.findIndex((h) => h.length === 1);
    return {
      ...s,
      draws: s.draws + 1,
      hands,
      phase: "done",
      loser,
      lastDraw: { from, by, card, paired },
      message: loser === 0 ? "You're stuck with the Old Maid! 😬" : `Seat ${loser} is the Old Maid — you're safe! 🎉`,
    };
  }

  const turn = nextActive(hands, (by + 1) % SEATS);
  return {
    ...s,
    draws: s.draws + 1,
    hands,
    turn,
    lastDraw: { from, by, card, paired },
    message: paired ? `Seat ${by} drew and matched!` : `Seat ${by} drew a card.`,
  };
}
