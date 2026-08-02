# Gin Rummy

> A quiet arms race of tidying your hand while guessing exactly when it's safe to stop.

**At a glance** · You vs AI · versus · 5–10 min a hand · Play it under **Cards** (`/cards`).

## What it is

Gin Rummy emerged in early-1900s New York as a faster, cleaner descendant of Whiskey Poker and standard rummy — no wild draws, no forced discards you didn't choose, just a steady tightening of your hand into sets and runs. Its tension is unique among rummy games: you can end the hand the moment you're ready by **knocking**, but knock too early with too little of an edge and your opponent can flip the result entirely against you. Patience and nerve matter as much as card sense — it's the rummy family's answer to knowing exactly when a position has been improved as far as it usefully can be.

## Goal

End the hand with less **deadwood** — the point value of your unmatched cards — than your opponent, either by knocking with a safe margin or by reaching **zero** deadwood (Gin) for a bonus.

## The deck & setup

A standard 52-card deck. You and the AI are each dealt **10 cards**. The 21st card is turned up to start the **discard pile**; the remaining **31 cards** form the **stock**, face down.

## Rules

1. On your turn, **draw one card** — either the hidden top of the stock, or the known top of the discard pile — bringing your hand to 11 cards.
2. Arrange your hand into **melds**: **sets** (3–4 cards of the same rank) or **runs** (3 or more consecutive cards of one suit; aces are always **low**, so A-2-3 is valid but Q-K-A is not).
3. **Deadwood values**: Ace = 1, 2 through 9 = face value, 10/J/Q/K = 10 each. Any card not part of a meld counts toward your deadwood total.
4. After drawing, either **discard** a card (back down to 10, turn passes) or, if your best possible discard leaves your deadwood at **10 or less**, **knock** instead.
5. **Knocking** ends the hand: discard your chosen card and reveal both hands.
   - Deadwood of exactly **0** is **Gin** — worth a **25-point bonus** plus the opponent's entire deadwood value.
   - If your deadwood is **strictly lower** than your opponent's, you win the **difference** in points.
   - If your deadwood is **equal to or higher** than theirs, you've been **undercut** — your opponent wins instead, scoring the difference plus a **25-point bonus**.
6. If the **stock runs dry** before either side knocks, the hand ends by exhaustion: whoever holds less deadwood wins the raw difference, with **no bonus** either way.
7. This app plays **one hand at a time**, not a race to 100 points across several hands — each round is decided fully within a single deal, with no lay-offs onto the knocker's melds.

## How it works in ChessRetabled

- **Deal & AI.** Hands are dealt from a **seeded** shuffle. The AI's every decision — draw, discard, and when to knock — runs through the same exact meld optimizer described below, so it plays close to perfectly within this ruleset.
- **An exact deadwood solver, not a heuristic.** Behind every hand, ChessRetabled runs a real optimizer that finds the arrangement of sets and runs that **minimizes deadwood exactly**, via weighted set-packing over every candidate meld — the same tool powers your deadwood counter, the knock check, and the AI's own play.
- **The 💡 hint.** Stage one nudges you that a decision matters (worth taking the discard, or worth knocking); stage two names it exactly — draw from stock or discard, the precise card to let go, or the knock itself. Taking it marks the hand **assisted**.
- **Logging.** The finished hand — win, loss, and the point margin — is recorded to your history and the Dashboard.

## Strategy

### Beginner
- **Sort your hand by suit, then by rank**, so runs and near-runs jump out visually.
- **Discard your highest, most isolated deadwood first** — a lone King costs you 10 points sitting in your hand for nothing; a lone Ace only costs 1.
- **Take the discard when it completes something.** If the top discard slots straight into a set or run you're building, it's almost always worth more than a blind stock draw.
- **Recount your deadwood after every draw.** The number on screen is exact, not an estimate — trust it over a rough mental tally, especially once your hand gets tangled with near-melds.

### Intermediate
- **Don't reveal your hand's shape for free.** Every card you take from the discard pile shows your opponent exactly what you're building — draw from the stock instead when the discard doesn't clearly help you.
- **Track what your opponent discards.** A discarded 7 tells you they don't need 7s for a set, and likely aren't holding a 6-8 run through it either — that's real information about what's safe to discard yourself.
- **Weigh knocking at 10 deadwood carefully.** You're legally allowed to knock the instant your deadwood hits 10, but that's the riskiest possible margin — a single lucky opponent hand can undercut you.
- **Keep a mental tally of how many turns have passed.** With only 31 cards in the stock, a hand that runs long is trending toward exhaustion — worth knowing when you're deciding whether to hold out for Gin or take a safe knock now.

### Advanced
- **Respect the undercut penalty — a tie loses.** Knocking with deadwood equal to your opponent's isn't a wash; it's scored as a full undercut against you. Only knock when you're confident you're strictly ahead, not just legal to knock.
- **Weigh Gin against an early safe knock.** Chasing zero deadwood for the 25-point bonus is tempting, but every extra turn you spend un-knocked is a turn your opponent gets to lower their own deadwood — sometimes locking in a smaller, certain win beats gambling for Gin.
- **Since there are no lay-offs in this ruleset**, an opponent's near-complete meld can't be safely fed extra cards after a knock — that raises the value of denying them useful discards throughout the hand, since nothing can be salvaged onto your melds after the fact.
- **Think one layer ahead of your own optimizer.** The deadwood counter always shows your *current* best arrangement, but the discard that minimizes deadwood right now isn't always the one that keeps your hand most flexible for the next two or three draws — sometimes holding a slightly-worse-today card that extends two possible runs at once is the stronger long-run choice.

## Traps & common mistakes

- **Knocking on an exact tie.** It feels safe ("I can't lose by knocking here") but a tied deadwood is scored as an undercut against the knocker, not a push.
- **Feeding the discard pile a card your opponent obviously wants.** Watch their recent draws and melds-in-progress before tossing a card that slots neatly into them.
- **Hoarding high cards hoping for a set.** A lone King or Queen sitting unmelded is expensive deadwood; cut your losses on cards that aren't close to completing something.
- **Drawing from the discard out of habit.** It's only better than the stock when it concretely improves your deadwood — otherwise it just informs your opponent for nothing.
- **Passing up Gin to knock early "just to be safe."** A safe knock is good, but zero deadwood is safer still and pays a 25-point bonus — don't cash out a smaller win the turn before you would have gone Gin.

## A worked example

```
Your hand: 4♣ 5♣ 6♣  9♠ 9♦ 9♥  K♠  2♦ 3♥ 7♣
Melds:  4♣-5♣-6♣ (run)   9♠-9♦-9♥ (set)
Deadwood: K♠(10) + 2♦(2) + 3♥(3) + 7♣(7) = 22

You draw a 4♠ from the discard — doesn't fit either meld.
Better: discard the K♠ (worth 10) instead of a low deadwood card.
New deadwood: 2 + 3 + 7 + 4 = 16 — getting closer to a legal knock at ≤10.

A few turns later you draw 3♣ from the stock. It extends your run to 3♣-4♣-5♣-6♣ —
and since the run now reaches 6♣, your old deadwood 7♣ slots on the end too, for a
five-card run. Deadwood drops to just 2♦(2) + 3♥(3) + 4♠(4) = 9. Discard the 4♠
(worst of what's left) and you can legally KNOCK at 5 deadwood.
```

## Glossary

- **Meld** — a set or a run; the building blocks that remove cards from your deadwood.
- **Deadwood** — the total point value of your unmatched cards.
- **Knock** — ending the hand once your deadwood is 10 or less.
- **Gin** — knocking with exactly 0 deadwood, for a 25-point bonus.
- **Undercut** — knocking with deadwood equal to or greater than your opponent's, handing them the win plus a 25-point bonus.
- **Lay-off** — in full Gin Rummy, adding your deadwood onto the knocker's melds to reduce your score; this app's ruleset has none.
- **Exhaustion** — the hand ending because the stock ran out before anyone knocked, settled by raw deadwood with no bonus.

## Where to go next

For another game built on exact hand evaluation, **Texas Hold'em** and **Five-Card Draw** share this app's poker evaluator. For a different scoring discipline built on counting runs and sets, **Cribbage** rewards the same kind of careful arithmetic.
