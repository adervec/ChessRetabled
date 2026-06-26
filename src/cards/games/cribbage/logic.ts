import type { Card } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";
import { makeDeck } from "../../core/cards.ts";
import { countHand, pegPoints, pipValue } from "./scoring.ts";

// Two-handed Cribbage to 121. Deal six, each lays two in the dealer's crib, cut a
// starter (his heels = 2 for the dealer on a Jack), peg through the play to 31s
// and gos, then count the show — pone first, dealer, then the crib. Whoever
// reaches 121 first wins; pone counting first can matter on the last hand.

export type CribPhase = "discard" | "play" | "show" | "done";
const HUMAN = 0;
const other = (p: number) => (p === 0 ? 1 : 0);

export interface CribbageState {
  seed: number;
  dealNo: number;
  dealer: number;
  hands: [Card[], Card[]]; // six, then the kept four
  crib: Card[];
  discarded: [boolean, boolean];
  cut: Card | null;
  deck: Card[]; // undealt cards; the cut is taken from here
  phase: CribPhase;
  toPlay: [Card[], Card[]]; // unplayed cards in the pegging
  pile: Card[]; // current run since the last 31/go
  count: number;
  turn: number;
  lastPlayer: number;
  scores: [number, number];
  showText: string;
  winner: number | null;
  message: string;
}

function deal(seed: number, dealNo: number): { hands: [Card[], Card[]]; deck: Card[] } {
  const d = shuffle(makeDeck(), makeRng(seed * 1009 + dealNo));
  return { hands: [d.slice(0, 6), d.slice(6, 12)], deck: d.slice(12) };
}

export function initCribbage(seed: number): CribbageState {
  const dealer = makeRng(seed).int(2);
  const { hands, deck } = deal(seed, 0);
  return {
    seed, dealNo: 0, dealer, hands, crib: [], discarded: [false, false], cut: null, deck,
    phase: "discard", toPlay: [[], []], pile: [], count: 0, turn: other(dealer), lastPlayer: -1,
    scores: [0, 0], showText: "", winner: null,
    message: "Choose two cards for the crib.",
  };
}

/** Rough value of keeping four cards (fifteens + pairs + runs, no cut). */
function score4(cards: Card[]): number {
  let s = 0;
  const sub = (() => { const o: Card[][] = [[]]; for (const c of cards) for (let i = o.length - 1; i >= 0; i--) o.push([...o[i], c]); return o; })();
  for (const x of sub) if (x.length >= 2 && x.reduce((n, c) => n + pipValue(c.rank), 0) === 15) s += 2;
  const by = new Map<number, number>();
  for (const c of cards) by.set(c.rank, (by.get(c.rank) ?? 0) + 1);
  for (const k of by.values()) s += k * (k - 1);
  const rk = [...by.keys()].sort((a, b) => a - b);
  let i = 0;
  while (i < rk.length) { let j = i; while (j + 1 < rk.length && rk[j + 1] === rk[j] + 1) j++; if (j - i + 1 >= 3) s += j - i + 1; i = j + 1; }
  return s;
}

export function aiDiscardChoice(s: CribbageState, seat: number): string[] {
  const hand = s.hands[seat];
  let best: { ids: string[]; val: number } | null = null;
  for (let a = 0; a < hand.length; a++) for (let b = a + 1; b < hand.length; b++) {
    const keep = hand.filter((_, i) => i !== a && i !== b);
    const val = score4(keep);
    if (!best || val > best.val) best = { ids: [hand[a].id, hand[b].id], val };
  }
  return best!.ids;
}

export function discard(s: CribbageState, seat: number, ids: string[]): CribbageState {
  if (s.phase !== "discard" || s.discarded[seat] || ids.length !== 2) return s;
  const give = s.hands[seat].filter((c) => ids.includes(c.id));
  if (give.length !== 2) return s;
  const hands: [Card[], Card[]] = [s.hands[0].slice(), s.hands[1].slice()];
  hands[seat] = hands[seat].filter((c) => !ids.includes(c.id));
  const crib = [...s.crib, ...give];
  const discarded: [boolean, boolean] = [s.discarded[0], s.discarded[1]];
  discarded[seat] = true;
  let st: CribbageState = { ...s, hands, crib, discarded };
  if (discarded[0] && discarded[1]) {
    const cut = st.deck[0];
    const scores: [number, number] = [st.scores[0], st.scores[1]];
    let winner = st.winner;
    let msg = "The play: pone leads.";
    if (cut.rank === 11) { scores[st.dealer] = Math.min(121, scores[st.dealer] + 2); if (scores[st.dealer] >= 121) winner = st.dealer; msg = "His heels! Dealer pegs 2."; } // Jack cut
    st = {
      ...st, cut, scores, winner, phase: winner !== null ? "done" : "play",
      toPlay: [hands[0].slice(), hands[1].slice()], pile: [], count: 0, turn: other(st.dealer), lastPlayer: -1,
      message: winner !== null ? `Game over.` : msg,
    };
  }
  return st;
}

export function playablePeg(s: CribbageState, seat: number): Card[] {
  if (s.phase !== "play" || s.turn !== seat) return [];
  return s.toPlay[seat].filter((c) => s.count + pipValue(c.rank) <= 31);
}

function addScore(s: CribbageState, seat: number, pts: number): void {
  s.scores[seat] = Math.min(121, s.scores[seat] + pts);
  if (s.scores[seat] >= 121 && s.winner === null) s.winner = seat;
}

export function playPeg(s: CribbageState, cardId: string): CribbageState {
  if (s.phase !== "play") return s;
  const seat = s.turn;
  const card = s.toPlay[seat].find((c) => c.id === cardId);
  if (!card || s.count + pipValue(card.rank) > 31) return s;
  const toPlay: [Card[], Card[]] = [s.toPlay[0].slice(), s.toPlay[1].slice()];
  toPlay[seat] = toPlay[seat].filter((c) => c.id !== card.id);
  const pile = [...s.pile, card];
  const count = s.count + pipValue(card.rank);
  const st: CribbageState = { ...s, toPlay, pile, count, lastPlayer: seat, scores: [s.scores[0], s.scores[1]], winner: s.winner };
  addScore(st, seat, pegPoints(pile, count));
  if (count === 31) { st.pile = []; st.count = 0; st.lastPlayer = -1; }
  st.turn = other(seat);
  if (st.winner !== null) { st.phase = "done"; st.message = "Game over."; }
  else st.message = st.turn === HUMAN ? "Your play." : "Rival plays…";
  return st;
}

export function aiPegChoice(s: CribbageState, seat: number): string {
  const opts = playablePeg(s, seat);
  let best = opts[0], bestVal = -1;
  for (const c of opts) {
    const v = pegPoints([...s.pile, c], s.count + pipValue(c.rank)) - (s.count + pipValue(c.rank) === 21 ? 0.3 : 0);
    if (v > bestVal) { bestVal = v; best = c; }
  }
  return best.id;
}

function enterShow(s: CribbageState): CribbageState {
  const st: CribbageState = { ...s, scores: [s.scores[0], s.scores[1]], winner: s.winner };
  const cut = st.cut!;
  const pone = other(st.dealer);
  const lines: string[] = [];
  const tally = (seat: number, cards: Card[], label: string, crib = false) => {
    if (st.winner !== null) return;
    const pts = countHand(cards, cut, crib);
    addScore(st, seat, pts);
    lines.push(`${label}: ${pts}`);
  };
  tally(pone, st.hands[pone], pone === HUMAN ? "Your hand" : "Rival hand");
  tally(st.dealer, st.hands[st.dealer], st.dealer === HUMAN ? "Your hand" : "Rival hand");
  tally(st.dealer, st.crib, st.dealer === HUMAN ? "Your crib" : "Rival crib", true);
  st.phase = st.winner !== null ? "done" : "show";
  st.showText = lines.join(" · ");
  st.message = st.winner !== null ? `Game over — ${st.winner === HUMAN ? "you win!" : "you lose."}` : "The show — tap to deal again.";
  return st;
}

export function nextDeal(s: CribbageState): CribbageState {
  if (s.winner !== null) return { ...s, phase: "done" };
  const dealNo = s.dealNo + 1;
  const dealer = other(s.dealer);
  const { hands, deck } = deal(s.seed, dealNo);
  return {
    ...s, dealNo, dealer, hands, crib: [], discarded: [false, false], cut: null, deck,
    phase: "discard", toPlay: [[], []], pile: [], count: 0, turn: other(dealer), lastPlayer: -1,
    showText: "", message: "Choose two cards for the crib.",
  };
}

/** Advance any non-human / forced step (AI discard, AI peg, go/last-card, the show). */
export function cribStep(s: CribbageState): CribbageState {
  if (s.phase === "discard") {
    if (!s.discarded[1]) return discard(s, 1, aiDiscardChoice(s, 1));
    return s; // await the human's discard
  }
  if (s.phase === "play") {
    if (s.toPlay[0].length === 0 && s.toPlay[1].length === 0) return enterShow(s);
    const seat = s.turn;
    if (playablePeg(s, seat).length > 0) {
      if (seat === HUMAN) return s; // await the human's card
      return playPeg(s, aiPegChoice(s, seat));
    }
    // seat cannot play
    const otherCan = s.toPlay[other(seat)].some((c) => s.count + pipValue(c.rank) <= 31);
    if (otherCan) return { ...s, turn: other(seat), message: seat === HUMAN ? "You say go." : "Rival says go." };
    // neither can play → last card / go, then reset
    const st: CribbageState = { ...s, scores: [s.scores[0], s.scores[1]], winner: s.winner };
    const pegger = st.lastPlayer;
    if (pegger >= 0 && st.pile.length) addScore(st, pegger, 1); // a point for the go / last card
    st.pile = []; st.count = 0; st.lastPlayer = -1;
    if (st.winner !== null) { st.phase = "done"; st.message = "Game over."; return st; }
    if (st.toPlay[0].length === 0 && st.toPlay[1].length === 0) return enterShow(st);
    st.turn = pegger >= 0 ? other(pegger) : seat;
    st.message = st.turn === HUMAN ? "Your play." : "Rival plays…";
    return st;
  }
  return s;
}
