# Kakurasu

> Every row and column is a scale, and every shaded cell adds its position's weight to both.

**At a glance** · Solo · one 5×5 grid · 5–15 min · Play it under **Logic** (`/logic`).

## What it is

Kakurasu (sometimes called Index Sum) hides simple arithmetic inside a shading puzzle. There's no picture to reveal and no "no repeats" rule like Sudoku's — instead, every column and every row carries an implicit **weight** equal to its position, and a shaded cell contributes that weight to both the row it's in and the column it's in, using two *different* weights at once. Get the shading right and every row and column clue balances simultaneously. It plays like a compact subset-sum puzzle five times over in each direction, with every cell doing double duty in one row-equation and one column-equation at once.

## Goal

Shade cells so that **each row's shaded cells sum to its clue using column position as weight**, and **each column's shaded cells sum to its clue using row position as weight**.

## The grid & clues

The board is a fixed 5×5 grid. Columns are numbered 1–5 left to right, and rows 1–5 top to bottom — these numbers are the weights, not separate clues. A shaded cell in column *c* contributes *c* to its row's running total; the same cell, read the other way, contributes its row number *r* to its column's running total. The clue printed beside each row/column is the target for that sum. The maximum possible clue is 1+2+3+4+5 = 15, if every cell in a line were shaded, and the minimum is 0, if none are.

## Rules

1. Shade any subset of the 25 cells.
2. For each row, add up the **column position** (1–5) of every shaded cell in that row — it must equal the row's clue.
3. For each column, add up the **row position** (1–5) of every shaded cell in that column — it must equal the column's clue.
4. Both sets of five equations must hold at once, and the puzzle guarantees exactly one shading satisfies them.
5. There is no constraint at all on how many cells are shaded per line — only the weighted sum matters.
6. A cell's two contributions (to its row and to its column) are computed independently — shading it always adds to both totals together, never just one.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Kakurasu — no difficulty selector; the generator re-shades a random 5×5 grid until its row/column sums pin down a unique solution.
- **Shading.** Click a cell to toggle it; a shaded cell displays its column number as a reminder of the weight it's contributing to its row. Rows or columns whose current sum has overshot their clue are flagged immediately.
- **The 💡 hint.** The puzzle's solution is stored from generation, so a hint never re-solves. Press **Hint** for a nudge — the first cell that disagrees with the solution highlights; press again to reveal, which sets it correctly. Using it marks the puzzle **assisted**.
- **Completion.** Matching every row and column sum logs the solve to your archive.

## Strategy

### Beginner — the extremes
- **Zero clues are free.** A row or column clued 0 has no shaded cells at all — clear it immediately.
- **Maximum clues are free too.** A clue of 15 (the 5×5 ceiling) means every cell in that line is shaded.
- **Rule out weights too big to fit.** If a row's clue is less than 5, its column-5 cell (weight 5) can't be shaded — a single cell heavier than the whole remaining target is automatically excluded. Apply the same test working down from the heaviest unresolved weight in any line.
- **A clue of 1 has only one answer.** Only the weight-1 cell can be shaded, since any heavier weight alone would already overshoot.

### Intermediate — treat each line as a sum
- **Think in subsets.** A row's clue is a target sum over the weights {1,2,3,4,5}; some targets only have one subset that reaches them (a clue of 14 can only be {5,4,3,2}, missing just weight 1) — when a target has a unique subset, the whole row is forced.
- **Work from the heaviest weight down.** Decide the column-5 cell first (can the clue still be hit without it? must it be included at all?), then column-4, and so on — at each step the remaining clue and remaining weights bound the decision.
- **Cross-check row logic against column logic.** A cell sits inside one row-subset problem and one column-subset problem simultaneously; a cell forced shaded by its row's arithmetic is also a data point for solving its column, and vice versa.
- **Track the running maximum.** At any point, the largest sum still reachable in a partially-solved line is the sum of its remaining undecided weights — if that maximum can no longer reach the clue, every one of those cells must be shaded, no exceptions.

### Advanced — intersecting constraints
- **Narrow via both axes at once.** When a row has more than one subset left that fits, don't try to break the tie from the row alone — check which of those subsets is also consistent with the columns those cells belong to; usually only one survives both directions.
- **Use the mirror trick.** Because a full line sums to 15, a clue of *k* is the exact mirror of a clue of 15−*k* with shading flipped — a stubborn high clue is often easier to reason about by solving its low-clue complement instead.
- **Propagate and only then guess.** Push every forced cell through both its row and column before considering a trial; if two subsets remain genuinely tied after full propagation, shade one, follow the consequences into its column, and watch for an overshoot to rule it out.
- **Watch mid-range clues last.** Clues near the middle of the 0–15 range have the most candidate subsets, so they're usually solved last, once the extremes and near-extremes elsewhere have pinned down enough shared cells to shrink the possibilities.

## Traps & common mistakes

- **Swapping the two weight systems.** Row clues use *column* position as weight; column clues use *row* position. It's easy to grab the wrong axis mid-solve.
- **Forgetting weights start at 1, not 0.** The leftmost column and topmost row carry weight 1 — there's no free "weight zero" cell.
- **Importing Sudoku instincts.** There's no rule against repeats or any cap on how many cells per line can be shaded — only the weighted sum matters, so a line can be all-shaded or single-cell and both are legal if the sum fits.
- **Losing track mid-subset.** When testing a subset of weights against a clue, recompute the running sum from scratch occasionally — a dropped or double-counted weight silently invalidates the whole deduction.
- **Forgetting a cell's dual role.** Shading a cell to satisfy its row can simultaneously break its column if you haven't checked both sums before committing to the click.

## A worked example

Excluding a cell by weight alone:

```
Row 3's clue is 4. The heaviest column weight is 5.

 c1 c2 c3 c4 c5    Since even shading c5 alone (weight 5)
  ?  ?  ?  ?  X     would already exceed the clue of 4,
                     c5 in row 3 must be unshaded -- no
                     arithmetic beyond "5 > 4" required.
```

The same one-line comparison — biggest remaining weight versus what's left of the clue — cracks most of the grid's edges before any subset-counting is needed.

## Glossary

- **Weight** — a cell's position (1–5) along the axis it's contributing to; row clues use column weight, column clues use row weight.
- **Clue** — the target weighted sum for a row or column.
- **Subset-sum** — the underlying arithmetic problem each line poses: which shaded cells' weights add to the clue.
- **Mirror clue** — a clue's complement (15 minus itself), solvable by flipping the shading of the low-clue equivalent.
- **Running maximum** — the largest sum still reachable in a line given its undecided cells; once it can't reach the clue, every one of those cells is forced.

## Where to go next

For more numeric shading, try **Mosaic** (local 3×3 counts instead of weighted sums) and **Aquarium** (row/column totals with a gravity twist). **Kakuro** scratches the same arithmetic itch with actual addition inside number-filled runs.
