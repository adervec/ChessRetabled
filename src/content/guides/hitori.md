# Hitori

> Cross out just enough to make every number honest, and the cells you leave behind still have to hold together as one island.

**At a glance** · Solo · 6×6 grid · 10–20 min · Play it under **Logic** (`/logic`).

## What it is

Hitori ("alone" in Japanese) comes from Nikoli, the same Japanese publisher that popularized Sudoku. It flips the usual "fill the grid" formula: you start with a fully numbered grid and your job is to shade cells out until what remains obeys three rules at once. It rewards a different kind of thinking than most logic grids — instead of placing symbols, you're proving which ones don't belong, while keeping everything you leave behind in one piece.

## Goal

Shade some cells so that no number repeats among the unshaded cells of any row or column, no two shaded cells touch edge-to-edge, and every remaining unshaded cell is reachable from every other unshaded cell without crossing a shaded one.

## The grid & clues

The board is a fixed 6×6 grid, pre-filled with numbers 1–6 built from a cyclic Latin square, so every row and column already contains each number once before any shading happens. The generator then picks a random subset of cells to shade — restricted to alternating (checkerboard-parity) cells, which is exactly why no two of them start out adjacent — and, for every cell it marks shaded, secretly overwrites its number to duplicate another cell in the same row. That duplication is what makes shading it (rather than something else) the correct call: without the shading, that repeat would break the row rule.

## Rules

1. Every cell is either **shaded** or **unshaded**.
2. **No number may repeat among the unshaded cells of any row or column.**
3. **No two shaded cells may be orthogonally adjacent** (touching diagonally is fine — only a shared edge is banned).
4. **All unshaded cells must form a single connected region**, reachable from one another moving up, down, left, or right through unshaded cells only.
5. A shading is correct the moment all three rules hold at once — you don't have to reproduce the generator's exact original shading (see below).

## How it works in ChessRetabled

- **Opening a puzzle.** Under Logic, choose Hitori for a fresh 6×6 board and shading every time; there's no difficulty selector.
- **Toggling cells.** Tap a cell to shade it (its number disappears under the shading); tap again to unshade.
- **Conflicts.** Two touching shaded cells, or a duplicate number left unshaded in a row/column, are both flagged red live. Connectivity isn't flagged cell-by-cell — check the whole board's shape before declaring victory, since the win check does require it.
- **Note on uniqueness.** Unlike the puzzles that run an exhaustive uniqueness search (Sudoku, Binairo, Futoshiki, KenKen, Skyscrapers), Hitori's generator builds one guaranteed-valid shading directly rather than proving no other shading also works. In practice the "every shaded cell duplicates a specific same-row cell" construction usually pins the answer tightly, but the win check only verifies the three rules against whatever you've shaded — so an alternative valid shading, if one exists, is accepted just as readily as the generator's original.
- **The 💡 hint.** Press **Hint** for a *nudge* — it highlights a cell whose shaded state doesn't match the generator's original solution; press again to *reveal* it, setting the cell correctly. Using a hint marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** A valid shading logs the solve to your archive.

## Strategy

### Beginner
- **Find the obvious duplicate pairs first.** Scan each row and column for a repeated number — at least one copy in the pair (sometimes more than one candidate) must be shaded.
- **Never shade both of an adjacent pair.** If two duplicate cells happen to sit next to each other, shading both would violate the no-adjacent-shaded rule — so exactly one of them must be shaded, and the choice needs support from elsewhere.
- **A number appearing three or more times in a line** means at least all-but-one of those copies get shaded — but since no two shaded cells can touch, a spread-out triple often resolves to "exactly which ones" almost immediately.

### Intermediate
- **Unshaded is provable too.** If shading a candidate cell would cut off a region of unshaded cells from the rest of the board, that cell must actually stay unshaded — even if it looks like a duplicate candidate at first glance.
- **A cell flanked on two opposite sides by shaded cells must stay unshaded.** Two shaded cells can never be adjacent to *each other*, but both can be adjacent to the same unshaded cell sitting between them — so that middle cell is forced clear.
- **Chain the "one of these two" deductions.** When a duplicate pair's shading choice depends on a neighboring pair's choice (because they can't both be shaded if adjacent), trace the dependency chain across the whole row or column before committing to either.

### Advanced
- **Use connectivity as a late-stage filter.** After the row/column duplicate rule narrows candidates to a small set, mentally trace the unshaded region — a shading choice that's locally valid can still split the board into two islands, ruling it out even without any direct number conflict.
- **Resolve edges and corners first.** A duplicate pair on the border has fewer neighbors, so its "no adjacent shaded" implications are cheaper to trace — clear up border conflicts before diving into the interior.
- **Test connectivity last, not first.** It's the most expensive rule to check by eye, so exhaust the row/column/adjacency deductions first and reach for connectivity only to break a genuine tie between two otherwise-valid shadings.

## Traps & common mistakes

- **Shading a cell that severs the board.** It's easy to satisfy the row/column and adjacency rules and still accidentally cut the unshaded region into two pieces — always sanity-check the whole board's connectivity before finishing.
- **Assuming every duplicate must be shaded.** Only enough copies to leave no repeats behind need shading — over-shading a line can create a fresh problem, either isolating a neighbor or leaving a different duplicate unshaded elsewhere.
- **Forgetting diagonals are fine.** Only edge-adjacency is banned for shaded cells; two shaded cells touching only at a corner are perfectly legal.
- **Losing track of numbers hidden under shading.** Once shaded, a cell's number disappears from view — note it mentally before shading if you might need to reconsider the decision.

## A worked example

A forced-clear cell between two shaded neighbors:

```
Row fragment:  [ shaded ][  ?  ][ shaded ]

Two shaded cells can never be adjacent to each
other -- but both CAN be adjacent to the same
unshaded cell between them. So "?" must stay
clear, regardless of whether its number
duplicates elsewhere.
```

## Glossary

- **Shaded** — a blacked-out cell, removed from row/column number-counting.
- **Connectivity** — the requirement that all unshaded cells form one reachable region.
- **Adjacent** — sharing an edge (not just a corner) with another cell.
- **Duplicate** — two or more unshaded cells in the same row or column carrying the same number.

## Where to go next

**Binairo** shares the "shade or fill under strict line rules" feel with a numeric alphabet of just two symbols; **Nurikabe** is a close cousin built around connected sea and island regions instead of duplicate numbers.
