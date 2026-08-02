# Solitaire

> The original patience game — one deck, seven piles, and the quiet satisfaction of a buried ace finally coming free.

**At a glance** · 1 player · solo · 15–25 min · Play it under **Cards** (`/cards`).

## What it is

Solitaire almost always means this game — Klondike — the tableau-and-foundation patience game that shipped with Windows for decades and taught a generation the rhythm of red-on-black. The name "solitaire" is itself a giveaway: this is a game of one, played against the deal rather than an opponent, where every setback is your own doing and every clever unblock feels entirely earned. This app deals the standard layout and draws the stock **one card at a time**, with **unlimited redeals** of the waste pile — a forgiving variant that keeps every deal theoretically workable through patience alone.

## Goal

Move all 52 cards onto the four foundations, each built up in suit from Ace to King.

## The deck & setup

A standard 52-card deck, seeded and shuffled fresh each deal. Seven tableau piles are dealt with 1, 2, 3, 4, 5, 6, and 7 cards respectively (28 cards total) — every pile face-down except its last card, which is turned face-up. The remaining 24 cards form the stock.

## Rules

1. Deal seven tableau piles (sizes 1–7), each topped by one face-up card; the rest of the deck becomes the stock.
2. Build the four foundations up by suit, starting from the Ace and ending at the King.
3. Build tableau piles **down** in an alternating red/black sequence (e.g. black 8 onto red 9).
4. Only a King (or a run headed by a King) may fill an empty tableau column.
5. A valid alternating, descending run of face-up cards can be moved as a single unit from one tableau pile to another.
6. Draw one card at a time from the stock to the waste pile; the waste's top card can be played to a foundation or a tableau pile.
7. When the stock is empty, click it again to recycle the waste back into a fresh stock — this app allows **unlimited** redeals.
8. Whenever a tableau pile's face-up cards are cleared away, its next face-down card automatically flips up.
9. You win the moment all 52 cards sit on the foundations.

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Solitaire. Every deal is **seeded**, so it's reproducible, and finished games are recorded to your history and the Dashboard.
- **A gentler Klondike.** This implementation draws one card at a time (not three) and lets you recycle the waste as many times as you like — real-world "Vegas" Klondike often caps redeals, but here you're never truly stuck on a deal you could otherwise solve.
- **Selecting and moving.** Click the waste or a tableau card to select it (selecting mid-pile grabs the whole run beneath it), then click a foundation or target column to move it there.
- **The 💡 hint.** Klondike's hint favors a foundation move first, then a run move that would uncover a hidden face-down card, then any other tableau or waste move, and finally the stock — the same priority a careful human would use. Taking it marks the game **assisted** in your history.
- **Move counter.** Every legal move — draws and recycles included — increments a visible counter, so a fast, efficient solve is easy to distinguish from a slow, grinding one at a glance.
- **Finishing up.** A win is logged with your total move count; "New deal" reshuffles with a fresh seed.

## Strategy

### Beginner
- **Uncover face-down cards before chasing foundations.** A move that flips a new tableau card is almost always worth more than banking a card you don't need yet.
- **Aces and 2s go to the foundation the instant they're playable** — they can never be useful sitting in the tableau.
- **Treat empty columns as precious.** Only fill one with a King you actually need there, not just the first King you see.
- **Draw before you stall.** If nothing on the board moves, work the stock — a fresh waste card is often the piece that unlocks everything else.
- **Select, then click the destination.** You don't drag in this app — click a card (or a run's top card) to select it, then click the foundation or column you want it to land on.

### Intermediate
- **Don't foundation a card you might still need to bridge a run.** Sending up a black 6 too early can strand a red 5 with nowhere to land.
- **Build with the next few moves in mind.** When you have a choice of where to place a card, prefer the pile that keeps the most tableau cards workable, not just the first legal spot.
- **Use the waste as a queue, not a dump.** Since redeals are unlimited here, you can afford to cycle through the stock more than once looking for the right card — don't force a bad placement just to clear the waste.
- **Move whole runs when it actually helps, not just because you can.** Relocating a long sequence to shuffle deck chairs wastes moves without progressing anything.

### Advanced
- **Plan two moves ahead through a run.** Before moving a sequence, check whether the card it exposes underneath actually helps you, not just whether the move itself is legal.
- **Count what's already visible.** With foundations, tableau, and waste all face-up, you can often deduce exactly which ranks remain buried in face-down piles — informing whether digging a particular column is worth the effort.
- **Because recycling is free, prioritize unblocking face-down cards over speed.** There's no penalty here for taking a slow, thorough route to a solve.
- **Recognize a truly dead deal early.** Occasionally every face-down card is trapped behind foundation-bound cards you've already sent up — when the waste starts repeating without progress, it's faster to start a new deal than to keep cycling.

## Traps & common mistakes

- **Racing cards to the foundation** just because you can — it often strands a card you needed a move later.
- **Ignoring a move that flips a hidden card** in favor of a "safer"-looking play elsewhere.
- **Filling an empty column reflexively** with any available King instead of waiting for the one that actually helps.
- **Forgetting a run must be a valid alternating sequence** — you can only move a legally-ordered stack, not an arbitrary group of face-up cards.
- **Cycling the same waste order endlessly** without changing your tableau, hoping a card will magically become playable — if the board hasn't changed, another lap won't help either.

## A worked example

```
Tableau col 2 (face up): 9♠ 8♥ 7♠
Tableau col 5 (face up): 10♦
Waste top:                7♦

Move the run 9♠-8♥-7♠ as a unit onto 10♦ — it's a legal alternating
sequence, and the move frees a face-down card under the 9♠.
The waste's 7♦ has nowhere obvious to land yet — draw again rather
than force it onto a pile that doesn't need it.
```

That single decision captures the game's whole texture: the run move was legal in more than one place, but only one destination actually paid off a hidden card, and the waste card was better left alone than forced somewhere it didn't belong.

## Glossary

- **Foundation** — one of four suit piles built up from Ace to King; filling all four wins the game.
- **Tableau** — the seven working piles where runs are built down in alternating colors.
- **Stock / waste** — the face-down draw pile and the face-up pile it feeds.
- **Run** — a valid alternating-color, descending sequence of face-up tableau cards, movable as one unit.
- **Redeal** — recycling the waste back into the stock once the stock runs dry.
- **Dead deal** — a layout with no remaining productive moves, however many times you cycle the stock.

## Where to go next

For more solitaire patience, try **Pyramid** and **Golf** — both single-player, both built on very different clearing rules. For a game that rewards the same quiet, plan-ahead thinking against an opponent, **Gin Rummy** is a natural next step.
