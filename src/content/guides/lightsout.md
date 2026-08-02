# Lights Out

> Every press ripples outward in a plus shape — chase the lit cells down the board until the whole grid goes dark.

**At a glance** · Solo · one 5×5 grid · 5–15 min · Play it under **Logic** (`/logic`).

## What it is

Lights Out is a toggle puzzle, not a shading-and-clue puzzle — there are no numbers to read, only a grid of lights that are on or off. Pressing a cell flips it *and* its up-to-four orthogonal neighbours between on and off. The puzzle starts part-lit from a scramble and your job is to press cells until every light is off. Because every press is its own undo (pressing the same cell twice cancels out) and the order you press cells in never changes the final pattern, Lights Out rewards systematic play over trial and error — it's closer to a small piece of linear algebra in disguise than a classic deduction puzzle.

## Goal

Press cells until **every light on the board is off**.

## The grid & clues

The board is a fixed 5×5 grid of lights; there are no printed numbers anywhere — the "clue" is simply which lights start lit. Difficulty is chosen before you start (Easy/Medium/Hard), which controls how many random presses were used to scramble the board from all-off (4/7/11) — more scrambling presses generally means more of the board needs correcting, not a logically deeper puzzle. Because every scramble is itself built from legal presses, the number of presses used to scramble tells you an upper bound on how many presses it should take to solve (though your own solving path may take a different, sometimes shorter, set).

## Rules

1. Every cell is a light, either on or off.
2. Pressing a cell toggles it **and** its orthogonal neighbours (up, down, left, right) — a plus shape. Cells off the edge of the grid simply aren't toggled; there's no wraparound.
3. You may press any cell any number of times.
4. Pressing the same cell twice in a row is equivalent to not pressing it at all — each press is its own inverse.
5. The order of presses doesn't affect the final board state — only *which* cells you pressed, and how many times (odd or even) each one was pressed, matters.
6. The goal state is every light off.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Lights Out and a difficulty (Easy/Medium/Hard), which sets how many random presses scrambled the board from all-off. Because the scramble is built from legal presses, pressing that same set again (in any order) always clears it — the puzzle is guaranteed solvable.
- **Pressing.** Click a lit or unlit cell to toggle its plus-shaped cross; your tap count is tracked and shown live.
- **The 💡 hint.** The app remembers which cells were pressed to scramble the board, and tracks the parity of your own presses so far — XORing the two tells it exactly which cells still need a press, without ever re-solving live. Press **Hint** for a nudge — one such cell highlights; press again to reveal, which presses it for you. Using it marks the puzzle **assisted**.
- **Completion.** Clearing the board (with at least one press made) logs the solve to your archive along with your tap count.

## Strategy

### Beginner — parity and footprint
- **Every press is reversible.** If you press a cell by mistake, press it again immediately to undo it cleanly — no cascading cleanup needed.
- **Corners touch the fewest lights.** A corner press only toggles 3 cells (itself plus two neighbours), an edge press 4, and only interior presses hit the full 5 — corners are the safest exploratory moves early on.
- **Leave settled darkness alone.** A cell that's off with all-off neighbours doesn't need attention; don't press near it "just in case," since that only reintroduces light.
- **Start from an isolated light if you see one.** A single lit cell surrounded by darkness, with no other lights nearby, is the simplest possible read: pressing it (and only it) is very often exactly right.

### Intermediate — chase the light downward
- **Process row by row, top to bottom.** Once you've decided what to press in the top row, move to the second row and press exactly the cells **directly below** any light still lit in the row above — pressing that cell is the only tool left that can clear a light in a row you've moved past, since nothing above it will be touched again.
- **Repeat down the board.** Continue the same rule row by row: whatever's still lit above you dictates exactly which cells to press in the row you're on now.
- **Judge your starting row by what's left at the bottom.** After chasing all the way down, if the bottom row isn't clear, your initial top-row presses were the wrong ones — adjust them and chase again rather than pressing randomly in the interior.
- **Keep a written or mental log of your top-row guess.** Since the whole solve hinges on that first row, it's worth tracking exactly which cells you tried there so you don't repeat a failed guess.

### Advanced — think in parity vectors
- **Treat the whole board as arithmetic mod 2.** Every press is a fixed pattern of toggles; the final board is the scramble XORed with the sum of all your presses. Solving is really solving a linear system over {0,1}, which is exactly why chasing from a guessed top row always either works or cleanly fails.
- **Search the top row systematically.** A 5×5 board only has 32 possible top-row press patterns — chase each one down and check the bottom row; the correct starting pattern reveals itself quickly rather than by luck.
- **Watch for "quiet" patterns.** Some board sizes (5×5 included) have a small number of nonzero press combinations that touch every light an even number of times and change nothing — meaning a solved board can sometimes accept extra, redundant presses. You'll never need one to solve the puzzle, but it explains why two different sequences can both legitimately clear the same board.
- **Minimise presses once you've found a solution.** If your chase-the-light pass used more presses than the original scramble, check whether XORing in a quiet pattern (or reworking your top-row guess) trims the total — useful if you're chasing a low tap count rather than just a clear board.

## Traps & common mistakes

- **Assuming wraparound.** Pressing an edge or corner does **not** wrap to the opposite side — only real orthogonal neighbours toggle.
- **Double-pressing out of frustration.** Two presses on the same cell cancel each other, so hammering a stubborn light twice undoes your own progress.
- **Chasing lights in the wrong direction.** The "press below to clear above" rule only works moving top-to-bottom; trying to chase sideways or bottom-up doesn't correspond to any single relationship.
- **Forgetting difficulty only changes scramble depth.** A "Hard" board isn't logically trickier, just more scrambled — the same chase-the-light method applies at every difficulty.
- **Confusing the plus shape with a full 3×3.** Only the orthogonal neighbours toggle, not the diagonals — that distinction is the entire reason a corner press is cheaper than an interior one.

## A worked example

Chasing a lit cell down one row:

```
Row 1 has a light on at column 3 after your opening
presses. Nothing above row 1 exists, so the only
remaining lever is the cell directly below it:

 . . O . .   row1     Press row2/col3. It toggles
 . . . . .   row2     row1/col3 off (done), plus its
                       own cross -- row2 now carries
                       whatever that press left behind,
                       ready to be chased into row3.
```

Every row's leftover lights get handed down exactly the same way, until only the bottom row is left to judge your starting guess.

## Glossary

- **Press / toggle** — clicking a cell, which flips it and its orthogonal neighbours.
- **Parity** — whether a cell has been pressed (directly or via a neighbour) an odd or even number of times; only odd presses matter to the final state.
- **Chase-the-light** — the row-by-row technique of pressing the cell below any light left over from the row above.
- **Quiet pattern** — a nonzero set of presses that changes nothing on the board (exists for some grid sizes, including 5×5).
- **Top-row guess** — the initial press pattern for the first row that the whole chase-the-light solve is built on; wrong guesses are revealed by a non-clear bottom row.

## Where to go next

Lights Out sits apart from the Logic Lab's shading-and-clue puzzles — for more of that same mechanical, parity-driven feel, try **Mastermind** (deduction from aggregate feedback rather than spatial toggles) or the **15-Puzzle** (no clues at all, just legal moves to chase toward order).
