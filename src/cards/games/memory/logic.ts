import type { Card, Rank } from "../../core/cards.ts";
import { makeCard } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";

// Concentration / Memory, two seats (0 = human, 1 = AI). A board of 10 pairs
// (ranks A–10, spades + hearts). Flip two; a matching rank scores a pair and you
// go again, otherwise they flip back and the turn passes. Revealed cards are
// public knowledge (the `seen` map) — the AI plays from memory, you from yours.

export const PAIRS = 10;
export type MemPhase = "pick" | "resolve" | "done";

export interface MemState {
  seed: number;
  cards: Card[]; // board positions (fixed)
  matched: boolean[];
  faceUp: number[]; // 0, 1, or 2 revealed positions this turn
  seen: Record<number, Rank>; // every position ever revealed
  scores: [number, number];
  turn: number;
  phase: MemPhase;
  winner: number | null;
  message: string;
}

export function initMemory(seed: number): MemState {
  const base: Card[] = [];
  for (let r = 1; r <= PAIRS; r++) {
    base.push(makeCard("S", r as Rank));
    base.push(makeCard("H", r as Rank));
  }
  const cards = shuffle(base, makeRng(seed));
  return {
    seed,
    cards,
    matched: cards.map(() => false),
    faceUp: [],
    seen: {},
    scores: [0, 0],
    turn: 0,
    phase: "pick",
    winner: null,
    message: "Flip two cards.",
  };
}

function finish(scores: [number, number]): { winner: number | null; message: string } {
  const winner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : null;
  return {
    winner,
    message: winner === 0 ? "You found the most pairs! 🎉" : winner === 1 ? "Your rival remembered more." : "A tie!",
  };
}

export function reveal(s: MemState, pos: number): MemState {
  if (s.phase !== "pick") return s;
  if (s.matched[pos] || s.faceUp.includes(pos)) return s;
  const seen = { ...s.seen, [pos]: s.cards[pos].rank };

  if (s.faceUp.length === 0) {
    return { ...s, faceUp: [pos], seen, message: "Flip one more." };
  }

  const a = s.faceUp[0];
  if (s.cards[a].rank === s.cards[pos].rank) {
    const matched = s.matched.slice();
    matched[a] = true;
    matched[pos] = true;
    const scores: [number, number] = [s.scores[0], s.scores[1]];
    scores[s.turn]++;
    const done = matched.every(Boolean);
    const end = done ? finish(scores) : { winner: null, message: "Match — go again!" };
    return { ...s, matched, faceUp: [], seen, scores, phase: done ? "done" : "pick", winner: end.winner, message: end.message };
  }
  return { ...s, faceUp: [a, pos], seen, phase: "resolve", message: "No match." };
}

/** Clear a mismatched pair and pass the turn. */
export function resolve(s: MemState): MemState {
  if (s.phase !== "resolve") return s;
  return { ...s, faceUp: [], turn: 1 - s.turn, phase: "pick", message: "Opponent's turn." };
}

/** AI's next position to flip, using the shared `seen` memory. */
export function aiPick(s: MemState): number {
  const unmatched = s.cards.map((_, i) => i).filter((i) => !s.matched[i] && !s.faceUp.includes(i));
  const seenUnmatched = unmatched.filter((i) => s.seen[i] !== undefined);

  if (s.faceUp.length === 1) {
    const a = s.faceUp[0];
    const partner = seenUnmatched.find((i) => s.cards[i].rank === s.cards[a].rank);
    if (partner !== undefined) return partner; // complete a known match
  } else {
    // look for a fully-known pair
    for (let x = 0; x < seenUnmatched.length; x++) {
      for (let y = x + 1; y < seenUnmatched.length; y++) {
        if (s.cards[seenUnmatched[x]].rank === s.cards[seenUnmatched[y]].rank) return seenUnmatched[x];
      }
    }
  }
  // otherwise explore an unknown card (deterministic pick keeps the harness stable)
  const unknown = unmatched.filter((i) => s.seen[i] === undefined);
  const pool = unknown.length > 0 ? unknown : unmatched;
  return pool[(s.seed + unmatched.length) % pool.length];
}
