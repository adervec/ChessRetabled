# Cribbage

> A peg board, a scrap of a hand, and two ways to score every single card — the play and the show. Few games pack this much arithmetic into so few cards.

**At a glance** · You vs one AI rival · versus · 15–25 min a game (several hands to 121) · Play it under **Cards** (`/cards`).

## What it is

Cribbage dates back to 17th-century England (traditionally credited to the poet Sir John Suckling) and is unusual among card games for using a **physical scoring track** rather than counting up points at the end — you peg your score, hole by hole, the instant you earn it. Two-handed cribbage, the version here, is the classic form: tight, fast, and merciless about small mistakes, because the dealer's crib means every discard helps someone, and it's rarely you when you're not the dealer. It's often described as a game you can teach in five minutes and spend a lifetime getting slightly better at, because the discard decision alone has a genuine skill ceiling.

## Goal

Be the first to peg **121 points**, earned in two distinct phases every hand: the **play** (pegging as cards are laid down) and **the show** (counting your hand, then the dealer's, then the crib).

## The deck & setup

A standard 52-card deck. Pip values for scoring: Ace = 1, 2–10 = face value, **Jack/Queen/King = 10**.

Each hand: deal **6 cards** to each player. Both players then discard **2 cards face-down** into the **crib** — a fifth "hand" belonging to the dealer, counted at the very end. That leaves each player with 4 cards for the show. The dealer alternates every hand, so over a full game to 121 you'll deal roughly half the hands and feed your own crib on each of them.

## Rules

**The discard.** Non-dealers want to starve the crib (throw cards that don't combine well); the dealer wants to feed it. This is the first real decision of every hand, and it happens before either player has any information about the starter card.

**The cut.** After discarding, the top card of the remaining deck is turned as the **starter**. If it's a **Jack, the dealer immediately pegs 2** — "his heels."

**The play (pegging).** Starting with the non-dealer ("pone"), players alternate playing one card face-up, announcing the running **count** (the sum of pip values played since the last reset), which may never exceed 31:
- Reach exactly **15** → 2 points. Reach exactly **31** → 2 points (and the count resets to 0).
- Play a card matching the rank of the card just played → a **pair**, 2 points; three in a row of the same rank → **pair royal**, 6 points; four in a row → **double pair royal**, 12 points.
- Complete a **run** of 3 or more consecutive ranks among the most recently played cards (order doesn't matter, just consecutive values) → points equal to the run's length.
- If you can't play without exceeding 31, you say **"go"** and play passes; if neither player can move, whoever played last scores **1 point** (2 if they hit exactly 31), the count resets to 0, and play continues with whatever cards remain.
- Once both hands are empty, move to the show.

**The show.** Hands are counted in a fixed order — **pone's hand first, then the dealer's hand, then the dealer's crib** — each combined with the shared starter card:

| Category | Points |
|----------|--------|
| Fifteen (any subset summing to 15) | 2 each |
| Pair | 2 |
| Pair royal (triplet) | 6 |
| Double pair royal (quad) | 12 |
| Run of 3 / 4 / 5 | 3 / 4 / 5 |
| Flush (hand only, 4 matching) | 4 |
| Flush (hand + matching starter, 5) | 5 |
| Flush (crib — needs all 5 to match) | 5 |
| His nobs (Jack matching starter's suit) | 1 |
| His heels (starter itself is a Jack) | 2, to the dealer, at the cut |

A run with a duplicated rank inside it multiplies: a run of 3 where one rank is paired scores 3 × 2 = 6 points, not 3.

Whoever reaches 121 first — even mid-play or mid-show — wins immediately, which can cut a hand short before every category is even counted.

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Cribbage. The shoe is **seeded** per deal, and every finished game is recorded to your history.
- **Discarding and pegging.** You pick your two crib discards, then play cards during the pegging phase; the app prompts you only for your own decisions and drives the AI's discards, pegging, "go"s, and the crib count automatically on a short delay.
- **The show.** Hands are counted for you in the correct order (pone, dealer, crib) with each category's points listed out, so you can see exactly where every point came from without doing the arithmetic yourself.
- **The 💡 hint.** During your discard or your play, a first press nudges you toward the idea (e.g., keep for fifteens, or peg for the pair); a second press reveals the exact card. Taking a hint marks the hand **assisted** in your history.
- **Scoring & logging.** Your running peg total is shown live; the finished game's final score and outcome feed your Dashboard.

## Strategy

### Beginner
- **Learn to spot fifteens on sight.** Any 5 + any 10-value card is an automatic fifteen — 5s are the most valuable card in your hand for exactly this reason.
- **When discarding as non-dealer, keep your hand tight and throw the crib nothing useful** — avoid pairs, avoid cards that are close in rank (run potential), avoid a 5 unless you're keeping it.
- **In the play, count out loud.** Knowing the running count precisely is the only way to safely avoid handing your opponent a free 15 or 31.
- **Don't forget the starter counts too.** A hand that looks unremarkable on its own can turn into a big score once the cut card is added.

### Intermediate — discard with the crib in mind
- **When you're the dealer, throw generously combinable cards into your own crib** — a 5 and a 10-card, or two cards 1–2 ranks apart, feed your own score.
- **When you're not the dealer, actively avoid giving your opponent's crib anything.** A pair thrown to their crib is 2 free points you'll never see; a mid-value single (a lone 2 or 3) is much safer than a card near your other discard's rank.
- **During the play, lead a 4.** It can't be combined with anything already on the table to make 15 on the very next card (the classic advice: never lead a 5, always consider a 4).
- **Hold pairs back from the crib whenever you're not the dealer.** A pair is 2 guaranteed points for whoever owns that hand — don't hand it away.

### Advanced — play for the whole board, not just the hand
- **Duck the 31 in the play when you're behind, chase it when ahead.** Reaching exactly 31 is worth 2 points to whoever plays it — track the count and steer toward or away from it depending on the score.
- **Pone counts first in the show, which matters most on the last hand of a close game** — if you're pone and near 121, your show points land before the dealer's or the crib's, sometimes ending the game before the dealer gets a chance to reply. Play the last hand's discard with this "first count" edge in mind.
- **The crib is worth roughly a third of the dealer's points over a full game.** Because you're the dealer exactly half the time, discard strategy compounds — a slightly-better-for-the-crib discard on every dealt hand adds up over the roughly 8–12 hands a full game to 121 usually takes.
- **Near the end of the game, count backwards from 121.** A hand you'd normally keep tight might instead be worth restructuring around pegging points alone if that's the faster path to the finish line.

## Traps & common mistakes

- **Throwing a 5 into the opponent's crib.** It's the single easiest way to hand over a fifteen-scoring card for free.
- **Forgetting the crib's flush needs all 5 cards, not 4.** A near-flush crib hand that would score in your own hand scores nothing in the crib.
- **Playing to avoid "go" instead of playing your best card.** Sometimes taking the go (and the guaranteed point when the round resets) is better than forcing an awkward card down early.
- **Undercounting runs with duplicate ranks.** A run of 3 with a pair inside is worth 6, not 3 — easy to miss when counting quickly.
- **Ignoring "his nobs" when discarding.** A Jack thrown carelessly might have matched the eventual starter's suit for a free point — not decisive on its own, but it adds up over a game.

## A worked example

```
Hand: 5♠ 5♥ J♦ 6♣     Starter: 5♦

Fifteens: 5♠+J♦, 5♥+J♦, 5♦+J♦ = 3 × 2 pts  =  6
Pairs: three 5s = pair royal              =  6
Runs: 5-6 only 2 ranks, no run             =  0
Flush: mixed suits                         =  0
Nobs: J♦ matches the ♦ starter             =  1
                                          -----
                                   Total  =  13
```

A modest but solid hand — three 5s plus a matching-suit Jack is the kind of combination worth keeping when you're not feeding the crib.

## Glossary

- **Crib** — a fifth hand built from both players' discards, counted for the dealer at the end of the show.
- **Pone** — the non-dealer; leads the play and counts first in the show.
- **His heels / his nobs** — the two Jack bonuses: heels for cutting a Jack as starter (dealer, 2 pts), nobs for holding the Jack matching the starter's suit (1 pt).
- **Go** — declining to play because any card would exceed 31; the last player to have played scores a point.
- **Peg** — to score, named for the physical pegs moved on a cribbage board.
- **Starter (the cut)** — the shared card revealed after discarding, combined with each hand and the crib for the show.

## Where to go next

For another game built entirely around table arithmetic, **Scopa**'s capture-by-sum plays a similar mental muscle. For a different pegging-adjacent tension — hidden information and disciplined decisions — **Blackjack** is a quick companion session.
