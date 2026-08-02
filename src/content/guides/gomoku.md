# Gomoku

> No board to set up, no capture rules to learn — just an empty grid, two colours of stone, and a race to five that gets sharper the more you stare at it.

**At a glance** · You vs the AI · versus · 10–15 min · Play it under **Games** (`/games`).

## What it is

Gomoku ("five in a row" in Japanese) is one of the oldest recorded board games — variants of it go back over a thousand years in East Asia, played on a Go board long before Go itself was fully developed. Its simplicity is deceptive: with no captures, no removals, and no piece values, the entire game is a battle of pattern recognition. Every stone you place either builds a line or blocks one, and strong players are reading four and five moves of threats ahead within the first ten placements.

The variant here is **freestyle Gomoku** — no swap rule, no restrictions on either colour, and an "overline" of six or more in a row still counts as a win, unlike tournament Renju where Black plays under extra restrictions to offset the first-move advantage.

## Goal

Be the first to place **five stones of your own colour in an unbroken line** — horizontal, vertical, or diagonal — anywhere on the board.

## The board & pieces

A **15×15** grid of points, much bigger than a checkers or chess board and with no starting setup — the board is empty and stones are placed one at a time, never moved once down.

## Rules

1. **Black plays first**, alternating with White.
2. On your turn, place one stone of your colour on any **empty point**.
3. Stones never move and are never captured — the board only ever fills up.
4. The first player to form **five or more stones in an unbroken straight line** (row, column, or diagonal) wins immediately. Because this is the freestyle variant, a line of six or more still counts.
5. If the board fills completely with no five-in-a-row, the game is a **draw**.

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Gomoku and a difficulty — **Easy / Medium / Hard**. All three share the same alpha-beta engine with iterative deepening; because the board is large, the AI narrows its search to the most promising nearby points rather than scanning all 225 — Hard still reliably spots forcing sequences several moves out.
- **Making moves.** Click any empty point to place your stone — this is a pure placement game, so there's no piece to select first.
- **The 💡 hint.** Press **Hint** for a nudge (the point the strongest AI would play is highlighted), press again to reveal it outright. Any hint marks the game **assisted** in your history and Dashboard.
- **The computer never snaps.** Its reply is floored to at least one animation, so you can watch each stone land before you respond. Stones reskin per theme (Dusk/Pastel/Croanada).
- Finished games are logged with the full move list to your archive.

## Strategy

### Beginner
- **Play near the centre first.** A central stone participates in far more potential lines than one near the edge — the edges and corners are nearly dead in the opening.
- **Always check for an immediate five before doing anything else** — yours first, then check whether your opponent has one.
- **Block open threes immediately.** A line of three stones with both ends open becomes an unstoppable double threat one move later if you let it sit.

### Intermediate
- **Learn to recognise an "open four."** Four in a row with an open square on both ends can't be blocked — whichever end you cover, the other wins. The fix is to never let an open three go unanswered.
- **Build two threats at once.** A single stone that extends two different partial lines simultaneously forces your opponent to choose which one to block — and they can only block one.
- **Defence is often more urgent than offense.** Because there's no way to remove an opponent's stones, a threat you ignore stays live forever; racing your own line while ignoring theirs usually loses.

### Advanced
- **Read broken patterns, not just straight runs.** A "split three" (two stones, a gap, one more stone) can become an open four just as dangerously as a solid run — these are easy to miss visually.
- **Force with closed threats to set up an open one.** A three that's only open on one end still compels a response; use the tempo it buys to build a second, unstoppable threat elsewhere.
- **In freestyle rules, the first player has a real edge.** Since there's no swap or restriction to balance it, playing Black (moving first) is measurably stronger — take it when you can, and play extra carefully on defense as White.

## Traps & common mistakes

- **Letting an open three stand.** This is the single most common way new players lose — it looks harmless until it becomes an open four next turn, which nothing can stop.
- **Chasing your own line while your opponent builds theirs.** Gomoku punishes tunnel vision hard; check the whole board every move, not just your own project.
- **Playing far from the action.** A stone placed away from the current fight rarely helps either your attack or your defence.
- **Missing a diagonal.** Diagonal lines are visually less obvious than rows and columns on a dense 15×15 grid and are the most common blind spot.

## A worked example

Black has three stones in an open row with empty space on both ends — an "open three." Left unanswered, either end turns it into an open four, which can no longer be blocked at all.

```
. . . . . . .
. . b b b . .   Black's open three: either end makes it
. . . . . . .   an open four next move.
```

If White doesn't block one end immediately, Black plays either empty square, creating an **open four** — two ways to complete five — and wins the move after.

## Glossary

- **Open three** — three in a row with both ends free; unblocked, it becomes an unstoppable open four.
- **Open four** — four in a row with both ends free; cannot be blocked, guarantees a win next move.
- **Overline** — six or more in a row; counts as a win under these (freestyle) rules.
- **Split three** — two stones and a gap that can become an open four with one more placement.
- **Freestyle** — the ruleset used here: no swap rule, no forbidden moves for either colour.

## Where to go next

For the same "form a line" idea with gravity and a smaller grid, try **Connect Four**, or go back to basics with **Tic-Tac-Toe**. If you'd rather form lines that *capture* instead of simply winning outright, **Nine Men's Morris** is the next step.
