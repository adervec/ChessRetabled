# War

> No bluffs, no melds, no decisions — just two decks colliding, card by card, until one side owns them all.

**At a glance** · You vs Rival · versus · 2–10 min a round (longer with wars) · Play it under **Cards** (`/cards`).

## What it is

War is usually the very first card game anyone learns, precisely because it asks nothing of you but to keep flipping. There's no hand to manage, no suit to follow, no bid to make — just a straight contest of chance between two equal, sealed decks. Its appeal is the tension it manufactures out of nothing: a tie forces a "war," stakes rise, and suddenly a game with zero decisions has you leaning forward anyway. It's the card-table equivalent of flipping a coin repeatedly and somehow still caring who's ahead.

## Goal

Capture your rival's entire deck. If the game runs long enough to hit its round cap, whoever holds the larger deck at that point is declared the winner.

## The deck & setup

A standard 52-card deck, split evenly and dealt face down as two personal decks of **26 cards** each — yours and your rival's. There are no hands to look at; both decks stay hidden until a card is flipped to battle.

## Rules

1. Each round is a **battle**: both sides flip the top card of their deck face up. **Ace is high** — it beats every other card, including the King.
2. Whoever flips the higher card wins the battle and takes both cards.
3. **Equal cards trigger a war.** Each side stakes three cards face down, then flips a new card as the decider. If that new pair also ties, another war stacks on top of the first — wars can chain.
4. If a side doesn't have enough cards left to fully stake a war, it contributes whatever remains.
5. Everything wagered in a battle — the original cards plus any war stakes — goes to the battle's winner, shuffled back into their deck rather than simply stacked (this app's house rule; it's what keeps a long game from cycling through the same order forever).
6. A player who runs out of cards loses outright. As a backstop, the game also caps at **4,000 rounds** — if that's ever hit, the larger deck at that moment wins.

## How it works in ChessRetabled

- **No hint on this one.** War is **pure draw** — there's no decision anywhere in the rules to coach, so there is no 💡 hint here at all.
- **One button.** Each round is a single "Flip" press; the app resolves the whole battle — including any chained wars — in one step and shows you the result.
- **Seeded, and shuffled to terminate.** The deck deal is **seeded** for reproducibility, and — importantly — cards won in a battle are reshuffled before rejoining the winner's deck, which is what keeps the round cap from ever actually mattering in practice.
- **Logging.** Every finished round (win, loss, or the rare card-count tie) is recorded to your history and the Dashboard, including how many battles it took.

## Strategy

### Beginner
- **Learn the one rule that matters: Ace beats King.** It's the single fact that trips up new players, since intuitively a King "outranks" an Ace in other games.
- **Expect wars.** With 13 ranks in play, any given battle has roughly a 1-in-13 chance of tying — over a full deck's worth of battles, several wars are the norm, not the exception.
- **Don't read anything into a losing streak.** Each battle is an independent draw; a run of bad flips says nothing about what's coming next.
- **Watch your card count, not the last flip.** The scoreboard that actually matters is how many cards each deck holds, not who won the most recent battle.

### Intermediate
- **Understand why wars matter so much.** A single tied battle stakes three extra cards per side sight unseen — a chain of two or three wars can swing a huge fraction of the deck on one flip, which is most of War's real drama.
- **Notice deck-size momentum, not card-by-card outcomes.** Because winnings are reshuffled back in, a big early war can hand one side a structural card-count advantage for the rest of the game even though individual future battles stay roughly even odds.
- **Recognize the round cap for what it is.** It's a backstop, not a real outcome — a card-count tiebreak only kicks in on the rare game that would otherwise run essentially forever.
- **Expect chained wars to be rarer than single wars.** A single tie happens on roughly 1 in 13 battles; a tie surviving straight into a *second* war is a much smaller slice of games, which is exactly why they're memorable when they happen.

### Advanced
- **There is no strategy — and knowing that precisely is the strategic insight.** Every "decision" in War is really just "press flip"; nothing you do changes the odds of any battle. Recognizing this early saves you from over-analyzing a pure chance process.
- **Appreciate why this implementation reshuffles winnings.** Classic War, played with cards simply stacked (loser's card under winner's, in a fixed order), can enter provably repeating cycles for certain deals — reshuffling breaks that determinism and is the only thing standing between War and an unplayable edge case.
- **Use War as a variance benchmark.** Because it has zero skill component, it's a useful mental yardstick: if you ever feel you're "due" for a win here, that same fallacy is worth noticing in games that *do* have real decisions, like Blackjack or Hold'em.
- **Notice that "winning" and "playing well" are unrelated here.** In every other card game in this app, a loss can still be a well-played hand. In War, the outcome carries zero information about your play, because there was no play — that distinction is worth carrying into how you judge your results elsewhere.

## Traps & common mistakes

- **Ranking the King above the Ace out of habit.** In War, Ace is always high.
- **Assuming a long losing streak means the deck is "against you."** Battles don't remember previous outcomes.
- **Miscounting a war's stakes.** A tie costs three face-down cards per side before the deciding flip, not one.
- **Expecting the game to end quickly on principle.** Deck sizes can swing wildly through chained wars; a "close" game by card count can still be several dozen battles from over.
- **Reading drama into the "WAR ×2" style counters.** They report how many ties chained together in the current battle, not a running total across the whole game — don't mistake it for a scoreboard.

## A worked example

```
You flip 9♠   Rival flips 9♦   → TIE, war declared.
Both stake 3 cards face down.
You flip Q♥   Rival flips 4♣   → Q beats 4.
You take all 10 staked cards (2 tied + 3 + 3 + 2 decider), shuffled into your deck.

Next battle: you flip 3♠, rival flips 3♥ → TIE again, a fresh war.
Rival is down to only 2 cards left to stake — they contribute what they have.
You flip A♦   Rival flips 8♣   → Ace is high, you take the whole stake again.
```

## Glossary

- **Battle** — one round: both sides flip a card, higher card takes the pot.
- **War** — the escalation triggered by a tie: three cards down, then a decider flip.
- **Stake** — the cards committed face down during a war.
- **Round cap** — the hard 4,000-battle limit that guarantees the game ends.
- **Chained war** — a war whose decider flip also ties, forcing another war on top of it.

## Where to go next

For another game decided almost entirely by chance, **Old Maid** scratches the same itch with three players instead of two. If you want the opposite — every card matters and every choice counts — **Blackjack** turns the tables completely.
