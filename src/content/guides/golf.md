# Golf

> A brisk one-round patience game with no suits and no colors — just chase a card one rank away, again and again, until every column is empty.

**At a glance** · 1 player · solo · 5–10 min · Play it under **Cards** (`/cards`).

## What it is

Golf Solitaire borrows its name and its "keep the number low" spirit from the sport, though this app plays the streamlined single-round version rather than tallying strokes across nine or eighteen deals. What sets it apart from Klondike or Pyramid is that **suit and color don't matter at all** — the only question at every moment is whether a card's rank sits exactly one above or below the pile you're building. That single rule makes it fast, almost meditative, and very easy to see the whole board at a glance.

## Goal

Clear every one of the seven tableau columns onto the foundation pile.

## The deck & setup

A standard 52-card deck, seeded and shuffled fresh each deal. Seven columns are dealt with 5 face-up cards each (35 cards total); one more card starts the foundation pile. The remaining 16 cards form the stock.

## Rules

1. Only the exposed bottom card of each column is playable at any time.
2. A column's exposed card may move onto the foundation if its rank is **exactly one higher or one lower** than the foundation's current top card. Suit is irrelevant, and there's **no wrap** — a King and an Ace are never adjacent.
3. Playing a card exposes the next card up in that column.
4. You may draw from the stock **at any time**, not only when you're stuck — sometimes deliberately changing the foundation's top rank opens up more columns than continuing to play the obvious move does.
5. The stock does **not** recycle. Once it's empty, you're working only with whatever the columns currently expose.
6. If no column has a playable card and the stock is empty, the round ends unsolved.
7. You win the moment all seven columns are emptied (35 cards played to the foundation).

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Golf. Every deal is **seeded** and reproducible, and a finished round — won or stuck — is recorded to your history and the Dashboard.
- **No recycling, by design.** Unlike Klondike and Pyramid in this app, Golf's stock is single-pass — once it's gone, the round lives or dies on the columns you have left exposed.
- **Playing.** Click any column's bottom (exposed) card when it's legal to move it to the foundation; click the stock pile to draw.
- **The 💡 hint.** Golf's hint favors a column play that keeps a chain going — one where the newly-exposed card underneath, or another column's current top, would also be immediately playable — over just any legal move, and suggests drawing only when no column has a play. Taking it marks the round **assisted**.
- **Finishing up.** A win logs a "cleared every column" result; getting stuck logs the round as unfinished with the remaining card count.

## Strategy

### Beginner
- **Check every column before you draw.** A voluntary stock draw can't be undone, so never draw past a play you haven't considered.
- **Take a legal move over hesitating** — with no scoring penalty for the number of moves, there's no reason to sit on a playable card.
- **Watch for Kings and Aces looking "close."** They aren't — there's no wraparound, so a King next to a foundation Ace is a dead end, not a play.

### Intermediate
- **Prefer plays that thin the shortest columns first.** Getting a column all the way to zero matters more for your options than shaving one card off a column that's still five deep.
- **Look one card ahead in each column.** Before playing a column's top card, check what it will expose — a play that immediately opens a second legal move is worth more than one that doesn't.
- **Don't treat the stock as a last resort.** Since you can draw whenever you like, sometimes drawing early to reset the foundation's rank is exactly what unlocks two stuck columns at once.

### Advanced
- **Plan around the stock's finite length.** With no recycling, every stock card you burn is a decision that can't be revisited — treat the 16-card stock as a resource to spend deliberately, not a fallback.
- **Track ranks as they're played.** Knowing how many of a given rank remain unseen tells you whether a stuck column is likely to open again soon, or is effectively dead until the stock happens to deliver the right card.
- **Sometimes a "neutral" draw is correct even with a legal move on the board** — if the current foundation rank only opens one column, but drawing might land on a rank that opens two, that trade is often worth it late in a round.

## Traps & common mistakes

- **Playing the first legal move you see** without checking whether a different column's play would open more of the board.
- **Burning through the stock carelessly**, forgetting it never recycles — a solvable-looking position can become permanently stuck.
- **Assuming King and Ace connect.** They don't; there's no wraparound in this variant.
- **Ignoring column length.** Chipping away evenly at every column often leaves you with several columns still 2–3 deep and no plays left, instead of a couple fully cleared and the rest workable.

## A worked example

```
Foundation top: 8

Column A next exposed card: 9
Column B next exposed card: 3
Column C next exposed card: 7, with a 6 waiting beneath it

Both the 9 (A) and the 7 (C) are legal — one rank away from 8.
Column B's 3 is not legal right now.

Play Column C's 7 rather than Column A's 9: the card beneath it is a 6,
which becomes playable immediately after (7 → 6), continuing the chain
and thinning a column instead of just working the surface.
```

## Glossary

- **Foundation** — the single pile you build onto; its top card sets what's currently playable.
- **Column** — one of the seven starting piles of 5 face-up cards.
- **Chain** — consecutive plays enabled by a single card's rank leading into the next.
- **Stock** — the face-down reserve of 16 cards, drawable at will but never recycled.
- **Stuck** — no column has a legal play and the stock is empty; the round ends unsolved.

## Where to go next

For more single-player patience with very different rules, try **Solitaire (Klondike)** and **Pyramid** — both build around matching or sequencing rather than Golf's pure rank-adjacency chase.
