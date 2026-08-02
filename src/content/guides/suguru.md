# Suguru

> Sudoku's "no repeats" rule, shrunk down to lopsided little cages and stretched out to every diagonal.

**At a glance** · Solo · one puzzle, one answer · 8–18 min · Play it under **Logic** (`/logic`).

## What it is

Suguru (also known as Tectonic) takes the Sudoku instinct of "this digit can only go once per group" and applies it to irregular, hand-shaped cages instead of tidy rows, columns, and boxes. Each cage is sized differently, so the digits it uses depend entirely on its own size — and on top of that, a second rule reaches *outside* the cage entirely: no two touching cells anywhere on the board, including diagonally, may share a digit.

That combination of a local rule (per-cage distinctness) and a global rule (touching exclusion) is what gives Suguru its bite. A digit that would be perfectly legal inside its own cage can still be knocked out because a neighbouring cage's cell happens to touch it — deduction has to consider both scopes at once, which is a genuinely different skill from Sudoku's line-based reasoning. Like every Logic Lab puzzle, a valid board has exactly one solution.

## Goal

Fill every empty cell with a digit so that **every cage contains each of its own digits exactly once** and **no two cells that touch — including diagonally — ever hold the same digit**. Both conditions apply everywhere on the board simultaneously; satisfying one while breaking the other still leaves the puzzle unsolved.

Think of it as running two separate checks over the same finished grid,
one cage at a time and one neighbourhood at a time, both of which have
to come back clean.

## The grid & clues

The board is a fixed **6×6** grid, divided into irregular, connected **cages** ranging from 2 to 5 cells each. A cage of size *k* is filled with digits **1 through k** — a 2-cell cage only ever uses {1,2}, a 5-cell cage the full {1,2,3,4,5}. Cage borders are drawn on the grid; some cells start as **givens** to anchor the deduction, the rest are empty. There's no difficulty selector — every fresh puzzle carves the board into a new random set of cage shapes, so the challenge shifts with how tightly those cages pack together.

A board with mostly small, spread-out cages tends to solve in short local
bursts, while one dominated by a couple of large 5-cell cages squeezed
next to each other rewards the cross-cage propagation techniques below —
notice which kind of board you've got before deciding where to start.

## Rules

1. Every cell holds a digit from **1 up to the size of its own cage** — never higher.
2. **Each cage contains every one of its digits exactly once** — no repeats within a cage.
3. **No two cells that touch — including all four diagonals — may hold the same digit**, even across a cage boundary.
4. Cage shapes are fixed for the puzzle; only the digits inside them are yours to fill.
5. A valid puzzle has exactly one digit assignment satisfying all of the above.

Rule 3 is the one that separates Suguru from a simple region-Sudoku: it
doesn't matter whether two touching cells belong to the same cage or two
completely different ones — if they're neighbours, even diagonally, they
can never match. Keep that rule active in the back of your mind for the
entire solve, not just when you're staring at a cage boundary.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Suguru. The generator flood-fills random irregular cages of size 2–5 across the whole 6×6 board, fills a complete valid solution using a most-constrained-cell search, then removes givens one at a time — only while a solution-count check confirms the board still has exactly one answer.
- **Filling cells.** Select a cell, then use the number pad — sized to the largest cage on the board — to place or clear a digit. Cage borders are drawn directly on the grid; conflicts (a digit over the cage's own size, a repeat inside the cage, or an equal digit on a touching neighbour) are flagged red live.
- **The 💡 hint.** Every generated puzzle stores its full solution, so a hint never re-solves anything. Press **Hint** for a *nudge* — the first wrong or empty cell lights up; press again to *reveal* its correct digit. Using a hint marks the puzzle **assisted**.
- **Completion.** A fully filled, conflict-free board logs the solve to your archive.
- **Starting over.** **New puzzle** regenerates both the cage layout and the solution, not just the digits inside a fixed set of shapes.

## Strategy

Every Suguru deduction is really two exclusions layered on top of each
other: what a cage's own size and contents rule out, and what the eight
surrounding cells rule out on top of that. Get comfortable checking both
before committing to a digit.

### Beginner — small cages and crowded cells
- **Two-cell cages resolve instantly.** A 2-cell cage only ever holds {1,2}; if either cell is already filled, the other is forced immediately.
- **Count filled neighbours.** A cell surrounded by several already-different digits — from its own cage *and* from touching neighbours in other cages — often has only one legal digit left; scan the most crowded cells first.
- **Respect the cage ceiling.** Never consider a digit higher than a cage's own size — a 3-cell cage can only ever hold 1, 2, or 3, no matter what the number pad offers for larger cages elsewhere.
- **Givens are worth more than they look.** A single given digit doesn't just fix its own cell — it immediately excludes that digit from up to eight touching cells and every other cell in its own cage, so trace its influence outward before looking elsewhere.

### Intermediate — sweep the full neighbourhood
- **Re-sweep after every placement.** Each filled cell excludes its digit from all 8 surrounding cells, not just its cage-mates — so a single placement can ripple into two or three neighbouring cages at once. Re-check candidates nearby every time you commit a digit.
- **Hidden singles inside a cage.** A digit may look like it has multiple homes within a cage until you apply the touching-exclusion from outside — once a cage's other candidate cells are ruled out by neighbours, the digit is forced into whichever cell remains.
- **Watch shared borders.** Where two similarly-sized cages meet along a long edge, matching digits directly across that border are usually impossible — use that to eliminate specific cell/digit pairs rather than whole candidates.
- **Prioritise cells with the fewest remaining candidates.** As with any constraint puzzle, working the most-constrained cell first tends to produce the next forced placement fastest, rather than picking cells at random.

### Advanced — propagate through tight clusters
- **Treat placements as ripples, not isolated moves.** Because the touching rule reaches diagonally, a single fill can affect cells two cage-widths away in a dense cluster — re-derive candidates for the whole local neighbourhood after each move rather than one cage at a time.
- **Diagonal twins.** Two diagonally-touching cells in *different* cages that share the same two remaining candidate digits can never hold the same one — if outside logic forces one of them, the other is immediately determined too.
- **Isolate cramped pockets.** When several small cages are packed together, fully enumerate the handful of consistent local arrangements for that pocket alone; the touching rule usually collapses it to one answer, which then frees up the rest of the board.
- **Use large cages as scaffolding.** A 4- or 5-cell cage guarantees several distinct digits packed close together; once even two of its cells are fixed, the touching rule alone often forces most of its neighbours before you've solved the cage itself.

## Traps & common mistakes

- **Forgetting the diagonals.** It's easy to fall back on Sudoku habits and check only up/down/left/right — Suguru's touching rule always includes all four diagonal neighbours too.
- **Over-eliminating across the board.** A digit used far away in an unrelated cage doesn't affect a cell unless they actually touch — don't cross off a candidate just because you've "already used that digit" somewhere distant.
- **Exceeding a cage's size.** A 3-cell cage can only ever contain 1, 2, and 3 — don't guess a 4 or 5 into it, even though the shared number pad on screen goes higher for bigger cages elsewhere.
- **Misreading irregular shapes.** Cages aren't rectangles — always follow the drawn borders on the grid rather than assuming a block shape from a cage's cell count.
- **Stopping the exclusion sweep too early.** After a placement, it's tempting to only recheck the cell's own cage; the diagonal reach means you need to check every touching cell too, even ones in a completely different cage.

## A worked example

```
[A=1][B]
 [C] [D]
```

Cage α = {A, B}, a 2-cell cage using only {1, 2}. A is already
given as 1, so B is forced to 2 immediately. Cage β = {C, D} is
also a 2-cell cage using {1, 2} — but C touches B diagonally, and
B holds 2, so C can never be 2. With only {1, 2} available to β
and 2 excluded from C, C is forced to 1, which in turn forces D
to 2.

Notice how the deduction crossed a cage boundary entirely: nothing
inside cage β on its own told you C had to be 1 — only the touching
rule reaching in from cage α did. That cross-cage reach is the habit
worth building early.

## Glossary

- **Cage / region** — a fixed, irregular group of connected cells that must use its own digits 1…size exactly once.
- **8-neighbour / touching** — any of the 8 cells surrounding a given cell, including all four diagonals.
- **Naked single** — a cell with only one legal digit left after cage and touching exclusions.
- **Region size** — the digit ceiling for a cage; a 4-cell cage only ever uses 1–4.
- **Cross-cage exclusion** — a candidate eliminated because of a touching neighbour in a *different* cage, not the cell's own.
- **Scaffolding cage** — a larger cage whose partially-fixed digits, combined with the touching rule, quickly narrow its neighbours before the cage itself is fully solved.

## Where to go next

Like the "no repeats within a group" backbone? **Sudoku** is the same idea over fixed rows, columns, and boxes instead of irregular cages, **KenKen** keeps the free-form cages but adds arithmetic targets, and **Star Battle** carries Suguru's diagonal touching-exclusion over into a placement puzzle instead of a filling one.

If the diagonal-exclusion habit is what clicked for you, Star Battle is
the most direct next step — it drops the digits entirely and asks you to
apply the very same non-touching instinct to where you place a star.

Kakuro sits a little further afield but scratches a related itch: instead
of touching-exclusion, its distinctness rule runs the length of an entire
crossword-style run.
