import type { Card } from "../../core/cards.ts";
import { makeDeck } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";
import { blackjackValue } from "../../core/helpers.ts";

// Classic blackjack vs an automated dealer (stands on all 17, blackjack pays 3:2).
// Pure + seeded: each round reshuffles a fresh deck from seed+round, so a whole
// session is reproducible.

export type BJPhase = "bet" | "player" | "dealer" | "done";
export type BJResult = "win" | "loss" | "push" | "blackjack";

export interface BJState {
  seed: number;
  rounds: number;
  deck: Card[];
  player: Card[];
  dealer: Card[];
  chips: number;
  bet: number;
  phase: BJPhase;
  result: BJResult | null;
  message: string;
  doubled: boolean;
}

export function initBlackjack(seed: number, chips = 100): BJState {
  return {
    seed,
    rounds: 0,
    deck: [],
    player: [],
    dealer: [],
    chips,
    bet: 0,
    phase: "bet",
    result: null,
    message: "Place your bet to deal.",
    doubled: false,
  };
}

export function canDouble(s: BJState): boolean {
  return s.phase === "player" && s.player.length === 2 && s.chips >= s.bet;
}

function freshDeck(s: BJState): Card[] {
  return shuffle(makeDeck(), makeRng((s.seed + s.rounds * 2654435761) >>> 0));
}

export function placeBet(s: BJState, amount: number): BJState {
  if (s.phase !== "bet") return s;
  const bet = Math.max(1, Math.min(amount, s.chips));
  const deck = freshDeck(s);
  const player = [deck[0], deck[2]];
  const dealer = [deck[1], deck[3]];
  let st: BJState = {
    ...s,
    deck: deck.slice(4),
    player,
    dealer,
    chips: s.chips - bet,
    bet,
    phase: "player",
    result: null,
    doubled: false,
    message: "Hit or stand?",
  };
  const pv = blackjackValue(player).total;
  const dv = blackjackValue(dealer).total;
  if (pv === 21 || dv === 21) st = resolve({ ...st, phase: "dealer" });
  return st;
}

export function hit(s: BJState): BJState {
  if (s.phase !== "player") return s;
  const card = s.deck[0];
  const player = [...s.player, card];
  const st: BJState = { ...s, deck: s.deck.slice(1), player };
  if (blackjackValue(player).total > 21) return resolve({ ...st, phase: "dealer" });
  return st;
}

export function stand(s: BJState): BJState {
  if (s.phase !== "player") return s;
  return resolve({ ...s, phase: "dealer" });
}

export function double(s: BJState): BJState {
  if (!canDouble(s)) return s;
  const card = s.deck[0];
  const player = [...s.player, card];
  const st: BJState = {
    ...s,
    deck: s.deck.slice(1),
    player,
    chips: s.chips - s.bet,
    bet: s.bet * 2,
    doubled: true,
  };
  return resolve({ ...st, phase: "dealer" });
}

/** Dealer plays out, then settle chips and set the result. */
function resolve(s: BJState): BJState {
  let deck = s.deck;
  let dealer = s.dealer;
  const pv = blackjackValue(s.player).total;
  const playerBust = pv > 21;
  const playerBJ = pv === 21 && s.player.length === 2;

  // Dealer only draws if the player hasn't already busted.
  if (!playerBust) {
    while (blackjackValue(dealer).total < 17) {
      dealer = [...dealer, deck[0]];
      deck = deck.slice(1);
    }
  }
  const dv = blackjackValue(dealer).total;
  const dealerBust = dv > 21;
  const dealerBJ = dv === 21 && dealer.length === 2;

  let result: BJResult;
  let payout = 0;
  let message: string;
  if (playerBust) {
    result = "loss";
    message = `Bust at ${pv}. Dealer wins.`;
  } else if (playerBJ && !dealerBJ) {
    result = "blackjack";
    payout = Math.floor(s.bet * 2.5); // stake + 3:2
    message = "Blackjack! Pays 3:2.";
  } else if (dealerBJ && !playerBJ) {
    result = "loss";
    message = "Dealer has blackjack.";
  } else if (dealerBust) {
    result = "win";
    payout = s.bet * 2;
    message = `Dealer busts at ${dv}. You win!`;
  } else if (pv > dv) {
    result = "win";
    payout = s.bet * 2;
    message = `${pv} beats ${dv} — you win!`;
  } else if (pv < dv) {
    result = "loss";
    message = `${dv} beats ${pv}. Dealer wins.`;
  } else {
    result = "push";
    payout = s.bet;
    message = `Push at ${pv}.`;
  }

  return {
    ...s,
    deck,
    dealer,
    chips: s.chips + payout,
    phase: "done",
    result,
    message,
  };
}

// ponytail: simplified basic strategy (no splits/surrender)
export function basicStrategy(player: Card[], dealerUp: Card, canDouble: boolean): "hit" | "stand" | "double" {
  const { total, soft } = blackjackValue(player);
  const up = dealerUp.rank === 1 ? 11 : Math.min(dealerUp.rank, 10); // A=11, faces=10
  if (soft) {
    if (total <= 17) return "hit";
    if (total >= 19) return "stand";
    return up >= 2 && up <= 8 ? "stand" : "hit"; // soft 18
  }
  if (total >= 17) return "stand";
  if ((total === 10 || total === 11) && canDouble && up >= 2 && up <= 9) return "double";
  if (total <= 11) return "hit";
  return up >= 2 && up <= 6 ? "stand" : "hit"; // hard 12–16
}

export function nextRound(s: BJState): BJState {
  return {
    ...s,
    rounds: s.rounds + 1,
    player: [],
    dealer: [],
    bet: 0,
    phase: "bet",
    result: null,
    doubled: false,
    message: s.chips <= 0 ? "Out of chips — game over." : "Place your bet to deal.",
  };
}
