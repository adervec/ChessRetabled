import type { Card } from "../../core/cards.ts";
import { makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";
import { rankHand, compareHands, type HandRank } from "../poker/eval.ts";

// Heads-up Texas Hold'em vs the dealer, with a single betting round after the
// flop (check/bet, then call/fold). The whole board is dealt up front; only the
// flop shows during betting. Showdown picks the best five of seven via the shared
// poker evaluator.

export type HEPhase = "ready" | "bet" | "callfold" | "showdown";
export type HEResult = "win" | "loss" | "push";

export interface HEState {
  seed: number;
  round: number;
  hole: [Card[], Card[]];
  board: Card[]; // all five community cards
  revealed: number; // how many community cards are face-up (3 then 5)
  chips: number;
  ante: number;
  betSize: number;
  pot: number;
  phase: HEPhase;
  result: HEResult | null;
  showAi: boolean;
  playerRank: HandRank | null;
  aiRank: HandRank | null;
  message: string;
}

function combos5(cards: Card[]): Card[][] {
  const out: Card[][] = [];
  const n = cards.length;
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      for (let c = b + 1; c < n; c++)
        for (let d = c + 1; d < n; d++)
          for (let e = d + 1; e < n; e++)
            out.push([cards[a], cards[b], cards[c], cards[d], cards[e]]);
  return out;
}

/** Best 5-card hand from up to 7 cards. */
export function bestHand(cards: Card[]): HandRank {
  if (cards.length <= 5) return rankHand(cards);
  let best = rankHand(combos5(cards)[0]);
  for (const five of combos5(cards)) {
    const r = rankHand(five);
    if (compareHands(r, best) > 0) best = r;
  }
  return best;
}

export function initHoldem(seed: number, chips = 100, ante = 10, betSize = 20): HEState {
  return {
    seed, round: 0, hole: [[], []], board: [], revealed: 0,
    chips, ante, betSize, pot: 0, phase: "ready", result: null,
    showAi: false, playerRank: null, aiRank: null,
    message: "Ante up to deal.",
  };
}

export function deal(s: HEState): HEState {
  if (s.chips < s.ante) return { ...s, message: "Not enough chips." };
  const deck = shuffle(makeDeck(), makeRng((s.seed + s.round * 40503) >>> 0));
  return {
    ...s,
    hole: [[deck[0], deck[2]], [deck[1], deck[3]]],
    board: [deck[4], deck[5], deck[6], deck[7], deck[8]],
    revealed: 3,
    chips: s.chips - s.ante,
    pot: s.ante * 2,
    phase: "bet",
    result: null,
    showAi: false,
    playerRank: null,
    aiRank: null,
    message: "Flop's out — check or bet.",
  };
}

function aiCategory(s: HEState): number {
  return bestHand([...s.hole[1], ...s.board.slice(0, s.revealed)]).category;
}

function settle(s: HEState, result: HEResult, showAi: boolean, message: string): HEState {
  const payout = result === "win" ? s.pot : result === "push" ? Math.floor(s.pot / 2) : 0;
  return { ...s, chips: s.chips + payout, phase: "showdown", result, showAi, message };
}

function showdown(s: HEState): HEState {
  const board = s.board;
  const playerRank = bestHand([...s.hole[0], ...board]);
  const aiRank = bestHand([...s.hole[1], ...board]);
  const cmp = compareHands(playerRank, aiRank);
  const base = { ...s, revealed: 5, playerRank, aiRank };
  if (cmp > 0) return settle(base, "win", true, `${playerRank.name} beats ${aiRank.name} — you win!`);
  if (cmp < 0) return settle(base, "loss", true, `${aiRank.name} beats ${playerRank.name}.`);
  return settle(base, "push", true, `Split pot — both ${playerRank.name}.`);
}

export function playerCheck(s: HEState): HEState {
  if (s.phase !== "bet") return s;
  if (aiCategory(s) >= 2) {
    return { ...s, phase: "callfold", pot: s.pot + s.betSize, message: `Dealer bets ${s.betSize}. Call or fold?` };
  }
  return showdown(s);
}

export function playerBet(s: HEState): HEState {
  if (s.phase !== "bet" || s.chips < s.betSize) return s;
  const st = { ...s, chips: s.chips - s.betSize, pot: s.pot + s.betSize };
  if (aiCategory(s) >= 1) {
    return showdown({ ...st, pot: st.pot + st.betSize });
  }
  return settle({ ...st, revealed: 5 }, "win", false, "Dealer folds — you take the pot!");
}

export function playerCall(s: HEState): HEState {
  if (s.phase !== "callfold" || s.chips < s.betSize) return s;
  return showdown({ ...s, chips: s.chips - s.betSize, pot: s.pot + s.betSize });
}

export function playerFold(s: HEState): HEState {
  if (s.phase !== "callfold") return s;
  return settle({ ...s, revealed: 5 }, "loss", false, "You fold. Dealer wins.");
}

export function nextRound(s: HEState): HEState {
  return {
    ...s, round: s.round + 1, phase: "ready", pot: 0, result: null, revealed: 0,
    message: s.chips < s.ante ? "Out of chips." : "Ante up to deal.",
  };
}
