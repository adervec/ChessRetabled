# Scopa

> No trumps, no bidding — just a table of open cards and the constant question of whether to grab now or set a better trap for later.

**At a glance** · You vs one AI rival · versus · 8–15 min a round · Play it under **Cards** (`/cards`).

## What it is

Scopa ("sweep") is one of Italy's oldest capturing games, distinct from Briscola's trick-taking in a fundamental way: every card played is visible on the table before you commit to it, so the game is less about hidden information and more about arithmetic and restraint. Its name comes from the game's signature moment — clearing every card off the table in one move, a **scopa**, worth a bonus point and (traditionally) a triumphant slap of the table. Regional variants abound across Italy, but the four-category scoring used here — cards, coins, settebello, primiera — is the standard "Scopa a punti" most players mean by the name.

## Goal

Score more points than your opponent across four scoring categories plus sweeps, tallied once the deck is exhausted.

## The deck & setup

The 40-card Italian deck (Ace–7, Jack, Queen, King — no 8, 9, or 10). Capture values run straight up the deck:

| Card | Value |
|------|-------|
| Ace | 1 |
| 2–7 | face value |
| Jack | 8 |
| Queen | 9 |
| King | 10 |

Diamonds stand in for the Italian suit of **coins** (denari) for scoring purposes — the 7 of Diamonds is the prized **settebello** ("beautiful seven").

Each player is dealt **3 cards**; **4 cards** are turned face-up on the table; the rest sits in the stock. Whenever both hands run empty and at least 6 cards remain in the stock, 3 fresh cards are dealt to each player — the table is never redealt, only refilled from what's left, so table cards can sit for several rounds before anyone captures them. This repeats until the stock is gone.

## Rules

1. On your turn, play one card from your hand.
2. **If a table card matches its value exactly, you must capture it** (if more than one matches, you choose which single card to take).
3. If no single card matches, you may instead capture **any combination of table cards whose values sum to your card's value**. An available equal-value single card always takes priority over a sum-capture — you can't ignore a matching single to grab a bigger sum instead.
4. If neither is possible, your card is simply **trailed** — added face-up to the table for either player to capture later.
5. Capturing every card on the table in one move is a **scopa** — worth an extra point — *unless* it happens to be the very last card played in the entire round (that final clearing is just normal cleanup, not a sweep).
6. When the deck and both hands are finally empty, whoever captured most recently sweeps up any cards still left on the table (this final grab doesn't count as a scopa either).
7. **Scoring**, one point each to whoever has the edge in:
   - **Cards** — most cards captured overall.
   - **Coins** — most Diamond-suit cards captured.
   - **Settebello** — whoever holds the 7 of Diamonds (automatic, since only one exists).
   - **Primiera** — see below.
   - Plus **one point per scopa** swept during the round, added on top (not head-to-head — both players simply keep whatever sweeps they earned).

**Primiera** rewards depth across suits, not raw value: for each of the four suits, take your *best* captured card by a special "prime" ranking, then sum those four best-of-suit cards. Higher total wins the point — even a player with fewer total cards can win primiera by holding the right high-prime cards.

| Rank | Prime value |
|------|------|
| 7 | 21 |
| 6 | 18 |
| Ace | 16 |
| 5 | 15 |
| 4 | 14 |
| 3 | 13 |
| 2 | 12 |
| Jack/Queen/King | 10 |

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Scopa. The deck is **seeded** for reproducible deals, and every finished round is recorded to your history.
- **Playing a card.** Tap a card to play it; if it has more than one legal capture combination, you'll choose which one to take. The AI rival responds on a short, watchable delay.
- **The 💡 hint.** First press nudges you toward the strongest available idea (capture vs. trail safely); press again to reveal the exact card — and capture set, when relevant — a strong policy would choose. Any hint marks the round **assisted** in your history.
- **Scoring & logging.** The four-category breakdown (cards, coins, settebello, primiera) plus any scopas is shown at the end of the round, and the result feeds your Dashboard.

## Strategy

### Beginner
- **Take an equal-value capture whenever you can** — it's mandatory anyway, but plan your hand around forcing these rather than hoping for sums.
- **Don't trail high cards into an empty-ish table.** A 7 trailed onto a near-empty table is an open invitation for the opponent to sweep.
- **Chase the settebello.** The 7 of Diamonds is worth a full point by itself just for being in your pile at the end — never let it sit uncaptured if you can take it.
- **Watch the table size, not just your hand.** A table with only one or two cards left is much more dangerous to trail into than a full one.

### Intermediate — think one move ahead
- **Before you trail, ask what you're handing your opponent.** A trailed card that lets them capture *and* clear the table is a scopa gift-wrapped for them.
- **Build toward primiera, not just card count.** A 7 is worth 21 prime points but only counts once per suit — collecting several 7s past the first only helps your card-count total, not primiera.
- **Track the coins (Diamonds) as they're captured.** With only 10 in the deck, the coins majority often comes down to the last couple of tricks — don't let a cheap Diamond slip away for nothing.
- **Prefer captures that deny your opponent's primiera over ones that only pad your card count.** A single well-chosen 7 or Ace can swing the primiera point outright.

### Advanced — set up sweeps deliberately
- **Count the table's total value.** A table sitting at exactly your hand's remaining values is a scopa waiting to happen — hold a card back rather than trail it away if it completes a sweep next turn.
- **Play the endgame tightly.** Once the stock is exhausted, both hands are the last cards of the game — every capture is now fully calculable, and the final sweep (uncounted as a scopa) still decides the cards/coins/primiera categories, so don't assume the last cards "don't matter."
- **A near-even game is usually decided by scopas, not the four categories.** Since categories are single points regardless of margin, a player who's slightly behind on cards/coins/primiera but has swept twice is still ahead — factor sweep opportunities into every capture decision, not just raw value.
- **Deliberately leave a "safe" trail when no scopa is available to your opponent.** Trailing a mid-value card onto a table that can't sum to it denies your opponent an easy read on your hand.

## Traps & common mistakes

- **Trailing a card that completes an easy sum for the opponent.** Always check what sums are newly possible on the table before you trail.
- **Grabbing every capture available without checking for a bigger one next turn.** Sometimes trailing (declining a small capture entirely isn't legal, but choosing a smaller mandatory-adjacent sum poorly) sets up a worse table than a slightly patient sequence would.
- **Forgetting a sweep doesn't count on the very last card of the round.** Don't bank on that final "sweep" bonus — it's automatic cleanup, not a scored scopa.
- **Overvaluing card count and ignoring primiera.** A hand full of low, no-prime-value cards can lose the cards category and still lose primiera too if it lacks high-prime cards like 7s and Aces.
- **Losing track of redeals.** Since the table persists across the mid-round redeals, it's easy to forget a card that's been sitting there for two or three rounds and is now part of a much bigger sum than it looks.

## A worked example

```
Table: 3♦  4♠  7♣  King♥
Your hand includes: 7♦ (the settebello)

Play 7♦: an equal-value single (the 7♣) is on the table, so the
capture is forced onto that single card — NOT the 3+4 sum, even
though 3♦ + 4♠ = 7 as well. Equal-value singles always win over sums.

Result: you capture 7♦ + 7♣ (2 cards, including the settebello point
and a strong primiera card). The 3♦ and 4♠ stay on the table —
now an inviting 7-sum for whoever plays next, so your opponent may
well capture it right back with their own next card.
```

## Glossary

- **Scopa (sweep)** — capturing every card on the table in one move; worth a bonus point.
- **Settebello** — the 7 of Diamonds, worth an automatic point to whoever captures it.
- **Primiera** — the four-suit "best card" scoring category, using its own prime-value table rather than face value.
- **Trail** — playing a card with no legal capture, leaving it face-up on the table.
- **Coins (denari)** — the suit mapped to Diamonds in this app; a majority in it is worth a point.

## Where to go next

For the other great Italian card game sharing this same 40-card deck, try **Briscola**. If capturing-and-summing appeals to your arithmetic side, **Cribbage** scratches a similar itch with pegging instead of a table.
