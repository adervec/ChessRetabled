# Old Maid

> The game that proves a shuffle can carry all the suspense a hand of cards needs — nobody at this table makes a real decision.

**At a glance** · You vs 2 AI · versus · 2–4 min a round · Play it under **Cards** (`/cards`).

## What it is

Old Maid is a nursery-room classic, older than most card games still played today, built entirely around one asymmetric card: a queen with no partner. Where most matching games reward memory or skill, Old Maid strips even that away — every draw is blind and random, and the entire arc of the game is just watching the doomed card circulate until it lands on someone for good. It's less a test of ability than a small, shared ritual of suspense — the game exists to be told afterward as a story ("I was *so* close to being safe"), not to be studied.

## Goal

Avoid being the player left holding the sole unpaired queen once every other card on the table has been discarded in pairs.

## The deck & setup

A standard 52-card deck with **one queen removed**, leaving three queens in play — since one of them can never find its partner, it becomes the **Old Maid**. The remaining 51 cards are dealt evenly across **3 players** (you plus two bots — Bot Lee and Bot Mae), 17 cards each. Every player immediately discards any pairs already sitting in their opening hand.

## Rules

1. Turn order proceeds around the table. On your turn, you draw **one hidden card, at random**, from the hand of the next player who still holds cards — neither of you chooses which card it is.
2. If the card you drew completes a pair with one already in your hand, that pair is **discarded automatically**.
3. If a player's hand ever empties, they're **safe** — they're skipped for the rest of the game.
4. Play continues until exactly **one card** remains anywhere on the table: the unpartnered queen. Whoever is holding it is the Old Maid and loses; everyone else wins.

## How it works in ChessRetabled

- **Three seats.** You face two bots, Bot Lee and Bot Mae, cycling through turn order together; a player who empties their hand drops out of the rotation automatically.
- **No hint on this one.** Old Maid has **no 💡 hint** — your only action each turn is confirming a draw that's already blind and random, so there's no meaningful decision to coach.
- **Seeded, still.** Even with nothing to decide, the deal and every draw are pulled from a **seeded** random stream, so a specific round is exactly reproducible, and the outcome logs to your history and the Dashboard the same as any other game.
- **Pairs discard themselves.** You never manage your own hand tidying — the moment a drawn card completes a pair with one you're already holding, it's removed automatically, both at the initial deal and on every subsequent draw.
- **Pacing.** The bots' turns resolve on a short, watchable delay rather than instantly, so the circulating queen is easy to follow.

## Strategy

### Beginner
- **Understand there's nothing to decide.** Every draw is uniformly random and hidden from both sides — no amount of careful play changes your odds on any single turn.
- **Watch who's still in.** As hands empty out and players become "safe," the risk of holding the Old Maid concentrates on whoever's left — track the shrinking field, even though you can't influence it.
- **Don't overthink the "draw from" button.** It only ever draws from the next active player in turn order; there's no choice of who to draw from, either.
- **Enjoy the reveal.** Since every draw is a genuine surprise to you as well as to the game, there's no "correct" way to feel about a turn — just watch what comes up.

### Intermediate
- **Recognize the parity mechanic.** Because pairs discard automatically the instant they're completed, your hand size only ever moves by exactly the cards you draw and give away — there's no hidden accumulation to manage.
- **Notice the elegant setup, not the play.** Removing exactly one queen guarantees exactly one card in the whole 51-card deck can never pair — that single asymmetry is the entire game; everything after the deal is just watching it resolve.
- **Track your own risk honestly.** With three queens circulating down to one, your instantaneous odds of eventually holding the Old Maid start close to an even three-way split, shifting only as hands (including your own) empty out.
- **Notice when a bot goes "safe."** Once a player's hand empties, the turn order simply skips them — the remaining players keep drawing from each other exactly as before, just with one fewer name in the rotation.

### Advanced
- **Accept that skill genuinely caps at zero here.** Unlike War (which at least has a fixed rule — Ace high — to internalize), Old Maid's digital implementation removes even the physical-table skill of reading opponents' faces or fanning cards to bluff a draw choice; every draw is a uniform random pick.
- **Use it as a pure-variance control.** If you want to sanity-check whether you're pattern-matching noise elsewhere in the app, play a few rounds of Old Maid and notice how streaky pure chance can look even with zero decisions involved.
- **Appreciate why it still terminates cleanly.** Because a pair always discards the instant it's completed, and only one card is truly ownerless, the deck can't cycle or stall the way a game like War needs a round cap to guard against — Old Maid always ends in exactly 50 successful draws.
- **Compare it honestly to War.** Both games are pure chance, but War at least has a rule to internalize (Ace high) and a visible tug-of-war of deck sizes to track. Old Maid's only real "content" is the shrinking pool of remaining cards and the growing dread of being last — worth noticing as the more minimal of the two.

## Traps & common mistakes

- **Assuming a "better" draw is available.** There is exactly one possible action each turn — draw from the next active player — so there's nothing to optimize.
- **Reading momentum into a string of safe turns.** Whether you've dodged the queen for ten turns in a row says nothing about the next draw; it's still uniformly random.
- **Forgetting the removed queen.** New players sometimes expect all four queens to be pairable and get confused when one never finds a partner — that's the entire point of the game.
- **Thinking emptying your hand early is "skill."** It's just the luck of which cards you happened to draw; there's no way to hurry it along.
- **Expecting the bots to behave differently from each other.** Bot Lee and Bot Mae have no personality baked into their draws — both simply draw blind from whoever's next, exactly like you do.

## A worked example

```
Turn: You draw (blind) from Bot Lee → 8♦. You already hold 8♣ — pair discarded automatically.
Turn: Bot Mae draws (blind) from you → Q♠. No match — the queen now sits alone in her hand.
Turn: Bot Lee draws (blind) from Bot Mae → 5♥. No match; hands keep thinning.
Turn: You draw (blind) from Bot Lee → Q♠. You already hold no other queen — it
      joins your hand as a new, lonely card. You're now carrying real risk.
Eventually every card but one has paired off. Whoever holds the last, lone queen is the Old Maid.
```

## Glossary

- **Old Maid** — the single unpartnered queen left after one queen is removed from the deck.
- **Safe** — a player whose hand has emptied and who is skipped for the rest of the round.
- **Blind draw** — drawing one random, face-down card from another player's hand with no choice involved.
- **Turn order** — the fixed rotation of active players; a player who's gone "safe" is skipped without otherwise disrupting it.

## Where to go next

For another game decided almost entirely by chance, **War** delivers the same tension with just two players and one Ace-high rule to learn. If you'd rather remembering things mattered, **Go Fish** turns a similar matching idea into a real information game, and **Memory** makes recall the entire point.
