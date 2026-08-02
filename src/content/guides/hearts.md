# Hearts

> A trick-taking game built entirely around avoidance — every heart you win is a point against you, and the Queen of Spades alone is worth thirteen.

**At a glance** · vs 3 AI · versus · 10–15 min · Play it under **Cards** (`/cards`).

## What it is

Hearts flips trick-taking on its head: in most trick games you want to win tricks, but in Hearts, winning a trick can hand you penalty points you spend the rest of the hand trying to avoid. It's a long-running staple of the genre — Microsoft bundled it with Windows for over a decade — precisely because "don't take the bad cards" is such an easy rule to learn and such a deep one to master. This app deals a single 13-trick hand, four seats with no partnerships, and — unlike many table variants — **skips the pre-play passing phase**, dropping you straight into trick play for a faster, simpler hand.

## Goal

Finish the hand with the **lowest score**. Hearts and the Queen of Spades are penalty points; avoid taking them, unless you can take every single one of them instead.

## The deck & setup

A standard 52-card deck, seeded and shuffled fresh each deal, dealt evenly into four 13-card hands (you and three AI seats). Whoever holds the 2 of Clubs leads the very first trick.

## Rules

1. The seat holding the 2♣ must lead it to open the hand.
2. Every other player must **follow the suit that was led** if they're able to.
3. A player who can't follow suit may play anything — including a heart or the Queen of Spades.
4. **Hearts can't be led until they've been "broken"** — played off-suit by someone unable to follow — earlier in the hand, unless a player is holding nothing *but* hearts, in which case they may lead one anyway.
5. On the very **first trick only**, a player who can't follow clubs must play a zero-point card if they have one; only a hand made entirely of hearts and the Queen of Spades may dump a point card into that first trick.
6. The highest card of the suit led wins the trick (Ace plays high); that trick's winner leads the next one.
7. Each heart taken is worth **1 point**; the Queen of Spades is worth **13 points**; clubs and diamonds are worth nothing.
8. After all 13 tricks, add up each seat's points. **Lowest score wins the hand.**
9. **Shooting the moon:** if one seat takes every single point card in the hand (all 13 hearts plus the Queen of Spades, 26 points), that seat scores **0** and every other seat scores **26**.

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Hearts. The deal is **seeded**, and the finished hand is recorded to your history and the Dashboard.
- **One hand, not a running match.** This app plays exactly one 13-trick hand per game rather than a running series to 100 points across multiple deals — a self-contained round you can finish in one sitting.
- **AI opponents.** The three AI seats play a risk-averse policy: ducking under the trick with the highest safe card they can when following suit, and dumping the Queen of Spades or their highest heart first when they're void in the led suit. They act on a short, watchable delay.
- **The 💡 hint.** Hearts' hint nudges you toward the same risk-averse logic the AI uses — "dump a dangerous card" when you're void and holding the Queen of Spades or hearts, "you can safely follow suit" when ducking is available — and reveals the exact recommended card on a second press. Taking it marks the round **assisted**.

## Strategy

### Beginner
- **Follow suit whenever you must** — that part isn't a choice. When you're free (void in the led suit), unload your most dangerous cards, especially the Queen of Spades, while it's still safe to do so.
- **Never lead the Queen of Spades yourself** unless you're deliberately chasing a moon shot — you're handing 13 points to whoever wins that trick, and it might be you.
- **Don't win tricks by accident.** If you're following suit and any legal card avoids winning, play that one instead of your highest.
- **Get comfortable losing tricks on purpose.** In Hearts, taking fewer tricks is usually the winning plan — resist the instinct to play your best card just because you can.

### Intermediate
- **Duck with your highest safe card, not your lowest.** If you must follow suit and can't win the trick anyway, play the biggest card that still loses — it banks your low cards for later tricks when ducking gets harder.
- **Void yourself deliberately.** Emptying a short suit early gives you somewhere to dump the Queen of Spades or a dangerous heart later without being forced to win the trick that holds it.
- **Watch who's controlling tricks.** A player who keeps winning tricks is either dumping points onto themselves or building toward a moon shot — either way, it changes how cautiously you should play.

### Advanced
- **Consider shooting the moon on a genuinely strong hand** — real protection in spades (the Ace or King) plus several high hearts. Taking every point card swings the score from a normal loss to a 0-vs-26 blowout in your favor.
- **Abandon a moon attempt the instant you lose control of a single point card.** A failed moon shot costs you the full 26 points anyway — there's no partial credit, so don't half-commit.
- **Track suit lengths as the hand unfolds.** Knowing which opponents are likely void in a suit tells you which leads are safe to make and which ones are practically begging someone to dump the Queen on you.

## Traps & common mistakes

- **Leading the Queen of Spades without a moon plan** — it's the single biggest point swing in the game, don't hand it away casually.
- **Winning a trick you didn't need to**, simply because your highest card of the suit was also your only "safe-feeling" choice.
- **Misjudging when hearts are broken.** You can't lead a heart until someone has been forced to play one off-suit — don't assume it's fair game just because a few tricks have passed.
- **Half-committing to a moon shot** — taking most, but not all, of the point cards is the worst possible outcome, since you pay the full price of taking them without the reward of shooting the moon.
- **Dumping the Queen of Spades on the first trick without thinking it through** — the app's first-trick safety rule only forces this when you have no zero-point card at all; take stock before assuming you're forced into it.

## A worked example

```
Trick so far: 8♥ (led), Q♥ (played by North) — the Q♥ is currently winning.
Your hand includes: K♥ J♥ 3♣

You must follow hearts (already broken this hand). J♥ loses to the Q♥
already in the trick — play it, ducking under and avoiding the points.
Playing K♥ would win the trick instead, sticking you with both hearts.
```

## Glossary

- **Trick** — one round of four cards, one per seat; the highest card of the suit led wins it.
- **Lead** — the first card played to a trick, which sets the suit everyone else must follow.
- **Void** — holding no cards of the suit currently led, freeing you to play anything.
- **Break hearts** — the first time a heart is played off-suit, after which hearts may be led.
- **Shoot the moon** — taking every point card in the hand for a 0-vs-26 score swing.

## Where to go next

**Crazy Eights** is the app's other four-seat game against three AI, if you want a shedding game instead of trick-taking. For more trick-taking with a trump suit, try **Euchre** or **Briscola**.
