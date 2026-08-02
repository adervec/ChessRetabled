# Euchre

> A trump suit that reshuffles the whole deck's pecking order, a partner you can't talk to, and a bidding decision that decides the hand before a card is even led.

**At a glance** · You and an AI partner vs two AI rivals · versus · 15–25 min a game (several hands to 10) · Play it under **Cards** (`/cards`).

## What it is

Euchre is the great American Midwestern trick-taking game — a staple of Michigan and Ohio card tables, and popular enough in the 1800s to be credited with introducing the Joker to the standard deck (a card invented specifically as an extra trump for Euchre, though this app's implementation doesn't use one). It's a partnership game played with a strikingly small deck, which makes every card enormous: with only 24 cards in play, knowing exactly which two are missing can be the whole difference between making your bid and getting euchred. Unlike most trick-taking games, the trump suit doesn't just rank one suit above the others — it actively promotes a card from a *different* suit into being a trump, which is the single idea that makes Euchre feel unlike anything else at the table.

## Goal

Partner with the seat across from you and be the first team to **10 points**, earned by winning tricks each hand — especially by "making" the trump you named.

## The deck & setup

A 24-card deck: ranks **9 through Ace** in all four suits. Four seats sit in fixed partnerships — **you and the seat across from you** versus the two seats to your sides. Each player is dealt **5 cards**, and one extra card is turned face-up as the **up-card**, the proposed trump for the bidding round.

**The bowers.** Naming a suit as trump doesn't just rank its own cards highest — it also promotes one card from the *same-color* suit:
- The **Jack of the trump suit** becomes the **right bower** — the single highest card in the game.
- The **Jack of the other suit sharing trump's color** becomes the **left bower** — second-highest, and it counts as a trump card for every purpose, including following suit.

Full trump-suit rank, highest to lowest: **right bower, left bower, Ace, King, Queen, 10, 9**. Non-trump suits rank normally: Ace, King, Queen, Jack, 10, 9 (the trump suit's own Jack has left the building to become the right bower, and the matching-color suit's Jack has left too).

Because the deck only holds 24 cards across four hands of 5 plus the up-card, every player's hand represents a meaningfully large slice of what's out there — nearly a quarter of the whole deck sits in your hand alone, which is a big part of why bidding decisions carry so much weight.

## Rules

**Bidding, round one.** Starting left of the dealer, each player in turn either **orders it up** (accepts the up-card's suit as trump) or **passes**. If ordered up, the dealer picks up the up-card and must **discard** one card back down to five — trump is now locked in as the up-card's suit, and the team that ordered it up becomes the **makers**.

**Bidding, round two.** If all four players pass in round one, bidding goes around again — this time each player may **name any suit except the one that was turned down**, or pass. If everyone would pass a second time, the dealer is **"stuck"** and must name a suit rather than let the hand go undealt — this rule exists specifically to guarantee every hand gets played.

**The play.** The player left of the dealer leads the first trick. Everyone must **follow the effective suit** if able — remember, the left bower counts as trump for following purposes, not its printed suit. If you can't follow, play anything, including a trump to try to win the trick. Highest trump played wins the trick outright; if no trump was played, the highest card of the suit led wins. The trick winner leads next.

**Scoring the hand.** The team that named trump are the **makers** and need at least **3 of the 5 tricks**:

| Result | Points |
|--------|--------|
| Makers win 3 or 4 tricks | 1, to the makers |
| Makers win all 5 tricks ("a march") | 2, to the makers |
| Makers win fewer than 3 tricks ("euchred") | 2, to the defenders |

First team to **10 points** wins the game — a euchre is worth exactly as much as a march, which is why defending aggressively against a shaky bid is often better than trying to squeeze out a single trick of your own.

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Euchre. The deal is **seeded** and reproducible; every finished game is recorded to your history. You sit as seat "You," partnered with the seat directly opposite; the two AI rivals fill the remaining seats.
- **Bidding, discarding, and play.** You're prompted only on your own decisions — order it up or pass, name a suit or pass, discard as dealer, or play a card. Your partner and both rivals bid and play automatically on a short, watchable delay, including the "stick the dealer" rule when everyone else has passed.
- **The 💡 hint.** During your bid, discard, or play, a first press nudges you toward the idea; a second press reveals the exact bid or card a strong policy would choose. Any hint marks the game **assisted** in your history.
- **Scoring & logging.** Running team scores are shown live hand to hand; the finished game's final score and outcome feed your Dashboard.

## Strategy

### Beginner
- **Count your trump strength before bidding, including the bowers.** A hand with the right or left bower plus one or two more trump cards is usually strong enough to order up.
- **As dealer, remember you'd also gain the up-card.** A hand that looks borderline improves once you can pick up and discard your weakest card.
- **Follow suit whenever you can — including with the left bower**, which follows the trump suit, not its own printed suit. This trips up nearly every new player at least once.
- **Trust your partner's bid.** If your partner orders it up or names trump, they're telling you their hand is strong — play to support that, not to second-guess it.

### Intermediate — bid with your partner in mind
- **A strong hand is worth ordering up even from an awkward seat**, because being euchred costs the defenders nothing extra — but making it denies your opponents the chance to name a stronger suit for themselves in round two.
- **When your partner orders it up, support them, don't hedge.** You already know trump; play to help make the hand, not to protect against a euchre that only happens if it fails.
- **Lead an off-suit Ace when you have one.** It's often an outright winner before any trump gets involved, and it clears a dangerous card from your hand without wasting a trump.
- **As a defender, lead through the maker on your right, not into them.** Forcing the maker to commit trump before their partner has to reveal anything gives your side more information.

### Advanced — count the missing bowers
- **With only 24 cards, missing information is small enough to reason about precisely.** Once you know trump, there are exactly 6 trump cards total (including both bowers) — track how many have appeared, and you'll often know exactly who's holding the last one.
- **"Sticking the dealer" changes the incentive calculus for everyone at the table.** If it's clear the dealer will be forced to name a weak trump, other players can pass more freely in round two, letting a poor forced suit reach the table rather than naming a mediocre suit themselves.
- **A hand that can't make 3 tricks is sometimes worth defending, not bidding, even with decent trump** — going for broke on a marginal hand and getting euchred (giving the defenders 2 automatic points) is worse than simply passing and playing solid defense.
- **Track your partner's discards and voids the same way you'd track your own.** Once you know your partner is void in a suit, leading that suit lets them trump in for free on a later trick.
- **Weigh the up-card's suit even when you pass in round one.** A turned-down suit tells you what everyone else at the table just declined — useful information for what they might name (or avoid naming) in round two.

## Traps & common mistakes

- **Forgetting the left bower follows trump, not its own suit.** Playing it as if it were still part of its printed suit is the single most common Euchre mistake.
- **Ordering up on a weak hand just because you can.** A hand with only one trump and no bower is a likely euchre, not a likely win.
- **Underestimating "stuck the dealer."** New players sometimes forget the dealer *must* name a suit in round two if everyone else passes — plan your own round-two pass or bid with that guarantee in mind.
- **Leading trump too early with a weak holding.** Leading your only trump card just to "use it" often just clears the way for your opponents' stronger trumps.
- **Forgetting that a euchre and a march are worth the same 2 points.** A defending team doesn't need to win all 5 tricks to match the makers' best possible outcome — just deny them 3.
- **Discarding a trump as dealer just to keep a "balanced" hand.** Once you've picked up the up-card, hold every trump you can — discard your weakest off-suit card instead, even if it leaves you thin in a plain suit.

## A worked example

```
Trump named: Hearts (right bower = J♥, left bower = J♦)

Trick led: J♦ (the left bower — counts as trump!)
Second:    A♥  (an actual trump Ace — beats a non-right-bower trump)
Third:     9♣  (can't follow trump, discards low)
Fourth:    J♥  (the right bower — the single highest card in the deck)

Winner: J♥. It's the right bower, unbeatable by anything else in play,
including the left bower and the trump Ace that came before it.

Note the third seat: holding no Hearts and no Diamonds (so no trump at
all), they had to discard something — 9♣ costs nothing here since their
side was already losing the trick regardless of what they threw away.
```

## Glossary

- **Bower** — a promoted Jack; the right bower (trump suit) outranks everything, the left bower (same-color suit) is second and counts as trump.
- **Order it up** — accepting the turned-up card's suit as trump in bidding round one.
- **Stuck the dealer** — the rule forcing the dealer to name a trump suit if every other player passes in round two.
- **Euchred** — the makers failing to win 3 tricks, handing the defending team 2 points regardless of the actual trick count.
- **March** — winning all 5 tricks in a hand, worth 2 points instead of 1.
- **Makers** — the partnership that named trump, either by ordering up or naming a suit in round two.

## Where to go next

For another trump-suit trick game, minus the partnerships and bidding, try **Briscola** — same core tension of when to spend your best cards, in a leaner two-player form. If four-seat trick-taking without a trump suit at all appeals more, **Hearts** trades bowers for avoidance scoring.
