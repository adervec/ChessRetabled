# Aquarium

> Water always finds its level — work out how high each tank is filled and the row and column totals fall into place.

**At a glance** · Solo · one 6×6 grid · 10–20 min · Play it under **Logic** (`/logic`).

## What it is

Aquarium is a shading puzzle dressed up as plumbing: the grid is carved into irregular connected regions — "tanks" — and you decide how much water sits in each one. Water obeys gravity, so within a tank it always fills from the bottom up with no gaps, and every cell in a tank's row is flooded or dry together, exactly as a real cross-section of water would be. Numbers along the right and bottom edges tell you how many filled cells belong to each row and column, and from those totals alone you can work out every tank's water line. Unlike a plain shading puzzle, the state space per tank is small — a tank spanning *k* rows only has *k*+1 possible water levels — which is exactly why the row and column arithmetic is enough to pin the whole board down.

## Goal

Choose a **water level for every tank** so that the total number of filled cells in each row, and in each column, matches the clue printed beside it.

## The grid & clues

The board is a fixed 6×6 grid, partitioned by the generator into connected tanks of 3 to 8 cells each (grown outward from random starting cells, so shapes are irregular blobs rather than tidy columns). Thick borders mark where one tank ends and the next begins. Row clues run down the right side, column clues along the bottom, each counting filled cells across the *whole* row or column, regardless of which tank they belong to. A single row or column is often crossed by two or three different tanks, so its clue is really a sum you have to split between them.

## Rules

1. Every cell belongs to exactly one tank.
2. Water settles at the bottom of each tank: if a cell holds water, every cell **below it in the same tank** must also hold water.
3. Water fills a whole row **of that tank** at once — a tank can't have some cells wet and others dry within the same row of its own shape.
4. A tank may also be completely empty (no water at all); there's no rule requiring every tank to hold at least some water.
5. Each row clue is the total number of filled cells in that row, added up across every tank that touches it.
6. Each column clue works the same way, down that column.
7. Tanks never interact directly with each other — the only thing they share is contributing to the same row/column totals.
8. A correct grid satisfies every row and column total simultaneously, and the puzzle's clue set pins down exactly one arrangement.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Aquarium — no difficulty selector; the generator re-partitions and re-floods a fresh 6×6 layout until its row/column clue set proves uniquely solvable.
- **Filling water.** Clicking any cell inside a tank doesn't toggle just that cell — it **sets the whole tank's water line** to pass through the row you clicked, raising or lowering every cell in that tank together to match. Row and column totals along the edges turn green when matched and flag if you've over-filled past the clue.
- **The 💡 hint.** Every generated puzzle stores its solved water lines, so a hint never re-solves. Press **Hint** for a nudge — a whole tank whose level is currently wrong gets outlined; press again to reveal, which sets that tank to its correct level in one step. Using it marks the puzzle **assisted**.
- **Completion.** Matching every row and column total logs the solve to your archive.

## Strategy

### Beginner — the edges
- **Zero and full lines.** A row or column clued 0 is entirely dry; one clued 6 (the full width/height) is entirely wet — fill or clear it outright.
- **Small tanks first.** A 3-cell tank has few possible water lines (empty, bottom row only, bottom two rows, or full) — far fewer options to weigh than an 8-cell one.
- **The bottom row of a tank fills first.** Because water can never float, if a tank has *any* water at all, its lowest row is wet — check whether a row clue demands that.
- **Single-tank rows and columns are easiest.** If only one tank touches a particular row, that row's clue applies to that tank alone — no splitting required.

### Intermediate — cross-referencing lines
- **Split a row's clue between its tanks.** If a row is crossed by two tanks and you've already pinned one tank's contribution, subtract it from the row clue to get the other tank's exact requirement for that row.
- **Chase a tank through both axes.** A wide tank contributes to several column clues at once — check every column it touches, not just the row you're currently reasoning about, since an over-tight column clue can rule out a water level a row clue alone would still allow.
- **Watch the transition rows.** The row where a tank's shape changes width (gets wider or narrower) is often where a column clue becomes decisive, since it's the row that adds or drops the most filled cells per unit of water level raised.
- **Use a tank's neighbours to bound it.** If two tanks share a row and one is already known to be empty there, the entire row clue for that row falls on the other tank alone.

### Advanced — bounding and elimination
- **Enumerate a tank's remaining options.** A tank spanning k rows has only k+1 possible states (empty, or filled from the bottom through each of its rows) — when two or three survive, test each against every row/column it touches and discard any that would overflow a clue.
- **Sum the forced minimums.** Once some tanks in a row are fully pinned, compare their combined contribution against the row clue; if it already equals the clue, every other tank crossing that row must be dry there — a powerful mass elimination.
- **Look for shared bottlenecks.** A row and a column that intersect inside the same tank double-constrain that one cell's water requirement — solve the tighter of the two clues first and let it drive the other.
- **Trial a level, propagate, and check for overflow.** With everything else exhausted, hypothesize one tank's water line, work out what that forces elsewhere via the row/column totals, and back out if any clue is exceeded — the unique-solution guarantee means a wrong guess always breaks something.

## Traps & common mistakes

- **Treating water like independent cells.** A single click moves an entire tank's water line, not one square — plan for the tank shape, not the pixel you tapped.
- **Assuming a filled cell forces its row-neighbour in a *different* tank.** Tanks are independent; only cells in the *same* tank interact through gravity.
- **Ignoring irregular tank shapes.** Tanks are grown blobs, not rectangles — a tank can be wider in one row than another, so its water contributes a different number of cells to each row it spans.
- **Forgetting the "whole row of a tank" rule.** You can't half-flood a wide row of a single tank — it's fully wet or fully dry once the water line reaches it.
- **Over-filling out of impatience.** Once a row's total is already met by other tanks, raising any further tank's level in that row will overshoot — check the running total before every click.

## A worked example

A tank pinned entirely from one column clue:

```
Tank T:  (row2,col4)  (row3,col4)  (row3,col5)
Column 4's clue is 2, and only T touches column 4.

 col4 col5
  ?    .     row2   Row3 is already known wet (a whole
  W    W     row3   row of T, so both its cells there
                     are flooded together). Column 4
                     has 1 wet cell so far but needs 2,
                     so row2/col4 must be wet too --
                     T's water line sits at row2, the
                     very top of the tank.
```

That single subtraction — clue minus what's already confirmed — is the same move that cracks nearly every tank once its neighbours are known.

## Glossary

- **Tank** — a connected region of cells that shares one water line.
- **Water line** — the topmost (shallowest) row filled with water in a tank.
- **Row/column clue** — the total filled-cell count required across that whole line, summed over every tank crossing it.
- **Gravity rule** — water in a tank always fills a contiguous block from its floor upward, never leaving gaps.
- **Transition row** — the row where a tank's shape widens or narrows, often the most informative row for column deductions.

## Where to go next

For more clue-driven shading, try **Tents** (row/column counts paired with a tree-matching twist) and **Kakurasu** (weighted sums instead of plain counts). **Nurikabe** swaps water for a connected sea and adds island-size numbers to the same shading instinct.
