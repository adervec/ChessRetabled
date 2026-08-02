# Star Battle

> One star per row, one per column, one per region — and heaven help you if two of them touch.

**At a glance** · Solo · one puzzle, one answer · 8–18 min · Play it under **Logic** (`/logic`).

## What it is

Star Battle is a pure placement puzzle — no numbers to fill in at all, just cells to mark. You're placing stars across a grid that's been carved into oddly-shaped coloured regions, and three separate counting rules all have to land on exactly one star per line. What makes it more than a straightforward Latin-square exercise is the fourth rule: stars can't even touch diagonally, which turns "one per row/column/region" into a spatial packing problem as much as a counting one.

That packing dimension is what gives Star Battle its distinct feel among the Logic Lab's puzzles — you're not so much solving equations as fitting shapes together under a repulsion rule, closer to laying out non-adjacent points on a map than filling in a table. As with every Logic Lab puzzle, a valid board has exactly one arrangement of stars satisfying every rule at once.

## Goal

Place stars on the grid so that **every row has exactly one star**, **every column has exactly one star**, **every region has exactly one star**, and **no two stars occupy touching cells**. All four conditions hold at the same time across the whole board — a layout that gets the rows and columns right but lets two stars touch diagonally is still an invalid solve.

## The grid & clues

The board is a fixed **6×6** grid split into six irregular, connected **regions**, each drawn with its own colour and edge highlighting. There are no numeric clues to read — the puzzle is entirely about the shape of the regions and the placement rule, which together force a single valid star layout. There's no difficulty selector; every fresh puzzle grows a new random set of six regions, so the challenge comes purely from how those shapes happen to interlock.

Because the regions are grown outward from six starting cells rather than
hand-drawn, they can end up wildly different sizes — a long snaking
region hugging one edge of the board next to a compact blob in a corner
is completely normal, and often the compact ones are the fastest to
crack.

## Rules

1. Place exactly **one star in every row**.
2. Place exactly **one star in every column**.
3. Place exactly **one star in every region**.
4. **No two stars may touch**, including diagonally — every star's eight surrounding cells must stay empty.
5. This is the classic **one-star** variant (not the tougher two-stars-per-line version found in some other Star Battle implementations) — with a 6×6 board that means exactly six stars total.

Rule 4 is what makes Star Battle harder than it looks on paper: a
placement that would be perfectly legal by row, column, and region count
alone can still be wrong purely because of a star sitting one square away
on the diagonal. Always check both kinds of rule — counting and
touching — before locking in a placement.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Star Battle. The generator starts from a random permutation of one star per row and column where no two stars in adjacent rows sit in adjacent columns, then grows six irregular regions outward from those star cells until the whole grid is covered — retrying the whole layout until it has exactly one valid star arrangement.
- **Filling cells.** Click any cell to toggle a star on or off. A star that breaks its row or column count, or touches another star, is flagged red immediately. Region borders are colour-coded on the grid.
- **The 💡 hint.** Every generated puzzle stores its full solution, so a hint never re-solves anything. Press **Hint** for a *nudge* — the first cell that disagrees with the solution (missing or wrongly placed) lights up; press again to *reveal* it. Using a hint marks the puzzle **assisted**.
- **Completion.** Exactly one star per row, column, and region, with no touching pairs, logs the solve to your archive.
- **Starting over.** **New puzzle** regenerates a fresh six-region layout rather than reshuffling stars on the same one.

## Strategy

Because there are no numbers on the board at all, every deduction in Star
Battle comes from counting cells and shapes directly — how many rows a
region spans, how many candidate cells a row has left, and how much of
the board a placed star's exclusion zone eats up.

### Beginner — read the region shapes
- **Line-locked regions.** If a region's cells are entirely confined to a single row (or column), that row's star has to come from within the region — every other cell in that row, outside the region, can be crossed off right away.
- **Corners resolve first.** Regions hugging a grid corner have fewer neighbouring cells to avoid, so they tend to have the fewest legal placements — work those out early.
- **Clear the halo immediately.** The moment any star is placed, cross off all eight surrounding cells on sight — no other star, from any row, column, or region, can ever land there.
- **Count each region's total cells.** A region with very few cells overall has fewer places its star could possibly be — treat small regions as priority targets before larger, more flexible ones.

### Intermediate — count across bands
- **Confined-column regions.** If a region's cells all sit within just two columns, its star occupies one of those two columns — meaning any *other* region's candidate cells in those same two columns just lost a competitor for that column's single star.
- **Interlocking pairs.** If two regions between them span exactly two rows (and no other region reaches those rows), their two stars must split those rows one each — eliminate any placement that would put both regions' stars in the same row.
- **Watch for the last legal cell.** Once row, column, and touching exclusions are applied, a region reduced to a single remaining candidate must take its star there — the same "naked single" logic as a fully-constrained Sudoku cell.
- **Recheck neighbouring regions after every placement.** A newly placed star's exclusion zone often falls right on the edge of an adjacent region, quietly reducing its candidate count too — don't just move on to the next region without rechecking the ones you've already passed.

### Advanced — chain the constraints
- **Band counting.** If a cluster of regions is entirely confined within a band of rows — say three regions covering only rows 1 through 3 — those regions must supply exactly three stars, one per row, between themselves. Any other region's candidate cell that also falls inside rows 1–3 is then dead, since those three stars are already spoken for.
- **Ripple the touching zones together.** In a densely packed cluster of regions, track every confirmed star's exclusion zone jointly rather than one at a time — a chain of forced non-placements often only resolves once you consider several stars' halos at once.
- **Diagonal-twin elimination.** If a region's only two remaining candidates are diagonally adjacent to each other, placing a star in one instantly kills the other for *any* region, not just its own — cross-reference that against neighbouring regions sharing those same cells.
- **Combine row bands with column bands.** The same band-counting trick works across columns too, and applying both simultaneously to a cramped section of the board often narrows a stubborn region down to one workable cell faster than either check alone.

## Traps & common mistakes

- **Forgetting diagonal touching.** A star placed one square diagonally from an existing star looks fine at a glance but is still illegal — the exclusion zone is a full 3×3 block around every star.
- **Expecting two stars per line.** ChessRetabled's Star Battle is the one-star variant — once a row, column, or region already has its star, don't go looking for a second one.
- **Placing by elimination without a final check.** A cell being "the only one left" in a region doesn't automatically make it legal — always confirm it doesn't touch an existing star or duplicate a row/column that's already used.
- **Ignoring region status when scanning rows.** A row can look wide open, but if every remaining cell belongs to a region that already placed its star elsewhere, that row is actually stuck — check regions, not just row and column counts.
- **Losing track of which exclusion zones are already applied.** On a crowded board it's easy to forget a star placed several moves ago is still blocking cells nearby — periodically re-scan the whole board for any leftover legal-looking cells that are secretly already excluded.

## A worked example

```
. . . .
. . β β
. . . .
. . . .
```

Region β's cells are confined entirely to row 2 (its only two
cells sit there). No other region touches row 2 at all, so β's
star must be the row's star, and it must come from one of those
two cells. If a star has already been placed elsewhere in column
1 (so β can't use that column), β's star is forced into its
remaining cell — column 3 of row 2.

That single forced star then blanks out a 3×3 block around it,
which is often exactly the nudge a neighbouring region needs — a
region that looked like it had two or three options a moment ago
can drop straight down to one once this kind of chain reaction is
accounted for.

## Glossary

- **Region** — one of the six irregular coloured areas; needs exactly one star.
- **Touching** — any of the eight neighbouring cells (orthogonal and diagonal); no two stars may occupy touching cells.
- **Naked single** — a row, column, or region reduced to exactly one legal remaining cell.
- **One-star variant** — the rule set used here: exactly one star per row, column, and region (as opposed to two-star Star Battle variants elsewhere).
- **Exclusion zone / halo** — the 3×3 block of cells immediately around a placed star, all of which are permanently off-limits.
- **Band** — a contiguous group of rows (or columns) entirely covered by a set of regions, useful for counting how many stars that group must supply.

## Where to go next

Like the placement-with-exclusion puzzle? **Suguru** carries the same diagonal touching-exclusion into a digit-filling puzzle, **Skyscrapers** shares the "one per row and column" backbone with a line-of-sight twist, and **Tents** pairs placement and non-adjacency with row/column counts of its own.

Tents in particular scratches a very similar itch to Star Battle's halo
rule — you're once again placing markers that must stay apart from one
another while still satisfying line totals, just with a fixed tree to
anchor each tent instead of a free region to fill.
