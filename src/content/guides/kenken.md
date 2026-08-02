# KenKen

> A Latin square hiding behind arithmetic — solve the cages and the digits fall into place with no clue cell ever shown outright.

**At a glance** · Solo · one 5×5 puzzle, fresh cages every time · 10–25 min · Play it under **Logic** (`/logic`).

## What it is

KenKen (also called Calcudoku) was created by the Japanese maths teacher Tetsuya Miyamoto in 2004 as a classroom tool — the idea being that students would practise arithmetic without realizing it, chasing the logic instead of dreading the sums. Structurally it's a Latin square (Sudoku's row/column rule, minus the boxes) chopped into irregular "cages," each carrying a target number and an operation its cells must produce together. There are no pre-filled digits at all — every cell starts blank, and the cage arithmetic alone is enough to pin down one unique grid.

## Goal

Fill every cell with a digit from 1 to 5 so each row and column contains every digit exactly once, **and** every cage's cells combine — via its stated operation — to produce its target number.

## The grid & clues

The board is a 5×5 grid (fixed size in this app — there's no size selector). It's partitioned into cages of irregular shape, usually 1 to 4 orthogonally-connected cells. Each cage displays its clue (e.g. "7+", "3-", "10×", "2÷", or a bare number for a single-cell "=" cage) in its top-left-most cell; the cage's outline is drawn with heavier borders so you can read its full shape at a glance. Cages with 3 or more cells only ever use + or × — subtraction and division only make unambiguous sense between exactly two numbers.

## Rules

1. Place a digit **1–5** in every cell.
2. **No digit repeats within a row.**
3. **No digit repeats within a column.**
4. Every cage's cells must combine to its target under its operation:
   - **=** (single-cell cage) — the cell simply equals the target.
   - **+** — the cage's digits sum to the target.
   - **×** — the cage's digits multiply to the target.
   - **−** — (two cells only) the absolute difference of the two digits equals the target.
   - **÷** — (two cells only) the larger digit divided by the smaller equals the target.
5. A cage is only checked once every one of its cells is filled — but a completed cage that fails its arithmetic is flagged immediately.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose KenKen and you get a freshly generated 5×5 with new cages every time — there's no difficulty selector, since the cage layout itself is the entire difficulty knob. The generator carves the grid into random cages, assigns each an operation and target from a hidden solution, then checks — by exhaustive search, the same technique Sudoku uses — that the cage set alone pins a unique grid. If 60 attempts of cage-carving fail to produce one, it falls back to a trivial puzzle of all single-cell "=" cages, so a solvable, unique puzzle is always guaranteed.
- **Filling cells.** Select a cell, then tap a digit 1–5 on the pad (tap the same digit again to clear). Row/column repeats and completed-but-wrong cages both light up red.
- **The 💡 hint.** The full solution is stored from generation, so a hint never re-solves anything. Press **Hint** for a *nudge* — the next cell worth looking at is highlighted; press again to *reveal* its digit. Any hint use marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** A correctly filled grid logs the solve to your archive.

## Strategy

### Beginner
- **Solve the small cages first.** Single-cell "=" cages are free digits. Two-cell "−" and "÷" cages have very few legal pairs within 1–5 — a "4-" cage can only be {1,5}; a "2÷" cage can only be {1,2} or {2,4} (since 6 falls outside the 1–5 range).
- **Extremes narrow sums fast.** A "9+" cage of two cells on a 1–5 grid can only be {4,5} — the maximum possible pair. Very large and very small clues both collapse quickly.
- **Cross off like a Latin square.** Once a digit is placed, it's gone from the rest of that row and column regardless of which cage it's in — apply that immediately, even to cells outside the cage you just solved.

### Intermediate
- **Enumerate combinations, then filter by Latin constraints.** For a 3-cell "10+" cage, list every unordered digit triple from 1–5 that sums to 10, then eliminate any that would force a repeat in a row or column the cage touches.
- **Watch cages that span two rows or columns.** Their arithmetic constrains two lines of the Latin square at once — solving them first often cascades into neighboring cages.
- **Use "must contain" digits.** If every remaining valid combination for a cage includes a particular digit, that digit is locked into the cage somewhere, even before you know which specific cell.

### Advanced
- **Divisibility pruning.** For "×" and "÷" cages, check the target's factorization before enumerating candidates — a "÷" cage's target must divide one number into the other exactly, which usually eliminates most of the 1–5 range instantly.
- **Cross-cage propagation.** After forcing one cage's digit, immediately re-scan every cage sharing a row or column with that cell — the freshly placed digit often collapses a neighboring cage's remaining combinations down to one.
- **Hypothetical branching on the tightest cage.** When no more direct forcing is available, pick the cage with the fewest legal combinations left, try one, and follow the forced consequences until either the grid completes or a Latin-square contradiction appears.

## Traps & common mistakes

- **Assuming cages are straight lines.** Cages are often L-shaped or blobby; read the heavy borders, not the label's position, or you'll misjudge which cells belong to it.
- **Treating "−" and "÷" as commutative sums.** They only ever apply to exactly two cells, and both are order-independent (largest minus/over smallest) — there's no three-or-more-cell version of either.
- **Ignoring row/column legality while chasing cage math.** A combination that satisfies the target can still collide with a digit already placed elsewhere in that row or column.
- **Stale candidates.** After any forced placement, re-check every cage and line touching the changed cell — an old elimination list goes stale fast on a board this dense.

## A worked example

A two-cell subtraction cage pinned by its own arithmetic, no Latin-square help needed:

```
Cage "4-" sits over two cells on a 1-5 grid.
Only pair with |a-b| = 4 is {1, 5}.

 [ 4- ][    ]   ->   [ 1 ][ 5 ]   or   [ 5 ][ 1 ]

Row/column context (whichever digit already
appears elsewhere in that line) picks the order.
```

## Glossary

- **Cage** — a group of orthogonally-connected cells sharing one arithmetic clue.
- **Target** — the number a cage's operation must produce from its cells.
- **Latin square** — a grid where each symbol appears exactly once per row and column.
- **"=" cage** — a single-cell cage; its target is just its answer.

## Where to go next

For more of the same Latin-square backbone, try **Sudoku** (no arithmetic, just placement logic) and **Futoshiki** and **Skyscrapers**, which swap cage math for inequality signs and line-of-sight counts.
