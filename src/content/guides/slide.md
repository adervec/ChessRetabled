# 15-Puzzle

> Fifteen numbered tiles, one gap, and nothing but legal slides between here and order.

**At a glance** · Solo · one 4×4 board · 5–15 min · Play it under **Logic** (`/logic`).

## What it is

The 15-Puzzle is the odd one out in the Logic Lab: every other puzzle here is a deduction puzzle with a clue set and a hidden logical solution, but the 15-Puzzle is a **sliding tile puzzle** — a mechanical rearrangement problem, not a reasoning one. There's nothing to deduce; the tiles' current positions and the goal arrangement are both in full view the entire time. What takes skill is planning a sequence of slides that gets every tile home without scrambling the ones you've already placed. It's the same classic toy that's been sold in plastic trays since the 19th century, just rendered on-screen.

## Goal

Slide tiles through the single gap until the board reads **1–15 in order, left to right and top to bottom, with the blank in the bottom-right corner.**

## The grid & clues

The board is a fixed 4×4 grid of 16 spaces: fifteen numbered tiles and one blank. There are no clues to read — only the current scramble versus the known goal layout. The puzzle is scrambled from the solved position using 120 random *legal* slides, so however jumbled it looks, it is always reachable back to the goal. Unlike a puzzle assembled by randomly placing tiles (which is only solvable half the time, due to permutation parity), scrambling by legal moves alone sidesteps that problem entirely.

## Rules

1. Tiles sit in a 4×4 grid with exactly one empty space (the blank).
2. A move slides any tile **orthogonally adjacent** to the blank into the blank's space; the tile's old space becomes the new blank.
3. No diagonal moves, and no jumping a tile over another.
4. You may make as many moves as you like; the puzzle only cares about the final arrangement, though your move count is tracked.
5. The goal arrangement is 1–15 reading left-to-right, top-to-bottom, with the blank last (bottom-right).
6. Every move is reversible — sliding the same tile back the way it came exactly undoes it.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose the 15-Puzzle. There's no difficulty selector — every board is the same 4×4 size, scrambled by 120 random legal slides (with an immediate-undo guard so the scramble doesn't just cancel itself out), which guarantees the result is always solvable.
- **Sliding.** Only tiles orthogonally next to the blank are clickable; clicking one slides it into the gap. Your slide count is shown live.
- **No hint, by design.** Unlike every other Logic Lab puzzle, the 15-Puzzle offers **no progressive hint**. Getting the tiles in order is a mechanical execution problem, not a deductive one — there's no "next logical cell" to nudge toward, so the app deliberately leaves this one entirely up to your own planning.
- **Completion.** Reaching the solved arrangement (with at least one slide made) logs the solve to your archive with your total slide count.

## Strategy

### Beginner — one tile at a time
- **Bring a tile home via the gap, not a straight line.** Since only the blank can move tiles, "moving" tile 7 to its spot really means walking the *blank* around to sit next to 7, then sliding 7 one step at a time toward its destination — plan the blank's path, not the tile's.
- **Solve low numbers first.** Tiles 1 and 2 have nothing placed yet to protect, so they're the easiest to seat without disturbing anything.
- **Use a "staging" spot.** When a tile needs to travel across the board, park it one square short of its destination first, then bring the blank around to push it the last step in — sliding it directly in one motion usually shoves it past where you need it.
- **Watch which way the blank is facing.** Before every slide, notice whether the blank is above, below, or beside your target tile — that tells you immediately which direction the next slide has to go.

### Intermediate — solve a row, then a column
- **Finish the top row completely.** Place tiles 1 and 2 outright, but for the last pair in the row (3 and 4), tuck them into a temporary staging position first, then rotate them up-and-over into place together with the blank. This avoids the classic trap of getting them seated but swapped with no direct fix.
- **Then finish the left column the same way** (tiles 5 and 9), treating it exactly like the top row rotated 90°, without disturbing the row you just locked.
- **Work only within the remaining sub-board.** Once the top row and left column are locked, mentally treat the rest as a smaller puzzle — everything you do from here on should route the blank only through the unsolved region.
- **Never route the blank back through a solved row or column** unless you're deliberately about to disturb it — every pass through a finished area risks nudging a tile out.

### Advanced — the final block and the rotation trick
- **Peel another row and column the same way.** Repeating the row-then-column technique on the reduced board shrinks it again, until only a final 3×2 (or 2×3) block of six tiles remains.
- **Solve the final block tile by tile**, using the same staging approach — but the very last two tiles can't be fixed with an ordinary slide if they land swapped, because a single slide can't transpose two tiles without moving a third.
- **The last-two-tiles rotation.** When the final two tiles are reversed relative to their homes, place them **both in the wrong final positions on purpose** (one row/column short of done, in swapped order), then walk the blank in a small loop around them — this performs a genuine three-way rotation that seats one tile correctly and swings the other into a position where a second short loop finishes the job.
- **Plan the whole endgame before you start it.** Because the rotation trick temporarily "un-solves" two tiles on purpose, it's easy to lose track mid-maneuver — count out the exact loop you intend to take before making the first move of the sequence.

## Traps & common mistakes

- **Fixing tiles in raw numeric order, cell by cell.** Without the staging step, placing tile 5 directly often shoves an already-placed tile 1–4 out of position.
- **Panicking over a "stuck" board.** Every scrambled puzzle here is reachable to the goal by construction — if it feels unsolvable, you've backed yourself into a spot that needs unwinding, not an impossible position.
- **Forgetting every slide is reversible.** If a maneuver goes wrong, you can always retrace your last few slides exactly to get back to a known-good state.
- **Trying to place the final two tiles directly.** They will not go in with ordinary slides if swapped — that's what the rotation trick exists for, not a sign of a bug.
- **Reaching for a hint that doesn't exist.** This puzzle deliberately has none — if you're stuck, the fix is to back out a few slides and re-plan, not to look for a nudge button.

## A worked example

Rotating a stuck final pair into place:

```
Bottom-right corner needs tiles 14 and 15 in order,
but they've ended up swapped, with the blank beside:

 . 14 15     Instead of sliding 15 into its slot
 . 13  .     directly (which just re-swaps them),
             loop the blank around the pair through
             the open row below -- the loop cycles
             all three cells, dropping 14 and 15
             into their correct order on the way past.
```

The trick generalises: any "just two tiles swapped, everything else placed" situation resolves the same way — walk the blank in a small loop that includes both tiles.

## Glossary

- **Blank** — the single empty space; the only thing that actually "moves" between slides.
- **Slide** — moving one orthogonally-adjacent tile into the blank.
- **Staging** — temporarily parking a tile near, but not in, its final spot so the blank can manoeuvre it the last step without disturbing solved tiles.
- **Rotation trick** — the small blank-loop maneuver that fixes a last swapped pair, which no single slide can correct directly.
- **Sub-board** — the shrinking unsolved region left once you've locked a row and column, treated as a smaller version of the same puzzle.

## Where to go next

For more of the Logic Lab's non-deductive, purely mechanical puzzles, try **Lights Out** (legal toggles instead of legal slides, but the same "always solvable by construction" guarantee) or **Mastermind** (no board state at all — pure code-breaking from feedback).
