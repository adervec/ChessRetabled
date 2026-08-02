import type { Card, Suit } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";
import { makeDeck, SUITS } from "../../core/cards.ts";

// Euchre, four seats in partnerships: you (0) and seat 2 vs seats 1 and 3.
// 24-card deck (9→A). The Jack of trump is the right bower (top card) and the
// Jack of the same colour is the left bower (counts as trump, second). Order up
// the turned card or name a suit to set trump, follow suit, and take tricks.
// Makers need three of five (all five = 2 points, fewer than three = euchred,
// 2 to the defenders). First side to 10 wins.

export type EuchrePhase = "bid1" | "bid2" | "discard" | "play" | "handdone" | "done";
const team = (seat: number) => seat % 2; // 0 = you & seat 2, 1 = seats 1 & 3
const color = (s: Suit) => (s === "S" || s === "C" ? "b" : "r");

export interface EuchreState {
  seed: number;
  handNo: number;
  dealer: number;
  hands: Card[][]; // four hands of five (dealer holds six during discard)
  upCard: Card;
  phase: EuchrePhase;
  bidder: number;
  passes: number;
  trump: Suit | null;
  makers: number | null;
  leader: number;
  turn: number;
  trick: { seat: number; card: Card }[];
  tricks: [number, number]; // tricks won per team this hand
  scores: [number, number];
  winner: number | null;
  message: string;
}

export function makeDeck24(): Card[] {
  return makeDeck().filter((c) => c.rank >= 9 || c.rank === 1);
}

/** Effective suit, treating both bowers as trump. */
export function effSuit(card: Card, trump: Suit): Suit {
  return card.rank === 11 && color(card.suit) === color(trump) ? trump : card.suit;
}
const euchreOrder: Record<number, number> = { 1: 6, 13: 5, 12: 4, 11: 3, 10: 2, 9: 1 };

/** How strongly a card competes, given trump and the led effective suit. */
export function strength(card: Card, trump: Suit, led: Suit): number {
  if (effSuit(card, trump) === trump) {
    if (card.rank === 11 && card.suit === trump) return 1000; // right bower
    if (card.rank === 11) return 999; // left bower
    return 900 + euchreOrder[card.rank];
  }
  if (effSuit(card, trump) === led) return 500 + euchreOrder[card.rank];
  return 0;
}

export function legalPlays(hand: Card[], led: Suit | null, trump: Suit): Card[] {
  if (led === null) return hand;
  const follow = hand.filter((c) => effSuit(c, trump) === led);
  return follow.length ? follow : hand;
}

function deal(seed: number, handNo: number): { hands: Card[][]; upCard: Card } {
  const d = shuffle(makeDeck24(), makeRng(seed * 2003 + handNo));
  return { hands: [d.slice(0, 5), d.slice(5, 10), d.slice(10, 15), d.slice(15, 20)], upCard: d[20] };
}

export function initEuchre(seed: number): EuchreState {
  const dealer = makeRng(seed).int(4);
  const { hands, upCard } = deal(seed, 0);
  return {
    seed, handNo: 0, dealer, hands, upCard, phase: "bid1", bidder: (dealer + 1) % 4, passes: 0,
    trump: null, makers: null, leader: (dealer + 1) % 4, turn: (dealer + 1) % 4, trick: [],
    tricks: [0, 0], scores: [0, 0], winner: null,
    message: "Bidding — order it up or pass.",
  };
}

/** Hand strength if `suit` were trump (for the AI's bidding). */
function bidStrength(hand: Card[], suit: Suit): number {
  let v = 0;
  for (const c of hand) {
    if (effSuit(c, suit) === suit) v += c.rank === 11 && c.suit === suit ? 3.5 : c.rank === 11 ? 3 : 1 + euchreOrder[c.rank] * 0.15;
    else if (c.rank === 1) v += 0.5; // off-suit ace
  }
  return v;
}

export type EuchreBid =
  | { type: "orderup" } | { type: "pass" } | { type: "name"; suit: Suit } | { type: "discard"; cardId: string };

function startPlay(s: EuchreState): EuchreState {
  const leader = (s.dealer + 1) % 4;
  return { ...s, phase: "play", leader, turn: leader, trick: [], message: leader === 0 ? "Your lead." : "Rival leads…" };
}

function dealerPickup(s: EuchreState): EuchreState {
  // dealer takes the up-card; must discard down to five
  const hands = s.hands.map((h) => h.slice());
  hands[s.dealer] = [...hands[s.dealer], s.upCard];
  const st = { ...s, hands, trump: s.upCard.suit };
  if (s.dealer === 0) return { ...st, phase: "discard", message: "You're dealer — discard one card." };
  // AI dealer discards its weakest non-trump (or weakest overall)
  const trump = s.upCard.suit;
  const weak = hands[s.dealer].slice().sort((a, b) => strength(a, trump, a.suit) - strength(b, trump, b.suit))[0];
  hands[s.dealer] = hands[s.dealer].filter((c) => c.id !== weak.id);
  return startPlay({ ...st, hands });
}

export function applyBid(s: EuchreState, bid: EuchreBid): EuchreState {
  if (bid.type === "discard") {
    if (s.phase !== "discard") return s;
    const hands = s.hands.map((h) => h.slice());
    if (hands[s.dealer].length !== 6 || !hands[s.dealer].some((c) => c.id === bid.cardId)) return s;
    hands[s.dealer] = hands[s.dealer].filter((c) => c.id !== bid.cardId);
    return startPlay({ ...s, hands });
  }
  if (s.phase === "bid1") {
    if (bid.type === "orderup") return dealerPickup({ ...s, makers: team(s.bidder) });
    const passes = s.passes + 1;
    if (passes >= 4) return { ...s, phase: "bid2", passes: 0, bidder: (s.dealer + 1) % 4, message: "Name a suit or pass." };
    return { ...s, passes, bidder: (s.bidder + 1) % 4 };
  }
  if (s.phase === "bid2") {
    const down = s.upCard.suit;
    if (bid.type === "name" && bid.suit !== down) return startPlay({ ...s, trump: bid.suit, makers: team(s.bidder) });
    // pass — but the dealer is stuck and must name
    const passes = s.passes + 1;
    const nextBidder = (s.bidder + 1) % 4;
    return { ...s, passes, bidder: nextBidder, message: nextBidder === 0 ? "Name a suit or pass." : "" };
  }
  return s;
}

export function aiBid(s: EuchreState, seat: number): EuchreBid {
  if (s.phase === "discard") {
    const trump = s.trump!;
    const weak = s.hands[seat].slice().sort((a, b) => strength(a, trump, a.suit) - strength(b, trump, b.suit))[0];
    return { type: "discard", cardId: weak.id };
  }
  if (s.phase === "bid1") {
    // the dealer would also gain the up-card
    const hand = seat === s.dealer ? [...s.hands[seat], s.upCard] : s.hands[seat];
    return bidStrength(hand, s.upCard.suit) >= 4.2 ? { type: "orderup" } : { type: "pass" };
  }
  // bid2
  const down = s.upCard.suit;
  const choices = SUITS.filter((x) => x !== down);
  let best: Suit | null = null, bv = 0;
  for (const suit of choices) { const v = bidStrength(s.hands[seat], suit); if (v > bv) { bv = v; best = suit; } }
  const stuck = seat === s.dealer; // stick the dealer
  if (best && (bv >= 4 || stuck)) return { type: "name", suit: best };
  return { type: "pass" };
}

function trickWinner(trick: { seat: number; card: Card }[], trump: Suit): number {
  const led = effSuit(trick[0].card, trump);
  let best = trick[0];
  for (const t of trick) if (strength(t.card, trump, led) > strength(best.card, trump, led)) best = t;
  return best.seat;
}

function scoreHand(s: EuchreState): EuchreState {
  const makers = s.makers!;
  const made = s.tricks[makers];
  const scores: [number, number] = [s.scores[0], s.scores[1]];
  let msg: string;
  if (made >= 3) { const pts = made === 5 ? 2 : 1; scores[makers] += pts; msg = made === 5 ? "March! Makers take 2." : "Makers take 1."; }
  else { scores[1 - makers] += 2; msg = "Euchred! Defenders take 2."; }
  const winner = scores[0] >= 10 ? 0 : scores[1] >= 10 ? 1 : null;
  return { ...s, scores, winner, phase: winner !== null ? "done" : "handdone", message: winner !== null ? (winner === 0 ? "You win the game! 🎉" : "Rivals win the game.") : msg };
}

export function playCard(s: EuchreState, cardId: string): EuchreState {
  if (s.phase !== "play") return s;
  const seat = s.turn;
  const trump = s.trump!;
  const led = s.trick.length ? effSuit(s.trick[0].card, trump) : null;
  const legal = legalPlays(s.hands[seat], led, trump);
  const card = legal.find((c) => c.id === cardId);
  if (!card) return s;
  const hands = s.hands.map((h) => h.slice());
  hands[seat] = hands[seat].filter((c) => c.id !== card.id);
  const trick = [...s.trick, { seat, card }];
  if (trick.length < 4) return { ...s, hands, trick, turn: (seat + 1) % 4, message: "" };
  // resolve trick
  const w = trickWinner(trick, trump);
  const tricks: [number, number] = [s.tricks[0], s.tricks[1]];
  tricks[team(w)]++;
  const st: EuchreState = { ...s, hands, trick: [], leader: w, turn: w, tricks };
  if (hands.every((h) => h.length === 0)) return scoreHand(st);
  return { ...st, message: w === 0 ? "You won the trick — your lead." : "Rival leads…" };
}

export function aiPlay(s: EuchreState, seat: number): string {
  const trump = s.trump!;
  const led = s.trick.length ? effSuit(s.trick[0].card, trump) : null;
  const legal = legalPlays(s.hands[seat], led, trump);
  if (s.trick.length === 0) {
    // lead an off-suit ace if we have one (a likely winner), else a low non-trump
    // to keep our trump and bowers back for later tricks
    const offAce = legal.find((c) => effSuit(c, trump) !== trump && c.rank === 1);
    if (offAce) return offAce.id;
    const nonTrump = legal.filter((c) => effSuit(c, trump) !== trump);
    const pool = nonTrump.length ? nonTrump : legal;
    return pool.slice().sort((a, b) => strength(a, trump, a.suit) - strength(b, trump, b.suit))[0].id; // lowest
  }
  const curWin = trickWinner(s.trick, trump);
  const winningByPartner = team(curWin) === team(seat);
  const ledSuit = effSuit(s.trick[0].card, trump);
  const best = strength(s.trick.reduce((m, t) => (strength(t.card, trump, ledSuit) > strength(m.card, trump, ledSuit) ? t : m)).card, trump, ledSuit);
  const wins = legal.filter((c) => strength(c, trump, ledSuit) > best);
  if (!winningByPartner && wins.length) return wins.slice().sort((a, b) => strength(a, trump, ledSuit) - strength(b, trump, ledSuit))[0].id; // win cheaply
  return legal.slice().sort((a, b) => strength(a, trump, a.suit) - strength(b, trump, a.suit))[0].id; // else throw low
}

export function nextHand(s: EuchreState): EuchreState {
  if (s.winner !== null) return { ...s, phase: "done" };
  const handNo = s.handNo + 1;
  const dealer = (s.dealer + 1) % 4;
  const { hands, upCard } = deal(s.seed, handNo);
  return {
    ...s, handNo, dealer, hands, upCard, phase: "bid1", bidder: (dealer + 1) % 4, passes: 0,
    trump: null, makers: null, leader: (dealer + 1) % 4, turn: (dealer + 1) % 4, trick: [], tricks: [0, 0],
    message: "Bidding — order it up or pass.",
  };
}

/** Advance one AI / forced step; returns unchanged when it's the human's move. */
export function euchreStep(s: EuchreState): EuchreState {
  if (s.phase === "bid1" || s.phase === "bid2") return s.bidder === 0 ? s : applyBid(s, aiBid(s, s.bidder));
  if (s.phase === "discard") return s.dealer === 0 ? s : applyBid(s, aiBid(s, s.dealer));
  if (s.phase === "play") return s.turn === 0 ? s : playCard(s, aiPlay(s, s.turn));
  return s;
}
