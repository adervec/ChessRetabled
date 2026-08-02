# Crazy Eights

> The original shedding game — burn through your hand by matching suit or rank, and let the eights bend the rules the moment you're stuck.

**At a glance** · vs 3 AI · versus · 5–10 min · Play it under **Cards** (`/cards`).

## What it is

Crazy Eights is a family-table classic and the direct ancestor of games like Uno — a "shedding" game where the goal isn't to build the best hand but to get rid of your cards fastest. It's simple to explain and endlessly replayable, with just enough decision-making (when to burn an eight, which suit to call) to reward a little forethought over pure luck. This app seats you against three AI opponents, four players total around the table.

## Goal

Be the first of the four seats to play every card out of your hand.

## The deck & setup

A standard 52-card deck, seeded and shuffled fresh each deal. Each of the four seats — you and three AI — is dealt 5 cards. One card starts the discard pile face-up, setting the active suit; the rest of the deck becomes the stock.

## Rules

1. You always lead the very first card of the hand.
2. On your turn, play a card that matches the **active suit** or the discard pile's **rank**, or play any **8** and name a new active suit — an 8 is always legal, regardless of suit or rank.
3. Playing any non-eight card sets the active suit to that card's own suit, even if you played it by matching rank rather than suit.
4. **If you hold any legal play, you must make one** — this app doesn't allow passing while a play is available.
5. With no legal play, draw from the stock instead. Keep drawing until you get a playable card or the stock runs dry — drawing doesn't end your turn on its own.
6. If the stock empties, drawing automatically reshuffles the discard pile (all but its top card) into a fresh stock.
7. Only if there's truly nothing left to draw (stock and discard both dry) must you pass. If all four seats pass in a row, the hand ends immediately and whoever holds the fewest cards wins.
8. The first seat to empty their hand wins the round outright.

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Crazy Eights. The deal is **seeded**, and the finished round is recorded to your history and the Dashboard.
- **AI opponents.** The three AI seats act on a short, watchable delay. Each sheds its highest non-eight card whenever it can, holding eights back as a last resort and calling the suit it holds the most of when it's forced to play one.
- **Playing.** Click a legal card in your hand to play it; playing an 8 opens a suit picker. When you have no legal play, a **Draw** button appears in its place.
- **The 💡 hint.** Crazy Eights' hint mirrors the AI's own policy exactly — it suggests the same "shed your best non-eight, hold eights in reserve" play, including which suit to call if it does recommend an eight. Taking it marks the round **assisted**.
- **The rare deadlock.** If every seat passes in a row (only possible once the stock and discard are both fully exhausted), the app ends the hand immediately and awards the win to whoever holds the fewest cards — a safety net real table play doesn't need but a seeded digital deck can otherwise loop into.

## Strategy

### Beginner
- **Always play if you can** — the app enforces this, so just pick your *best* legal card rather than the first one you notice.
- **Get rid of your longest suit first.** You have to match something every turn, so thinning out the suit you're overloaded on keeps your options open longest.
- **Don't panic-play an eight.** It's your best escape tool; only spend it when you truly have no other legal card.

### Intermediate
- **Save eights for genuine emergencies.** Once played, an eight is gone — it's the one card that always works, so hold it for the turn you're otherwise stuck.
- **When you do play an eight, call the suit you hold the most of.** That maximizes how many of your remaining cards stay playable on your next turns — it's exactly the policy the AI (and the hint) follows.
- **Watch how many cards each AI is holding.** A seat close to going out changes the calculus — sometimes it's worth playing a slightly worse card just to avoid feeding them an easy follow.

### Advanced
- **A non-eight can steer the active suit too.** Playing a card that matches the discard's *rank* (rather than its suit) still sets the active suit to whatever suit you just played — a quiet way to redirect the game away from a suit you're low on, without spending an eight at all.
- **Track suits as they're discarded.** With four hands of five cards each and a visible discard pile, you can often infer which suits an opponent is likely low on and steer plays that make it harder for them to follow.
- **Don't overcommit to a suit call.** Calling a suit off an eight only helps *your* next turn — think one step ahead about whether the suit you're about to name is one you can actually keep supplying.

## Traps & common mistakes

- **Playing an eight the instant you draw one**, even when you had another perfectly good legal card in hand.
- **Calling a suit off an eight that you barely hold** — it hands you nothing useful the next time around.
- **Discarding your only card of a suit too early**, losing the flexibility to call that suit later when it would actually help.
- **Forgetting the forced-play rule.** You can't strategically "sit" on a good card by declining to play it — if it's legal, it has to go down eventually.

## A worked example

```
Discard top: 5♦   Active suit: ♦
Your hand:   5♣ 9♦ 8♠ 2♥

5♣ matches rank (5) → legal, and switches the active suit to ♣.
9♦ matches suit (♦) → legal, keeps the active suit at ♦.
8♠ is always legal (any 8), and lets you name any suit you choose.
2♥ matches nothing right now → not legal.

Best play: 9♦ — it's a clean legal move that keeps the eight in reserve
for a turn when nothing else works.
```

## Glossary

- **Active suit** — the suit a legal play must match (unless matching by rank, or playing an 8).
- **Shed** — to play a card out of your hand, the core action of the game.
- **Crazy card** — an 8, playable anytime and able to set the active suit to anything.
- **Reshuffle** — rebuilding the stock from the discard pile (minus its top card) once the stock is empty.
- **Deadlock** — the rare case where all four seats pass in a row, ending the hand by card count.

## Where to go next

**Go Fish** shares the same suit-and-rank matching instinct in a gentler form, **Old Maid** is another quick shedding-and-matching game, and **Hearts** is the app's other four-seat trick game if you want to try a different kind of play against three AI opponents.
