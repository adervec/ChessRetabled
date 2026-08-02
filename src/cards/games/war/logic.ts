import type { Card } from "../../core/cards.ts";
import { makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";

// War — pure chance, two players. Highest card wins the battle; ties trigger a
// "war" (three down, one up). Won cards are shuffled back in to break cycles, with
// a hard round cap as a backstop, so games always terminate.

export type WarPhase = "play" | "done";

export interface WarBattle {
  stake0: Card[];
  stake1: Card[];
  wars: number;
  winner: number;
}

export interface WarState {
  seed: number;
  rounds: number;
  decks: [Card[], Card[]];
  lastBattle: WarBattle | null;
  phase: WarPhase;
  winner: number | null;
  message: string;
}

const ROUND_CAP = 4000;
function eff(c: Card): number {
  return c.rank === 1 ? 14 : c.rank;
}

export function initWar(seed: number): WarState {
  const deck = shuffle(makeDeck(), makeRng(seed));
  return {
    seed,
    rounds: 0,
    decks: [deck.slice(0, 26), deck.slice(26)],
    lastBattle: null,
    phase: "play",
    winner: null,
    message: "Flip to battle!",
  };
}

/** Resolve one full battle (including any wars) and award the cards. */
export function step(s: WarState): WarState {
  if (s.phase === "done") return s;
  const d0 = s.decks[0].slice();
  const d1 = s.decks[1].slice();
  const stake0: Card[] = [];
  const stake1: Card[] = [];
  let wars = 0;
  let battleWinner = -1;

  while (battleWinner < 0) {
    if (d0.length === 0) { battleWinner = 1; break; }
    if (d1.length === 0) { battleWinner = 0; break; }
    const c0 = d0.shift()!;
    const c1 = d1.shift()!;
    stake0.push(c0);
    stake1.push(c1);
    if (eff(c0) > eff(c1)) { battleWinner = 0; break; }
    if (eff(c1) > eff(c0)) { battleWinner = 1; break; }
    // tie → war: up to three face-down each, then loop draws the next face-up pair
    wars++;
    for (let k = 0; k < 3; k++) {
      if (d0.length > 0) stake0.push(d0.shift()!);
      if (d1.length > 0) stake1.push(d1.shift()!);
    }
  }

  const won = shuffle([...stake0, ...stake1], makeRng((s.seed + s.rounds * 2654435761) >>> 0));
  if (battleWinner === 0) d0.push(...won);
  else d1.push(...won);

  const rounds = s.rounds + 1;
  const over = d0.length === 0 || d1.length === 0 || rounds >= ROUND_CAP;
  const winner = over ? (d0.length > d1.length ? 0 : d1.length > d0.length ? 1 : null) : null;
  return {
    ...s,
    rounds,
    decks: [d0, d1],
    lastBattle: { stake0, stake1, wars, winner: battleWinner },
    phase: over ? "done" : "play",
    winner,
    message: over
      ? winner === 0 ? "You win the war! 🎉" : winner === 1 ? "The deck falls to your rival." : "A dead heat."
      : wars > 0 ? `WAR! (${wars}) — ${battleWinner === 0 ? "you take" : "they take"} ${stake0.length + stake1.length}` : battleWinner === 0 ? "You win the battle." : "They win the battle.",
  };
}
