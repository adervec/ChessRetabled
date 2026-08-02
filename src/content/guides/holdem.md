# Texas Hold'em

> One card room where you and the dealer share a public board — the whole game comes down to a single, well-timed bet.

**At a glance** · You vs Dealer · versus · 2–4 min a hand · Play it under **Cards** (`/cards`).

## What it is

Texas Hold'em is the poker variant that ate the world — it's the format behind the World Series of Poker and nearly every televised final table, because its shared **community cards** make it easy to watch and endlessly deep to play. Everyone gets two private cards, everyone reads the same shared board, and the skill lies in figuring out what your two cards are worth combined with what's on the table — and in reading what the other side's bet is telling you. Heads-up against a single dealer, as it's played here, strips away the multiway complexity of a full table and leaves the purest version of that read: just you, one opponent, and one board.

## Goal

Win the pot: either by holding the best five-card hand at showdown, or by getting the dealer to fold before it gets there.

## The deck & setup

A standard 52-card deck, reshuffled every hand from a **seed**. You start with a **100-chip** bankroll. Each hand costs a fixed **10-chip ante** (matched by the dealer, so the pot opens at 20), and the single betting round uses a fixed **20-chip bet size** — there's no raising, only bet-or-check and call-or-fold.

## Rules

1. **Ante 10 to deal.** You and the dealer are each dealt two private **hole cards**, and the **flop** — the first three community cards — is turned face up immediately.
2. **One betting round**, and you act first:
   - **Check** — if the dealer's hand is already two pair or stronger, it bets 20 and you must call or fold. Otherwise the hand goes straight to showdown.
   - **Bet 20** — if the dealer holds at least a pair, it calls (matching your 20) and the hand goes to showdown. With nothing, it folds and you take the pot uncontested.
3. **Facing a dealer bet**, call (add 20 to the pot, see it through to showdown) or fold (forfeit the pot immediately).
4. **Showdown** reveals the **turn** and **river** — the last two community cards — completing a five-card board. Both sides form their best possible five-card hand from any combination of their two hole cards and the five community cards (**best five of seven**). Higher hand takes the pot; identical hands split it.
5. Chips carry from hand to hand. If you drop below the 10-chip ante, you can't deal again until you take a fresh 100-chip stack.

Hand rankings, high to low:

| Rank | Hand |
|------|------|
| 9 | Straight Flush (Ace-high = Royal Flush) |
| 8 | Four of a Kind |
| 7 | Full House |
| 6 | Flush |
| 5 | Straight |
| 4 | Three of a Kind |
| 3 | Two Pair |
| 2 | Pair |
| 1 | High Card |

Note: this app plays a **single, simplified betting round** after the flop — real Hold'em bets four times (preflop, flop, turn, river). Here the turn and river are dealt straight through to showdown once the one round of betting resolves.

## How it works in ChessRetabled

- **Dealing & evaluation.** The full seven-card pool — your two hole cards, the dealer's two, and the five-card board — is dealt from a **seeded** shuffle, and showdowns are settled by the same best-5-of-7 evaluator that backs **Five-Card Draw** in this app.
- **The dealer plays by a fixed rule, not a bluff.** It only bets when checked to with two pair or better, and only calls a bet with a pair or better — otherwise it folds. It never bluffs and never slow-plays.
- **The 💡 hint.** It's a coarse strength heuristic, not a full solver: a made pair or better (or a pocket pair before the flop) suggests betting/calling; anything weaker suggests checking/folding. Stage one nudges that the math leans a direction; stage two names the exact action. Taking it marks the hand **assisted**.
- **Logging.** Every hand's outcome, chip result, and whether a hint was used are recorded to your history and the Dashboard.

## Strategy

### Beginner
- **Any two hole cards see the flop.** There's no preflop betting here — the ante is mandatory regardless of your hand, so there's nothing to fold before the flop even shows up.
- **A made pair (or better) is worth betting.** With nothing better than high card after the flop, checking costs you nothing and lets you see the rest for free, or fold cheaply if pressed.
- **Learn the hand-ranking order cold** — it's the whole game once cards are compared.
- **Watch the flop's texture, not just your own two cards.** A flop like K-K-7 hits pairs and full houses far more often than a rainbow of unrelated low cards — the board shapes what's likely just as much as your hand does.

### Intermediate
- **Count your outs after the flop.** Two more community cards are coming; a flush draw (four of your five relevant cards sharing a suit) or an open straight draw both have real odds of completing by the river — weigh a bet or a call against how many cards actually help you.
- **Respect a dealer bet.** Since the dealer only bets a made two-pair-or-better when you check, a bet into you post-check is a real, non-bluffing signal — don't call it down with high card alone.
- **Bet your strong hands rather than checking them.** Checking a two-pair-or-better hand just to "see what happens" gives up value, since the pot only grows if someone puts more chips in.
- **Do the pot-odds math before calling a bet.** Facing a 20-chip bet into a 20-chip pot, calling risks 20 to win 40 — you need better than 1-in-3 odds of having the best hand at showdown for that call to pay off over time.

### Advanced
- **The dealer never bluffs — use that.** Its logic is a fixed threshold, not an adaptive read: it only bets two pair or better, and only calls a bet with a pair or better. Once you internalize that, the read becomes nearly perfect information: a dealer bet means "at least two pair," a dealer fold to your bet means "worse than a pair."
- **Bet your marginal hands into a check.** Since a dealer with less than a pair always folds to your bet, betting a mediocre hand (like ace-high) after the dealer checks is often correct — you win the pot outright a meaningful fraction of the time with nothing at showdown.
- **Don't over-fold to the dealer's bet.** Because the dealer's betting threshold (two pair or better) is a fairly high bar, a bet doesn't mean "beats you outright" — it means "has at least two pair," which your own two pair or better can still beat; check the actual hand strength, not just the fact that a bet came in.
- **Remember the 💡 hint is a floor, not a ceiling.** It only distinguishes "made a pair or better" from "hasn't" — it won't tell you to fold a weak pair to a scary board, or to bet a strong draw for value. Use it to avoid outright blunders, then layer the reads above on top.

## Traps & common mistakes

- **Folding a made pair too readily.** A single pair loses to the specific range the dealer bets with (two pair+), but it's still a real hand worth a call when the pot odds favor it.
- **Checking a strong hand out of habit.** There's no slow-play advantage here — the dealer's action is a fixed rule, not a read on your check, so checking a great hand only shrinks the pot.
- **Forgetting the ante is sunk.** Since there's no preflop fold, agonizing over "should I have played this hand" before the flop is wasted energy — the only real decisions come after it.
- **Misreading the board for your best hand.** With seven cards to choose five from, it's easy to undercount a hand — trust the evaluator's showdown result over a quick glance.
- **Betting into a scary board without a real hand.** A board like Q-J-10 makes straights easy for both sides — a lone pair there is much weaker than the same pair on an unconnected board.

## A worked example

```
Your hole cards:  A♠ K♠      Board (flop): K♦ 7♣ 2♠
You hold top pair, top kicker (a pair of Kings, Ace kicker) — a real hand.
You BET 20. Dealer's hand: 9♥ 9♦ → pocket pair, category ≥ 1 → dealer CALLS.
Showdown reveals turn/river: 4♠ J♦.
Your best five: K K A J 7 (Pair of Kings) beats dealer's 9 9 K J 7 (Pair of Nines).
→ You win the pot.

Compare: had the dealer instead held Q♣ Q♦ (also a pair), it still calls your bet
(category ≥ 1) — but loses the same way. Only two pair or better on the dealer's
side would have turned this showdown around.
```

## Glossary

- **Hole cards** — your two private cards, unseen by the dealer.
- **Flop / turn / river** — the 3rd, 4th, and 5th community cards, revealed together in this app's single betting round.
- **Best five of seven** — the rule that lets either side use any five-card combination of hole cards plus board.
- **Kicker** — a side card that breaks ties between otherwise-equal hands (same pair, different fifth card).
- **Pot odds** — the ratio of what you'd risk on a call to what you'd win, used to judge whether a call is profitable over time.

## Where to go next

For the same hand-ranking skill without a shared board, **Five-Card Draw** is this app's other poker variant, sharing the exact same evaluator. For a different flavor of reading a fixed-rule opponent, **Blackjack**'s dealer is just as mechanical — and just as beatable once you know its rule.
