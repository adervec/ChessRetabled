# Briscola

> A three-card hand, a single trump suit, and nothing hidden but your opponent's next card — Italy's answer to "simple rules, deep play."

**At a glance** · You vs one AI rival · versus · 5–10 min a hand · Play it under **Cards** (`/cards`).

## What it is

Briscola is the everyday trick-taking game of Italian cafés and family tables — small hands, fast tricks, and a scoring system where the low cards are worthless and the highest-value cards are not always the highest-ranked. It's usually the very first card game an Italian child learns, precisely because the rules fit on an index card, yet it stays interesting for a lifetime because so much rides on timing rather than raw card strength. It rewards a specific kind of discipline: knowing which of your cards are actually dangerous to hold, and when to spend your best trump rather than save it for a trick that never comes.

## Goal

Capture cards worth the most **points** across the whole deck — not the most tricks. There are 120 points in the deck; **61 or more** wins outright, and 60–60 is a tie. You can win the majority of tricks and still lose the hand if they were the wrong tricks.

## The deck & setup

The 40-card Italian deck (Ace–7, then Jack, Queen, King — no 8, 9, or 10), across four suits. Card point values:

| Card | Points |
|------|--------|
| Ace | 11 |
| 3 | 10 |
| King | 4 |
| Queen | 3 |
| Jack | 2 |
| 7, 6, 5, 4, 2 | 0 |

Only 30 of the 120 points sit in "worthless" cards (0 value); the rest is concentrated in just 20 cards across the deck, which is why avoiding careless losses matters so much more than accumulating tricks.

Each player is dealt **3 cards**. The next card is turned face-up as the **briscola** (trump) and set aside — it's the last card drawn from the stock, so everyone sees the trump suit from turn one but the trump card itself stays in play until the very end of the hand.

## Rules

1. There is no obligation to follow suit — play any card from your hand.
2. Trick strength: a trump beats any non-trump. Otherwise, the trick is won by the higher card of the suit that was **led** (a card of a third suit can't win, even if it would normally rank high). Within a suit, strength runs weakest to strongest: **2, 4, 5, 6, 7, Jack, Queen, King, 3, Ace** — note that 3 and Ace outrank the face cards despite being "low" in casual card-rank terms.
3. After a trick, the winner collects both cards face-down into their point pile and **leads** the next trick.
4. Both players draw back up to 3 cards from the stock — the trick **winner draws first**, then the loser. This matters: the winner gets first look at whatever's on top, and in a two-player game that means the loser is always drawing whatever's left.
5. The stock runs out when the trump card itself is finally drawn (it sits at the very bottom, so its suit is known throughout the hand but the card itself is a mystery until then). Play out the last 3-card hands with no more replenishment.
6. When all 40 cards are captured, add up points. Most points wins; 60–60 is a tie.

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Briscola. The deck is **seeded**, so a deal is reproducible, and the finished hand is recorded to your history for later review.
- **Playing a trick.** Tap a card from your 3-card hand to lead or follow. The AI rival plays back on a short, watchable delay so you can read its choices rather than have the game race ahead of you.
- **The 💡 hint.** The first press nudges you toward the *kind* of play (e.g., grab the points, or play safe); press again and it reveals the exact card a strong policy would lead or follow with. Taking a hint marks the hand **assisted** in your history, so a clean run stays distinct from a coached one.
- **Scoring & logging.** The running point totals for both piles are shown live throughout the hand; the finished hand's score line and result feed your Dashboard.

## Strategy

### Beginner
- **Learn the point cards by heart: Ace (11), 3 (10), King (4), Queen (3), Jack (2).** Everything else is a "spazzatura" card worth nothing — safe to lead or dump.
- **Never lead your Ace or 3 into an empty trick.** A card worth 10–11 points handed to an opponent for free is the single biggest unforced error in the game.
- **Lead worthless cards early**, especially off-trump 2s, 4s, 5s, 6s, 7s — they can't lose you points even if captured.
- **Don't panic about trump.** Seeing the trump suit from turn one is normal; the game is fair precisely because both players know it equally.

### Intermediate — read what's still out
- **Track the trump suit.** With only 10 cards per suit, once a few trumps have appeared you can estimate whether your remaining trump beats what's left.
- **Weigh the trick before you spend a trump.** Trumping a trick worth 0–2 points to "win" it is usually a bad trade — save trumps for tricks carrying an Ace or 3.
- **Watch the draw order.** Because the trick winner draws first, winning a trick you didn't need to can hand your opponent second pick of the stock — sometimes worse than losing it.
- **Note who leads after each trick.** Since the winner leads next, forcing your opponent into the lead seat at the wrong moment can put them in a position where every safe card they hold has already been spent.

### Advanced — timing your trumps
- **Hold your Ace of trump as a threat, not a habit.** A trump Ace can capture any single card thrown against it later in the hand, once your opponent's off-suit safety cards are gone.
- **Bait with cards just below capture value.** Leading a King (4 points) invites a small trump; if your opponent doesn't have one handy, you've moved a live point card into your own pile for cheap.
- **In the endgame (stock empty, 3 cards left each), count exactly.** With no more draws, every remaining trump and point card is fully known — this is a solved 3-card sub-game, and briscola rewards players who play it out precisely rather than on instinct.
- **Remember that a 3 beats a King and Queen within its own suit.** Late in the hand, holding back a lone 3 of a non-trump suit can ambush an opponent who assumes their face card is safe.

## Traps & common mistakes

- **Leading an Ace or 3 "to get it over with."** It almost always just gifts 10–11 points.
- **Trumping every trick you can.** Burning trumps on worthless tricks leaves you defenseless when a real point card appears later.
- **Ignoring the draw-order edge.** Forcing yourself to win low-value tricks just to keep leading gives up first pick of the stock for nothing.
- **Forgetting the strength order.** The 3 outranks the King and Queen within its suit — a common beginner misread that costs a captured trick.
- **Assuming the last few tricks "don't matter."** They're often worth the most, since both players have been hoarding their strongest cards for exactly this moment.

## A worked example

```
Trump: Cups (C)
You lead: 4 of Coins (0 pts, safe)
Rival plays: King of Coins (4 pts) — trying to win cheaply

Coins isn't trump, so highest Coins wins the trick.
King (strength 7) beats 4 (strength 1) → rival takes the trick, +4 pts.

Lesson: leading a worthless card is fine — but only because you
weren't holding anything the rival's King could actually beat for free.
Had you led your own King of Coins instead, you'd have handed over 4
points for nothing.

Later, stock exhausted, you hold: Ace of Cups (trump), 3 of Swords, 6 of Cups.
Rival leads King of Swords (4 pts). Your 3 of Swords beats it outright
(3 outranks King in-suit) — no need to spend the trump Ace at all.
```

## Glossary

- **Briscola (trump)** — the suit of the turned card; beats every other suit regardless of rank.
- **Point card** — Ace, 3, King, Queen, or Jack; the only cards worth anything.
- **Lead** — the first card played in a trick; sets the suit that must be beaten.
- **Stock** — the face-down draw pile; empties when the trump card itself is finally drawn.
- **Strength order** — the in-suit ranking used to decide tricks: 2, 4, 5, 6, 7, J, Q, K, 3, A.

## Where to go next

For another Italian trick-and-capture game with the same 40-card deck, try **Scopa**. If you enjoy tight trump-suit trick-taking with partners instead of solo, **Euchre** raises the stakes with bowers and bidding.
