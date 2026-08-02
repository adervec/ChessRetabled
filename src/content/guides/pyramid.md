# Pyramid

> A card game of quick arithmetic — clear the triangle one pair of thirteens at a time before the stock runs dry.

**At a glance** · 1 player · solo · 5–10 min · Play it under **Cards** (`/cards`).

## What it is

Pyramid Solitaire is a different animal from Klondike: there's no building runs, no red-on-black sequencing — just a triangular deal and a single question, asked over and over, of "does this pair add up to thirteen?" It's one of the oldest patience games still widely played, prized for being fast to learn and fast to play. The whole game is really just a chain of quick sums, which makes it oddly relaxing in a way sequence-building solitaires aren't.

## Goal

Clear every card out of the pyramid.

## The deck & setup

A standard 52-card deck, seeded and shuffled fresh each deal. 28 cards are dealt face-up into a triangle of seven rows (1 card in the top row, growing to 7 in the bottom row). The remaining 24 cards form the stock.

## Rules

1. A pyramid card is **exposed** — playable — only once both cards directly beneath it (in the row below) have been removed. The bottom row starts fully exposed.
2. Card values run Ace = 1 up through King = 13, ignoring suit entirely.
3. A **King (value 13) clears alone**, whether it's sitting exposed in the pyramid or sitting on top of the waste pile.
4. Any two exposed cards whose values **sum to 13** can be removed together — two pyramid cards, or one pyramid card paired with the waste pile's top card.
5. Draw the stock one card at a time onto the waste pile whenever you want a new card to pair with; the waste's top card is always available for pairing.
6. When the stock runs out, click it again to recycle the waste back into a fresh stock — this app allows **unlimited** passes through the deck.
7. You win the instant all 28 pyramid slots are empty; leftover stock or waste cards don't matter.

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Pyramid. Each deal is **seeded** and reproducible, and a finished game is recorded to your history and the Dashboard.
- **Unlimited redeals.** Unlike some traditional (especially casino) Pyramid rules that cap you to a few passes through the stock, this app lets you cycle the waste as many times as it takes.
- **Picking a pair.** Click one exposed card, then a second whose value completes 13 — or click a King alone to clear it instantly.
- **The 💡 hint.** Pyramid's hint clears a King first if one is exposed, then looks for the best available 13-pair, preferring a pair made of **two pyramid cards** over one that spends the waste card (since two pyramid cards uncovers more of the triangle), and only suggests drawing the stock when nothing pairs. Taking it marks the game **assisted**.

## Strategy

### Beginner
- **Take an available pair over blindly drawing the stock.** A pairing move is always progress; a stock draw is a gamble.
- **Clear an exposed King immediately.** It can never pair with anything, so leaving it sitting only blocks the row above it.
- **Scan the whole exposed row, not just the waste.** New players fixate on pairing against the waste card and miss pyramid-to-pyramid pairs.
- **Recompute what's exposed after every removal.** Clearing a pair can expose a brand-new pyramid card immediately — check the board fresh before drawing.

### Intermediate
- **Prefer pyramid-pyramid pairs over pyramid-waste pairs** when you have a choice — the waste is effectively inexhaustible, but every pyramid card you remove uncovers new play.
- **Track dead values.** If you've already removed all four 9s, any lingering 4 can never pair away naturally — you'll need to just draw past it, or it'll strand at the end.
- **Don't ignore a base-row card just because it looks "safe."** Everything in the bottom row is already exposed and eligible from the start; leaving it too long only delays your own progress.

### Advanced
- **Sequence your pair choices to unbury deep cards.** A card two rows up needs *both* of its coverers gone — think about which pairing order clears the covering cards soonest, not just which pair is available first.
- **Use the waste as a counting tool.** Because passes are unlimited, every card you've already seen on the waste tells you what's statistically left in the stock, letting you judge whether a stubborn exposed card is likely to find its partner soon or not at all.
- **Don't over-fixate on the pyramid at the expense of the stock.** Sometimes the fastest route to clearing a deep card is simply grinding through the stock for its specific partner rather than waiting on pyramid pairs to open it up.

## Traps & common mistakes

- **Leaving an exposed King unclaimed.** It does nothing but block the row above — always take it the moment it's available.
- **Fixating on the waste card** and missing a pyramid-pyramid pair that would uncover more of the triangle.
- **Forgetting dead values.** Chasing a partner for a card whose complement has already been fully used elsewhere wastes draws.
- **Pairing greedily near the top rows** before the base rows are thinned, leaving late-game slots that can never become exposed.
- **Clicking through pairs too fast to notice a King was sitting exposed the whole time**, especially once the board gets busy.

## A worked example

```
Exposed row: 6♠ 9♦ K♣
Waste top:   7♥

1. K♣ (value 13) clears alone — take it first; it can never pair.
2. 6♠ + 7♥ = 13 — take the pair, spending the waste card.
3. 9♦ is left exposed with no partner in sight — draw the stock
   looking for a 4, the only value that completes it.
```

## Glossary

- **Exposed** — a pyramid card whose two coverers below it are both already removed.
- **Coverer** — one of the two cards directly beneath a given pyramid card.
- **Value** — Ace=1 through King=13, ignoring suit; the number two cards must sum to reach 13.
- **Stock / waste** — the face-down draw pile and the face-up pile it feeds.
- **Recycle** — turning the waste back into a fresh stock once the stock is empty.

## Where to go next

For more solitaire patience, **Solitaire (Klondike)** and **Golf** offer very different clearing puzzles from the same single-player family. If quick addition is your favorite part of Pyramid, **Cribbage**'s fifteens will feel immediately familiar.
