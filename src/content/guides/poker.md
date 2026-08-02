# Five-Card Draw

> Poker distilled to its purest form — five cards, one discard, and a single moment of truth at showdown.

**At a glance** · vs dealer · versus · 3–5 min a hand · Play it under **Cards** (`/cards`).

## What it is

Five-Card Draw is the original American poker variant — the game that gave the whole family its name, long before community-card games like Hold'em existed. This app plays a stripped-down heads-up version against a single AI dealer: no betting rounds, no folding, no bluffing. Just an ante, one draw, and a showdown, which puts the entire game of skill where it actually lives — in deciding exactly which cards to keep.

## Goal

Hold the best five-card poker hand at showdown to win the pot.

## The deck & setup

A standard 52-card deck, freshly seeded and shuffled each hand. You start with a **100-chip** stack. Each hand, you ante **10 chips**, matched by the dealer, and both of you are dealt five cards face-down.

## Rules

1. Ante 10 chips to deal; the pot opens at double the ante — your 10 plus the dealer's matching 10.
2. Look at your five cards and choose **up to three** to discard.
3. Discarded cards are replaced from the deck — this is your only draw of the hand; there's no second discard round.
4. The dealer draws immediately after you, by a fixed policy: it keeps any paired ranks and discards the rest, or, holding no pair at all, keeps only its best two cards and discards the other three.
5. Both final hands are ranked using standard poker hand categories (below); an Ace can play high, or low only as part of the five-high "wheel" straight (A-2-3-4-5).
6. The better hand takes the entire pot. Equal-ranked hands **split** — your ante is returned.
7. Fall below the ante and you can start a fresh 100-chip stack to keep playing.

Hand categories, best to worst:

| Rank | Hand | Example |
|------|------|---------|
| 9 | Straight Flush (Ace-high = Royal Flush) | 9♣ 8♣ 7♣ 6♣ 5♣ |
| 8 | Four of a Kind | 7♦ 7♠ 7♥ 7♣ 2♠ |
| 7 | Full House | K♦ K♠ K♥ 4♣ 4♠ |
| 6 | Flush | A♦ J♦ 8♦ 5♦ 3♦ |
| 5 | Straight | 9♠ 8♦ 7♣ 6♥ 5♠ |
| 4 | Three of a Kind | Q♣ Q♦ Q♠ 9♥ 2♣ |
| 3 | Two Pair | J♦ J♠ 6♣ 6♥ 3♠ |
| 2 | Pair | 10♣ 10♦ 8♠ 5♥ 2♣ |
| 1 | High Card | A♠ J♦ 8♣ 6♥ 3♠ |

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Five-Card Draw. Each hand's deck is freshly **seeded**, and every finished hand — not just a session — is recorded individually to your history and the Dashboard.
- **Chips persist across hands.** Your stack carries from one hand to the next within a session; only busting below the ante forces a fresh 100-chip stack.
- **Discarding.** Click up to three cards in your hand to mark them, then draw — or draw with nothing selected to stand pat.
- **The 💡 hint.** Five-Card Draw's hint applies the **exact same discard policy the AI dealer uses on itself** — keep any pair (or better), or your best two cards with nothing, and discard the rest. Taking it marks the hand **assisted**.
- **Showdown.** Both hands flip face-up, the pot is awarded, and "Next hand" deals fresh — no betting or raising interrupts the flow.

## Strategy

### Beginner
- **Always keep a made pair or better**, discarding everything else to chase improvement.
- **Never break up a pair to chase something bigger.** A guaranteed pair beats a hopeful draw far more often than it feels like it should.
- **With absolutely nothing, keep your two highest cards** and discard the rest — three fresh cards give you real chances, one or two don't.

### Intermediate
- **Judge a "draw" by whether it's actually connected.** Two suited cards, or two cards close in rank, are worth keeping toward a flush or straight; three unrelated high cards are not — discard down to a real shot, not a vague hope.
- **Stand pat only with two pair or better already made.** Drawing risks breaking a hand that's already strong, for very little additional upside against a fixed-policy dealer.
- **Remember the dealer's policy is fixed and known.** It always keeps pairs, or its best two cards otherwise — you can reason about roughly what it's likely to end up holding.

### Advanced
- **Learn the rough improvement odds.** Drawing three to a pair makes trips or better close to 1-in-3 of the time; a four-card flush draw completes around 1-in-5; a four-card open-ended straight draw is similar. Weigh your discard against what you're actually likely to make, not just what you're hoping for.
- **With no betting to hide behind, every edge comes from the discard.** There's no bluffing and no pot-odds calculation here — the entire skill of this variant is choosing the discard that gives you the best realistic upgrade.
- **Compare your made hand's strength against the dealer's mirrored policy before drawing at all.** A pair of Kings or better is already ahead of most hands the dealer's discard policy will produce — sometimes the correct "draw" is closer to none at all.

## Traps & common mistakes

- **Breaking a pair to chase a flush or straight.** A small made pair usually beats a long-shot draw against a fixed dealer.
- **Standing pat on a weak hand out of reluctance to "waste" a good-looking card** — with no bets to protect, there's never a cost to drawing.
- **Discarding all five cards on a hand that actually had two decent connected cards worth keeping as a start.**
- **Mistaking three unconnected high cards for a real draw** — 9♠ 7♦ 5♣ isn't a straight draw, it's three cards that happen to be big.

## A worked example

```
Your hand:  K♦ K♠ 9♣ 5♥ 2♦

You already hold a pair of Kings — a live, respectable hand on its own.
Keep both Kings, discard the 9♣, 5♥, and 2♦. Three fresh cards give you
real chances at three-of-a-kind or better, while the pair alone is
already ahead of most hands the dealer's policy will produce.
```

## Glossary

- **Ante** — the fixed stake both sides post before the deal; here, 10 chips.
- **Pot** — the chips at stake for the hand, awarded whole to the winner or split on a tie.
- **Stand pat** — discarding nothing and keeping your original five cards.
- **Wheel** — the A-2-3-4-5 straight, the one case where the Ace plays low.
- **Showdown** — both hands revealed and compared to decide the winner.

## Where to go next

**Texas Hold'em** shares this app's poker hand evaluator but adds community cards and best-five-of-seven hand building. **Gin Rummy** offers a different flavor of discard-optimization skill, and **Blackjack** is another quick, one-hand-vs-the-house game if you want a change of pace.
