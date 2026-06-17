// Catalogue of card games. Each game is its own self-contained module (logic +
// a play component) sharing the card core and UI toolkit — the registry is just
// the lobby metadata; pages/Cards.tsx maps an id to its component.

export interface CardGameMeta {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  players: string;
}

export const CARD_GAMES: CardGameMeta[] = [
  {
    id: "klondike",
    name: "Solitaire",
    icon: "🃏",
    blurb: "Klondike — build the foundations up from Ace to King.",
    players: "1 player",
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
];
