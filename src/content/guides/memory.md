# Memory

> The one card game where the deck is honest with everyone — the only opponent worth beating is your own recall.

**At a glance** · You vs AI · versus · 3–6 min a round · Play it under **Cards** (`/cards`).

## What it is

Known as Concentration as often as Memory, this is the card game every household teaches before any game with real rules — no suits to follow, no betting, no trump. Its charm is structural: the entire game state is knowable, just not known, and the only thing standing between you and a perfect run is whether your brain filed away where a given card went a few turns back. Played against a computer that never forgets, it becomes a clean, honest test of how good your memory actually is — there's nowhere to hide behind luck or hand-reading, only recall.

## Goal

End with more matched pairs than your AI rival once every pair on the board has been found.

## The deck & setup

Not a full 52-card deck — Memory here uses **20 cards**: ranks Ace through 10, in Spades and Hearts only, giving exactly **10 pairs**. They're shuffled and laid face down in a grid between you and one AI opponent.

## Rules

1. On your turn, flip one face-down card, then a second.
2. **Match** (same rank): the pair is removed to your score, and you immediately **go again** — flip two more.
3. **No match**: after a short beat, both cards flip back face down and the turn passes to your opponent.
4. Every card either player has ever revealed stays **public knowledge** for the rest of the game — you're not just remembering your own flips, you're remembering everyone's.
5. Once all 10 pairs are matched, the round ends. Whoever holds more pairs wins; 5–5 is a tie.

## How it works in ChessRetabled

- **Board & seed.** The 20-card layout is dealt from a **seeded** shuffle, so a tricky board is exactly reproducible, and every finished round logs to your history and the Dashboard.
- **Shared memory, for real.** The AI's recall isn't a metaphor — it maintains a map of every position either of you has revealed, and plays from it: if a known pair is sitting fully revealed, it takes it; if it holds one half of a known pair face-up, it completes it; otherwise it explores an unrevealed position. It will punish you the moment you forget a card you've already seen.
- **No hint on this one.** Memory has **no 💡 hint** — there's no decision to coach here, only recall. Pointing at where a card went would just be playing the game for you.
- **Even the AI's guesses are seeded.** When it has no known match to chase, its exploratory pick isn't random noise — it's a deterministic function of the seed and the board state, so replaying the same seed replays the exact same AI behavior throughout, which is what keeps a logged round faithfully reproducible.
- **Pacing.** Mismatches sit face-up for a beat before flipping back (long enough to actually study them), and the AI's turn runs on the same watchable delay as everywhere else in the app.

## Strategy

### Beginner
- **Say the card to yourself as you flip it.** Naming what you see — "6 of Spades" — anchors it in memory far better than just looking at it.
- **Anchor positions to something fixed**, like corners or grid edges, rather than trying to memorize abstract coordinates.
- **Don't rush your second flip.** There's no time pressure; use the pause to lock in the position of your first card before committing to the second.
- **Scan the whole board once before you flip anything.** A few seconds spent noticing the grid's shape and size pays off the moment you need to recall a rough location later.

### Intermediate
- **Track the opponent's flips as hard as your own.** The AI does — every card it reveals, even on a mismatch, is now known to you too, and skipping that half of the board is the single biggest reason players lose to a machine with perfect recall.
- **Prioritize confirming a suspected pair over blind exploration.** If you think you remember where a card's partner is, test it — a wrong guess costs a turn, but so does never checking.
- **Group your memory by rank, not by position.** You're hunting for matching *ranks*, so a running mental list ("6: seen at position 4") beats a pure spatial map of the grid.
- **Use a mismatch to bank two positions, not one.** Every failed flip still teaches you where two specific cards live — treat it as two free deposits into memory, not just a lost turn.

### Advanced
- **Front-load exploration, back-load exploitation.** Early turns should reveal unseen territory even at the cost of a mismatch, because information compounds — the later the game, the more that early spent turn pays off in guaranteed matches.
- **Weight recall by how many pairs remain.** With fewer unflipped cards left, your memory of the last handful matters disproportionately — that's exactly where near-perfect play separates from good play.
- **Assume the AI never forgets.** Its play is deterministic given the shared `seen` map, so once a pair has ever both been shown to the board, expect it claimed on the AI's very next opportunity — don't dawdle on a known pair hoping the AI misses it.
- **Treat every one-card flip as a probe, not a gamble.** With only ten ranks on a twenty-card board, a single flip of an unknown position has real information value even when it doesn't lead anywhere immediately — bank it for later, the way you'd bank a probing move against an opponent whose plan you don't yet see.

## Traps & common mistakes

- **Ignoring flips that weren't yours.** Every reveal on the board is fair game to remember, not just the ones from your own turns.
- **Over-trusting a hunch on a card you half-remember.** A wrong second flip burns the turn and hands initiative back with nothing gained but confirmation.
- **Forgetting mismatched cards "don't count."** They absolutely do — a card you saw during a failed match is exactly as known as one from a successful one.
- **Losing track after several turns pass.** The AI's memory doesn't decay; assume yours needs active reinforcement or it will.
- **Flipping the same unexplored corner repeatedly out of habit.** Spread your exploration across the board early so your knowledge base isn't lopsided when it matters most.

## A worked example

```
Turn 1 (you):  flip pos 4  → 6♠     flip pos 11 → 9♥     no match, both flip back.
Turn 2 (AI):   flip pos 2  → 2♠     flip pos 4  → 6♠      no match — but the AI has
               now logged pos 4 as 6♠, same as you.
Turn 3 (you):  flip pos 17 → 6♥     flip pos 4  → 6♠      MATCH — score a pair, go again.
Turn 3 (cont): flip pos 2  → 2♠     flip pos 8  → 2♥       you remembered the AI's
               earlier flip at pos 2 — MATCH — score a second pair, go again.
```

## Glossary

- **Pair** — two cards of the same rank; the only scoring unit in this game.
- **Board** — the face-down grid of 20 cards.
- **Public knowledge** — any card either player has revealed, remembered by both sides for the rest of the round.
- **Concentration** — this game's other common name, describing exactly what it rewards.
- **Exploration flip** — a flip of a position neither player has seen before, spending a turn to gain new information rather than to score.

## Where to go next

For a different flavor of shared, gradually-revealed information, try **Go Fish**. If you'd rather your recall serve deduction than raw matching, **Gin Rummy** rewards remembering what's already been discarded. And if you want a game with zero memory required at all, **War** is the polar opposite.
