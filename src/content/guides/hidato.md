# Hidato

> A single snake of consecutive numbers, coiled through every cell of the grid — find where it slithers.

**At a glance** · Solo · one puzzle, one answer · 8–20 min · Play it under **Logic** (`/logic`).

## What it is

Hidato (also called Hidoku) is a path puzzle disguised as a number-filling one. You aren't summing anything or avoiding repeats within rows and columns the way Sudoku does — you're reconstructing a single unbroken chain that visits every cell of the board exactly once, in order, where each step from one number to the next lands on a touching cell. A handful of numbers are given as checkpoints; the rest of the chain is uniquely implied by them.

The name comes from the Hebrew for "my riddle," and the appeal is exactly that: unlike most grid puzzles, there's no independent constraint on rows or columns at all — the *only* rule is "consecutive numbers touch." That single rule, applied across a fully-covered board, turns out to be enough to force a unique route once a handful of checkpoints are fixed. Like every puzzle in the Logic Lab, a proper Hidato has exactly one valid chain, so patient deduction always gets you there without a guess.

## Goal

Fill every empty cell with a number from **1 to 36** (one per cell, none repeated) so that every pair of consecutive numbers — *k* and *k+1* — sits in **touching cells**, for every *k* from 1 up to 35. There is nothing else to satisfy: no row totals, no colour rules — get the chain right and the whole board is automatically correct.

## The grid & clues

The board is a fixed **6×6** grid (36 cells). A subset of cells start with their number already printed — these are the **givens**, and they anchor the chain at known points. Everything else starts blank. Because the whole grid must be covered by one continuous path, the givens act like waypoints: the closer together two givens are in value, the tighter the corridor of cells between them. There's no difficulty selector — every fresh puzzle is a newly generated 6×6 chain, so the challenge varies naturally with how the givens happen to fall. A board with its givens spread evenly tends to solve in short, well-defined corridors; one with a wide gap between two checkpoints leaves more of the middle open to genuine multi-step deduction.

## Rules

Read carefully — the whole puzzle rests on rule 2, and every other rule
just describes the consequence of applying it consistently across all 36
cells.

1. Fill every empty cell with a number from **1 to 36**, each digit used exactly once across the whole grid.
2. Two consecutive numbers, *k* and *k+1*, must always occupy **adjacent cells** — and adjacency here means all **8 neighbours** (up, down, left, right, and all four diagonals), not just the four orthogonal ones.
3. Given clues are fixed and can't be overwritten.
4. The complete sequence 1→2→3→…→36 therefore traces one connected path that visits every single cell on the board exactly once (a Hamiltonian path).
5. A well-formed puzzle has only one path consistent with its givens.

It helps to think of the finished grid as one long snake curled up to fill
every cell of its terrarium: the snake never crosses itself, never leaves
a gap, and every one of its scales is numbered in order from head to tail.
Your job is to figure out exactly how it's coiled from only a few visible
scales.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Hidato. Each board is freshly generated: the game first lays down a random Hamiltonian path across the whole 6×6 grid, then thins the printed clues one at a time — a clue is only removed while a reconstruction-count check confirms the remaining givens still pin down exactly one chain. What you see is always solvable by pure logic, never by guessing.
- **Filling cells.** Select a cell, then use the number pad to enter its value; tapping digits in sequence grows a multi-digit number (tap 1 then 2 for 12), and out-of-range entries reset. Duplicate numbers and cells whose filled neighbour doesn't actually chain to them are flagged red as you go, so slips get caught immediately rather than compounding.
- **The 💡 hint.** Every generated puzzle stores its full solution, so a hint never re-solves anything. Press **Hint** for a *nudge* — the next wrong or empty cell lights up; press again to *reveal* its correct number. Using a hint marks the puzzle **assisted** in your history and Dashboard, keeping unaided solves distinct.
- **Completion.** A fully connected 1–36 chain logs the solve to your archive with your finishing time.
- **Starting over.** **New puzzle** discards the current board and its hint state, generating a fresh Hamiltonian chain rather than resetting the same one.

## Strategy

Every technique below leans on one idea: adjacency is symmetric and finite,
so a cell's *degree* — how many still-live neighbours it has — is always
computable, and cells with the fewest options are where the puzzle actually
reveals itself.

### Beginner — anchor and count
- **Work outward from givens.** Every printed clue is a fixed point in the chain; treat the cells immediately around it as the first place to hunt for *k−1* and *k+1*.
- **Measure the gap.** The king-move (8-direction) distance between two cells is the **Chebyshev distance** — the larger of the row-difference and column-difference. If two givens *k* and *k+m* are exactly *m* apart by that measure, there's no slack: the chain between them must move in a straight line (horizontal, vertical, or diagonal), filling every intermediate cell in order.
- **Corners and edges are scarce.** A corner cell has only 3 neighbours, an edge cell only 5 (versus 8 in the open middle) — numbers that must go there are the most constrained, so check them early.
- **Look for isolated pockets.** A small group of empty cells boxed in by filled ones on most sides has very few ways to be threaded — solve those pockets before tackling the wide-open middle of the board.
- **Number the neighbours, not just the cell.** When you're unsure where *k* goes, list every empty cell touching the confirmed *k−1*; if only one of them can also reach *k+1* within one more step, that's your answer.

### Intermediate — trace forced corridors
- **Taut corridors.** Once you spot a Chebyshev-distance-equals-gap pair (see above), trace the exact straight line between them and fill it — it's forced, not a guess.
- **Endpoints need only one link.** The cells holding 1 and 36 each need just a single live neighbour (their one successor or predecessor); every interior number needs exactly two — don't demand a second connection from an endpoint.
- **Watch for strangled cells.** If placing a candidate number in a cell would leave some other empty cell with zero remaining live neighbours for its own required links, that candidate is wrong — back off and try the next option.
- **Chain outward from both ends of a corridor at once.** Once a corridor is fixed, the numbers just past each end of it inherit a fresh, narrower set of candidate cells — resolve those before drifting elsewhere on the board.
- **Split the board at a bottleneck.** If a single cell is the only bridge between two halves of the remaining empty region, the chain must pass through it at exactly the point where the numbering crosses from one half to the other — use that to bound which values can even land in each half.

### Advanced — global feasibility
- **Track live neighbour counts.** As cells fill in, keep a running sense of how many open neighbours each remaining empty cell has; a cell that drops to exactly one option for a specific number is a forced placement, even if it isn't sitting inside an obvious corridor.
- **Don't trust the visual shape.** The path can double back and pass close to itself without touching improperly — a "neat" zigzag isn't required, so let the adjacency logic (not the picture) decide the route.
- **Recheck after every fill.** A single placement can turn a previously ambiguous stretch into a new taut corridor elsewhere on the board — re-scan the whole grid for fresh Chebyshev-equals-gap pairs after each forced move, rather than fixating on one region.
- **Use parity as a tiebreaker.** On a board with a wide, loosely-constrained gap between two givens, colouring the grid like a checkerboard and tracking which colour a numbered cell "should" land on (since each step alternates colour on an orthogonal move but not a diagonal one) can rule out an otherwise-plausible placement.
- **Fall back to trial deduction, not trial and error.** If two candidates remain for a stubborn cell, follow each one forward a few steps on paper (or in your head) — one of them will strand a neighbouring cell with zero live options within a step or two, disqualifying it logically rather than by luck.

## Traps & common mistakes

- **Forgetting diagonals count.** "Adjacent" means all 8 surrounding cells — a lot of false "unreachable" deductions come from only checking up/down/left/right.
- **Mistyping multi-digit numbers.** The number pad grows digits as you tap them, so a stray tap can silently produce the wrong two-digit value — clear a cell and retype if a number looks off.
- **Assuming straight lines everywhere.** Only force a straight corridor when the Chebyshev distance between two givens exactly equals their numeric gap — otherwise the chain has room to bend.
- **Ignoring already-placed non-given numbers.** Cells you've filled yourself are just as load-bearing as the original clues once you're confident in them — use them as new anchors for the next deduction.
- **Fixating on one end of the board.** A stuck corridor near one given often unlocks only once you've made progress from a completely different given elsewhere — if you're stalled, switch checkpoints rather than staring at the same gap.
- **Treating the puzzle like Sudoku.** There are no row, column, or box constraints here at all — resist the urge to hunt for "missing digits" in a line; the only thing that matters is which cells touch which.

## A worked example

```
1 . . 4
. . . .
. . . .
. . . .
```

The given 1 sits at the top-left corner and the given 4 sits three
cells to its right. The Chebyshev distance between those two cells
is 3 (three columns over, zero rows down) — exactly equal to the
numeric gap (4 − 1 = 3). With no slack available, the only way to
cover three steps in three hops is a straight line: 2 and 3 are
forced into the two cells between them, left to right.

Had the given 4 instead sat one row down and two columns over, the
Chebyshev distance would still be 3 while the straight-line option
along row 0 would no longer reach it — in that case the corridor
would have to bend, and only a careful neighbour-by-neighbour trace
(not the shortcut above) pins down the middle two cells.

## Glossary

- **Given / clue** — a pre-filled cell that anchors the chain.
- **Chain** — the sequence 1…36 forming one continuous path across the grid.
- **Chebyshev distance** — the king-move distance between two cells: the larger of the row and column differences.
- **Corridor** — a stretch of the chain forced into a straight line because a gap between two givens has no slack.
- **Endpoint** — the cell holding 1 or 36; it needs only one chain-neighbour instead of two.
- **Live neighbour** — an empty or compatible cell still available to extend the chain from a given point.
- **Degree** — the number of live neighbours an empty cell currently has; a degree of one is a forced move.
- **Bottleneck** — a single cell whose removal would split the remaining empty cells into two disconnected groups.

## Where to go next

Enjoy tracing a single unbroken route? **Numberlink** turns the same "connect and cover" idea into multiple simultaneous paths, **Bridges** links numbered islands with countable connections instead of a single chain, and **Nurikabe** tests the same connectivity instincts from the opposite direction — keeping one region joined while carving out isolated islands.

All three swap Hidato's single ever-lengthening snake for a different flavour of "make sure everything stays connected the right way" — a good next step once king-move adjacency feels second nature.
