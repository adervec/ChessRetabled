# Reversi

> Four discs in the centre, sixty on the board to fight over — and the corner you grab in move ten can decide a game you don't finish for another thirty.

**At a glance** · You vs the AI · versus · 10–20 min · Play it under **Games** (`/games`).

## What it is

Reversi — better known by its trademarked name **Othello** — was popularised in Japan in the 1970s, though the flipping-disc idea traces back to a 19th-century English game. It's one of the cleanest examples of a game where the *obvious* move (take the most discs right now) is usually wrong. Strong players spend the middlegame deliberately owning *fewer* squares, because mobility and the corners matter more than the running score until the very end.

The feel is quietly vicious: nothing is captured by force, everything flips by geometry, and a single disc placed in the wrong spot can hand your opponent a corner three moves later.

## Goal

Have **more discs of your colour than your opponent** when the board fills up or neither side can move. It's a pure majority count at the final position — nothing else matters at the buzzer.

## The board & pieces

An 8×8 board, all squares playable (unlike checkers' dark-squares-only). Every disc is double-sided: yours on top, flipped to the opponent's colour when captured. The game opens with four discs already placed in the centre — two of each colour, diagonally arranged.

## Rules

1. **Black moves first.**
2. On your turn, place a disc on any **empty square** such that it traps one or more opposing discs in an unbroken straight line — horizontal, vertical, or diagonal — between your new disc and another disc of yours already on the board.
3. Every trapped disc in that line **flips** to your colour. You can trap discs in several directions at once with a single placement; all of them flip.
4. If you have **no legal move**, you pass automatically and play returns to your opponent.
5. If **neither** player has a legal move, the game ends immediately.
6. When the game ends, count discs. Most discs wins; equal counts draw.

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Reversi and a difficulty — **Easy / Medium / Hard**. All three run the same shared alpha-beta engine with iterative deepening; Hard searches six ply deep with zero randomness, Easy searches one ply and blunders more often.
- **Making moves.** Every legal square lights up the instant it's your turn — you don't need to select a piece first, since Reversi is a placement game. Click any highlighted square to drop your disc; every flip animates so you can see the chain reaction.
- **Passing.** If you have no legal move, the app passes for you automatically and the turn returns to the AI — you won't get stuck waiting on an unclickable board.
- **The 💡 hint.** Press **Hint** for a nudge (the square the strongest AI would play is highlighted), press again to reveal it outright. Any hint marks the game **assisted** in your history and Dashboard.
- **The computer never snaps.** Its reply is floored to at least one animation, so you can watch the flips land. Discs reskin per theme (Dusk/Pastel/Croanada) but the board geometry never changes.
- Finished games are logged with the full move list to your archive.

## Strategy

### Beginner
- **Don't chase disc count early.** A big lead on move 15 is often a trap — those discs are stuck near the edge where they'll get flipped right back.
- **Avoid the squares next to a corner** (the "X-squares" and "C-squares") unless you're forced to. Playing there hands your opponent the adjacent corner for free.
- **Corners are permanent.** A disc in a corner can never be flipped — it anchors an entire edge.

### Intermediate
- **Play for mobility, not material.** Count how many legal moves you and your opponent have. Fewer of your discs on the board often means *more* future options, because your opponent runs out of safe squares first and is forced to open a corner.
- **Parity matters in the endgame.** With an even number of empty squares left, the player to move is often at a disadvantage — try to force your opponent into the last few placements in a region.
- **Edges are strong but not absolute.** An edge disc is safer than a central one, but a whole edge can still flip if it's not anchored by a corner at either end.

### Advanced
- **Frontier discs are liabilities.** A "frontier" disc — one touching an empty square — can be attacked from multiple directions. Minimizing your frontier while maximizing your opponent's is the core of strong positional play.
- **Sacrifice discs to control tempo.** Deliberately feeding your opponent a flip that steers them toward a bad corner-adjacent placement is a standard tactic.
- **Count exactly in the last 8–10 moves.** Once the board is nearly full, the game becomes calculable — strong players switch from heuristics to exact disc-counting the moment the position allows it.

## Traps & common mistakes

- **Playing next to an empty corner.** It's the single most common way to lose a game — you place adjacent to a corner (the X-square) and your opponent takes the corner itself, often flipping your disc as part of the bargain.
- **Racing for early disc count.** Filling the centre fast usually means the discs are unsupported and get flipped straight back next turn.
- **Ignoring mobility.** Getting yourself down to one legal move — especially a forced bad one — costs games even when the disc count still looks even.
- **Forgetting a mid-edge disc can still fall.** Only the corners are permanently safe; a long edge run can be flipped from the end if it isn't anchored on both sides.

## A worked example

Black already owns three discs in a diagonal line; White has one disc at the end of it. Placing at the empty end traps White's disc between two Black discs and flips it.

```
Black: b b b .        Black places at the dot.
White:       w
After: b b b b   (White's disc flips to Black — one move, one flip)
```

The same idea scales to entire edges: a single placement can flip five or six discs at once when they're all lined up between your new disc and an anchor you already control.

## Glossary

- **Flip** — an opposing disc changing colour because it was trapped in a line.
- **Corner** — a permanently safe square; never flippable once occupied.
- **X-square / C-square** — the diagonal and orthogonal neighbours of a corner; playing there before the corner is taken is usually a blunder.
- **Frontier disc** — a disc adjacent to an empty square, and therefore vulnerable to future flips.
- **Mobility** — the count of legal moves available; often more valuable than raw disc count until the endgame.

## Where to go next

If you like territory-and-flow abstract games, try **Hex** for pure connection strategy, or **Gomoku** for a game where placement matters just as much but nothing ever flips. **Connect Four** scratches a similar "simple rule, deep tactics" itch with gravity instead of geometry.
