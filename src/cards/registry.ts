// Catalogue of card games. Each game is its own self-contained module (logic +
// a play component) sharing the card core and UI toolkit — the registry is just
// the lobby metadata; pages/Cards.tsx maps an id to its component.

export interface CardGameMeta {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  players: string;
  /** "solo" = solitaire (clear/abandon); "versus" = win/loss/draw. Default versus. */
  kind?: "solo" | "versus";
}

export const CARD_GAMES: CardGameMeta[] = [
  {
    id: "klondike",
    name: "Solitaire",
    icon: "🃏",
    blurb: "Klondike — build the foundations up from Ace to King.",
    players: "1 player",
    kind: "solo",
  },
  {
    id: "pyramid",
    name: "Pyramid",
    icon: "🔺",
    blurb: "Pair exposed cards that add to 13 to dismantle the pyramid.",
    players: "1 player",
    kind: "solo",
  },
  {
    id: "golf",
    name: "Golf",
    icon: "⛳",
    blurb: "Clear the columns onto one pile, a rank up or down at a time.",
    players: "1 player",
    kind: "solo",
  },
  {
    id: "blackjack",
    name: "Blackjack",
    icon: "🂡",
    blurb: "Beat the dealer to 21 without busting. Blackjack pays 3:2.",
    players: "vs dealer",
  },
  {
    id: "crazy-eights",
    name: "Crazy Eights",
    icon: "8️⃣",
    blurb: "Shed your hand by matching rank or suit. Eights are wild.",
    players: "vs 3 AI",
  },
  {
    id: "hearts",
    name: "Hearts",
    icon: "♥️",
    blurb: "Trick-taking — dodge the hearts and the Queen of Spades.",
    players: "vs 3 AI",
  },
  {
    id: "poker",
    name: "Five-Card Draw",
    icon: "🂫",
    blurb: "Ante, draw, and make the best five-card hand to take the pot.",
    players: "vs dealer",
  },
  {
    id: "gofish",
    name: "Go Fish",
    icon: "🐟",
    blurb: "Ask for ranks and collect books of four. Most books wins.",
    players: "vs AI",
  },
  {
    id: "memory",
    name: "Memory",
    icon: "🧠",
    blurb: "Flip and match pairs from memory. Remember where they are!",
    players: "vs AI",
  },
  {
    id: "war",
    name: "War",
    icon: "⚔️",
    blurb: "Pure luck of the draw — high card wins, ties mean war.",
    players: "2 players",
  },
  {
    id: "holdem",
    name: "Texas Hold'em",
    icon: "🃏",
    blurb: "Hole cards, a community board, and a bet round — best five wins.",
    players: "vs dealer",
  },
  {
    id: "gin",
    name: "Gin Rummy",
    icon: "🌿",
    blurb: "Build sets and runs, cut your deadwood, and knock to win.",
    players: "vs AI",
  },
  {
    id: "oldmaid",
    name: "Old Maid",
    icon: "👵",
    blurb: "Match and discard pairs — don't get stuck with the lone queen.",
    players: "vs 2 AI",
  },
  {
    id: "briscola",
    name: "Briscola",
    icon: "🇮🇹",
    blurb: "Italian trick-taking with a trump suit — capture points to 61.",
    players: "vs AI",
  },
  {
    id: "scopa",
    name: "Scopa",
    icon: "🧹",
    blurb: "Italian capturing game — match or sum table cards, sweep for scope.",
    players: "vs AI",
  },
  {
    id: "cribbage",
    name: "Cribbage",
    icon: "🪵",
    blurb: "Peg to 121 — fifteens, runs, and the crib. Count your hand with the cut.",
    players: "vs AI",
  },
  {
    id: "durak",
    name: "Durak",
    icon: "🐻",
    blurb: "Russian attack-and-defend — beat off every card or don't be the fool.",
    players: "vs AI",
  },
  {
    id: "euchre",
    name: "Euchre",
    icon: "🍁",
    blurb: "Partnership trick-taking with bowers — name trump and take three of five.",
    players: "vs 3 AI",
  },
];
