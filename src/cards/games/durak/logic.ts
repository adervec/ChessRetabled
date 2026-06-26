import type { Card, Suit } from "../../core/cards.ts";
import { makeRng, shuffle } from "../../core/rng.ts";
import { makeDeck } from "../../core/cards.ts";

// Durak ("fool"), two seats (0 = human). 36-card deck (6→Ace), one trump shown
// at the bottom of the stock. The attacker lays cards; the defender must beat
// each with a higher card of the same suit or any trump (a higher trump beats a
// trump). The attacker may pile on more cards matching ranks already in play.
// Beat them all and the defender becomes the attacker; fail and the defender
// scoops up the lot. Empty your hand once the stock is gone to be safe — the last
// player holding cards is the durak.

export type DurakPhase = "attack" | "defend" | "done";

export interface TablePair { attack: Card; defense: Card | null }

export interface DurakState {
  seed: number;
  stock: Card[]; // trump card sits at the bottom, drawn last
  trump: Suit;
  trumpCard: Card;
  discard: number; // count of cards beaten off
  hands: [Card[], Card[]];
  attacker: number;
  table: TablePair[];
  phase: DurakPhase;
  loser: number | null; // the durak
  message: string;
}

const other = (p: number) => (p === 0 ? 1 : 0);
/** Durak rank: 6…K as themselves, Ace high. */
export function drank(rank: number): number {
  return rank === 1 ? 14 : rank;
}
export function makeDeck36(): Card[] {
  return makeDeck().filter((c) => c.rank >= 6 || c.rank === 1);
}
export function beats(def: Card, att: Card, trump: Suit): boolean {
  if (def.suit === att.suit) return drank(def.rank) > drank(att.rank);
  return def.suit === trump && att.suit !== trump;
}

export function initDurak(seed: number): DurakState {
  const deck = shuffle(makeDeck36(), makeRng(seed));
  const hands: [Card[], Card[]] = [deck.slice(0, 6), deck.slice(6, 12)];
  const trumpCard = deck[12];
  const stock = [...deck.slice(13), trumpCard]; // trump drawn last
  return {
    seed, stock, trump: trumpCard.suit, trumpCard, discard: 0, hands,
    attacker: 0, table: [], phase: "attack", loser: null,
    message: "Your attack — play a card.",
  };
}

const tableRanks = (t: TablePair[]): Set<number> => {
  const s = new Set<number>();
  for (const p of t) { s.add(p.attack.rank); if (p.defense) s.add(p.defense.rank); }
  return s;
};
const undefendedCount = (t: TablePair[]) => t.filter((p) => p.defense === null).length;

/** Cards the attacker may legally lay right now. */
export function legalAttacks(s: DurakState, seat: number): Card[] {
  if (s.phase !== "attack" && s.phase !== "defend") return [];
  if (seat !== s.attacker) return [];
  const defender = other(s.attacker);
  if (s.table.length >= 6) return [];
  if (undefendedCount(s.table) >= s.hands[defender].length) return []; // defender couldn't answer more
  if (s.table.length === 0) return s.hands[seat];
  const ranks = tableRanks(s.table);
  return s.hands[seat].filter((c) => ranks.has(c.rank));
}

/** Cards the defender may use to beat the current undefended attack. */
export function legalDefenses(s: DurakState, seat: number): Card[] {
  if (s.phase !== "defend" || seat !== other(s.attacker)) return [];
  const open = s.table.find((p) => p.defense === null);
  if (!open) return [];
  return s.hands[seat].filter((c) => beats(c, open.attack, s.trump));
}

function drawUp(s: DurakState): void {
  for (const seat of [s.attacker, other(s.attacker)]) {
    while (s.hands[seat].length < 6 && s.stock.length > 0) { s.hands[seat].push(s.stock[0]); s.stock = s.stock.slice(1); }
  }
}

function endIfOver(s: DurakState): void {
  if (s.stock.length > 0) return;
  const empty0 = s.hands[0].length === 0, empty1 = s.hands[1].length === 0;
  if (empty0 || empty1) {
    s.phase = "done";
    s.loser = empty0 && empty1 ? null : empty0 ? 1 : 0;
    s.message = s.loser === null ? "A draw!" : s.loser === 0 ? "You are the durak. 🤡" : "Rival is the durak! 🎉";
  }
}

export function attack(s: DurakState, cardId: string): DurakState {
  if (!legalAttacks(s, s.attacker).some((c) => c.id === cardId)) return s;
  const seat = s.attacker;
  const card = s.hands[seat].find((c) => c.id === cardId)!;
  const hands: [Card[], Card[]] = [s.hands[0].slice(), s.hands[1].slice()];
  hands[seat] = hands[seat].filter((c) => c.id !== cardId);
  const table = [...s.table, { attack: card, defense: null }];
  return { ...s, hands, table, phase: "defend", message: other(seat) === 0 ? "Defend!" : "Rival defends…" };
}

export function defend(s: DurakState, cardId: string): DurakState {
  const seat = other(s.attacker);
  if (!legalDefenses(s, seat).some((c) => c.id === cardId)) return s;
  const card = s.hands[seat].find((c) => c.id === cardId)!;
  const hands: [Card[], Card[]] = [s.hands[0].slice(), s.hands[1].slice()];
  hands[seat] = hands[seat].filter((c) => c.id !== cardId);
  const idx = s.table.findIndex((p) => p.defense === null); // beat only the first open attack
  const table = s.table.map((p, i) => (i === idx ? { attack: p.attack, defense: card } : p));
  return { ...s, hands, table, phase: "attack", message: s.attacker === 0 ? "Add a card or press Done." : "Rival considers another card…" };
}

/** Defender gives up and takes everything on the table. */
export function take(s: DurakState): DurakState {
  const def = other(s.attacker);
  const picked: Card[] = [];
  for (const p of s.table) { picked.push(p.attack); if (p.defense) picked.push(p.defense); }
  const hands: [Card[], Card[]] = [s.hands[0].slice(), s.hands[1].slice()];
  hands[def] = [...hands[def], ...picked];
  const st: DurakState = { ...s, hands, table: [], phase: "attack", message: "" };
  drawUp(st);
  st.message = st.attacker === 0 ? "Rival took the cards — attack again." : "You took the cards. Rival attacks.";
  endIfOver(st);
  return st;
}

/** Attacker ends the bout; all attacks were beaten, so the cards are discarded. */
export function done(s: DurakState): DurakState {
  if (s.phase !== "attack" || s.table.length === 0 || undefendedCount(s.table) > 0) return s;
  const beaten = s.table.reduce((n, p) => n + 1 + (p.defense ? 1 : 0), 0);
  const st: DurakState = { ...s, table: [], discard: s.discard + beaten, attacker: other(s.attacker), phase: "attack", message: "" };
  drawUp(st);
  st.message = st.attacker === 0 ? "Your attack." : "Rival attacks…";
  endIfOver(st);
  return st;
}

export interface DurakAct { type: "attack" | "defend" | "take" | "done"; cardId?: string }

export function aiAct(s: DurakState, seat: number): DurakAct {
  const low = (cards: Card[]) => cards.slice().sort((a, b) => (a.suit === s.trump ? 1 : 0) - (b.suit === s.trump ? 1 : 0) || drank(a.rank) - drank(b.rank));
  if (s.phase === "defend" && seat === other(s.attacker)) {
    const def = legalDefenses(s, seat);
    if (def.length === 0) return { type: "take" };
    // beat with the cheapest card; bail if it would cost a high trump on a low attack
    const open = s.table.find((p) => p.defense === null)!;
    const pick = low(def)[0];
    if (pick.suit === s.trump && open.attack.suit !== s.trump && drank(open.attack.rank) <= 9 && s.stock.length > 4) return { type: "take" };
    return { type: "defend", cardId: pick.id };
  }
  if (s.phase === "attack" && seat === s.attacker) {
    const atk = legalAttacks(s, seat);
    if (atk.length === 0 || (s.table.length > 0 && undefendedCount(s.table) === 0 && s.hands[seat].every((c) => c.suit === s.trump))) {
      if (s.table.length > 0 && undefendedCount(s.table) === 0) return { type: "done" };
    }
    if (atk.length === 0) return { type: "done" };
    // when continuing a bout, only pile on low non-trumps
    if (s.table.length > 0) {
      const cheap = low(atk).filter((c) => c.suit !== s.trump && drank(c.rank) <= 9);
      if (cheap.length === 0) return { type: "done" };
      return { type: "attack", cardId: cheap[0].id };
    }
    return { type: "attack", cardId: low(atk)[0].id };
  }
  return { type: "done" };
}

export function applyAct(s: DurakState, a: DurakAct): DurakState {
  if (a.type === "attack" && a.cardId) return attack(s, a.cardId);
  if (a.type === "defend" && a.cardId) return defend(s, a.cardId);
  if (a.type === "take") return take(s);
  return done(s);
}
