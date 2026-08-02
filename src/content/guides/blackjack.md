# Blackjack

> The one casino game where a clear head genuinely narrows the house edge to a sliver — a game of disciplined decisions, not hunches.

**At a glance** · You vs the dealer · versus · 2–5 min a hand · Play it under **Cards** (`/cards`).

## What it is

Blackjack (or *twenty-one*) is the most-played banking card game in the world. You are not trying to get *exactly* 21 and you are not really playing against other players — you are playing one hand against the dealer, whose every move is fixed by rule. That is what makes it a skill game hiding inside a casino game: because the dealer has no choices, the *entire* problem is deciding what **you** should do with each hand, and that decision has a mathematically correct answer known as **basic strategy**.

## Goal

Finish with a hand total closer to **21 than the dealer's** without going over. Go over 21 and you **bust** and lose immediately, regardless of what the dealer does.

## The deck & values

A standard 52-card deck. Card values:

| Cards | Value |
|-------|-------|
| 2–10 | Face value |
| Jack, Queen, King | 10 |
| Ace | 1 **or** 11, whichever helps |

A hand with an ace counted as 11 is **soft** (it can't bust on the next card — the ace can drop to 1). A **natural blackjack** is an ace plus any ten-value card on the first two cards, and it pays **3:2**.

## Rules

1. You and the dealer each get two cards; one of the dealer's is face-up (the "upcard").
2. On your turn you choose:
   - **Hit** — take another card. Repeat until you stand or bust.
   - **Stand** — keep your total and end your turn.
   - **Double down** — double your bet, take exactly one more card, then stand.
   - **Split** — with two cards of equal rank, split into two hands (each gets a new second card).
3. If your first two cards total 21, that's blackjack — you win 3:2 unless the dealer also has one (a push/tie).
4. When you stand, the **dealer reveals and plays by rule**: hit until reaching **17 or more**, then stand. (In this app the dealer stands on all 17s.)
5. If the dealer busts, every remaining player hand wins. Otherwise the higher total wins; equal totals **push** (bet returned).

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Blackjack. The shoe is **seeded**, so each deal is reproducible and gets recorded to your history.
- **Playing a hand.** Buttons offer Hit / Stand / Double / Split as they become legal for your hand. The dealer then plays itself out automatically to its fixed 17 rule.
- **The 💡 hint.** Blackjack's hint gives you the **basic-strategy** play for your exact hand versus the dealer's upcard — the move a solver would make. As with every game, taking a hint marks the hand **assisted** in your history, so a perfectly-played session stays distinct from a coached one.
- **Payouts & logging.** Blackjack pays 3:2, other wins even money, pushes return your stake. Finished hands feed your Dashboard.

## Strategy

### Beginner — the non-negotiables
- **Never stand on 11 or less** — you cannot bust, so always improve.
- **Always split Aces and 8s.** Two Aces become two strong hands; 8-8 (a stiff 16) becomes two fresh starts.
- **Never split 10s or 5s.** Twenty is already excellent; a pair of 5s is a 10 you'd rather double.
- **Assume the dealer's hole card is a ten.** Their most likely total is upcard + 10 — plan against that.

### Intermediate — read the dealer's upcard
The single most useful split is **weak vs strong** dealer upcards:
- **Dealer 2–6 (weak):** the dealer is likely to bust. Stand on your stiff hands (12–16) and let them break. Double your 9, 10, 11 to press the advantage.
- **Dealer 7–Ace (strong):** the dealer will probably make a good hand. Keep hitting your stiffs (12–16) until you reach 17+, accepting the bust risk, because standing on 15 vs a dealer 10 simply loses.

### Advanced — soft hands and doubling
- **Play soft hands aggressively.** Soft 17 (A-6) is *not* a stand — hit or double it, because it can only improve. Double soft 13–18 against a weak dealer upcard.
- **Double 11 against almost anything**, and 10 against everything but a ten or ace.
- **Basic strategy is the ceiling of decision skill** in a single-hand game; the only way past it is tracking the deck (card counting), which shifts the bet, not the play. The app's hint teaches you the basic-strategy layer perfectly.

## Traps & common mistakes

- **"Never bust" thinking.** Refusing to hit a 16 vs a dealer 10 feels safe but loses long-term — you must take the risk.
- **Insurance and even-money side bets** are sucker bets; skip them.
- **Mimicking the dealer** (always hit to 17) throws away the doubling and standing edges that make the game close.
- **Splitting 10s** to "get two hands" — you're breaking a 20, the second-best hand in the game.

## A worked example

You hold **16**, the dealer shows **6**:

```
Your 16  vs  Dealer 6
Dealer 6 busts about 42% of the time.
Hitting 16 busts you more often than that.
→ STAND. Let the weak dealer break.
```

Same 16, but the dealer shows a **10**: now standing loses to their likely 20, so you **hit** and hope — the upcard flips the correct play.

## Glossary

- **Soft hand** — a hand with an ace counted as 11 (can't bust on one card).
- **Stiff** — a hard total of 12–16, easy to bust, awkward to stand.
- **Upcard** — the dealer's visible card, the key to every decision.
- **Push** — a tie; your bet is returned.
- **Basic strategy** — the mathematically optimal play for every hand-vs-upcard combination.

## Where to go next

For more decisions under uncertainty, try **Five-Card Draw** and **Texas Hold'em**. For a lighter counting game, **Cribbage** rewards the same quick arithmetic.
