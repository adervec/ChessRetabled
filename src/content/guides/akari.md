# Akari

> Light every corner of the room with as few bulbs as the walls will allow — and never let two bulbs see each other.

**At a glance** · Solo · one puzzle, one answer · 10–20 min · Play it under **Logic** (`/logic`).

## What it is

Akari (also known as Light Up) is a placement puzzle about illumination. You're dropping light bulbs onto a grid so every open cell is lit, while a scattering of numbered walls tell you exactly how many bulbs must sit next to them. It plays like a cross between Minesweeper's numbered counting and Sudoku's "no two the same" instinct, except the constraint here is about *sight lines* — a bulb lights its entire row and column until something blocks it.

The tension that makes Akari interesting is that lighting the board and satisfying the numbers pull in opposite directions: it's trivial to light every cell if you don't care how many bulbs you use, and trivial to satisfy the numbers if you don't care whether the rest of the board goes dark. The puzzle only has one answer because those two goals, combined with the "no bulb sees another" rule, leave exactly one bulb layout standing. Like every Logic Lab puzzle, a well-formed Akari board has exactly one correct bulb layout, reachable by pure elimination.

## Goal

Place light bulbs on white cells so that **every white cell is lit**, **no bulb illuminates another bulb**, and **every numbered wall has exactly that many bulbs in the cells orthogonally next to it**. Every one of those three conditions has to hold at once — a board that's fully lit but has two bulbs staring at each other is just as wrong as one with a wall miscounted.

## The grid & clues

The board is a fixed **7×7** grid. Cells come in three flavours: **white cells** (open, need to be lit, may hold a bulb), **blank walls** (black cells that block light but carry no count), and **numbered walls** (black cells showing 0–4, counting how many bulbs must sit in their up/down/left/right neighbours). A bulb's light travels outward along its row and column as an unbroken **run**, stopping the instant it hits any wall or the edge of the board. There's no difficulty selector — every fresh puzzle scatters walls at roughly the same density, so the challenge comes entirely from how the numbered clues happen to interlock.

Because walls are sprinkled in at random rather than laid out by hand, a
board can end up with wide-open stretches of white cells in one corner
and a dense thicket of numbered walls in another — read the whole grid
before committing to a cell, since the easiest deductions might be on
the opposite side from where you started looking.

## Rules

The whole puzzle balances on two ideas working together: light has to reach everywhere, and bulbs are picky about who else can see them.

1. Bulbs may only be placed on **white cells**.
2. A bulb lights every white cell in its row and column **until blocked** by a wall (numbered or blank) or the grid edge.
3. **Every white cell must be lit** by at least one bulb's run.
4. **No two bulbs may see each other** — if two bulbs share an unblocked run in either direction, that's illegal, even if every cell involved is otherwise correctly lit.
5. A **numbered wall** (0–4) must have exactly that many bulbs among its orthogonal neighbours — diagonal neighbours never count toward a wall's number.
6. **Blank walls** only block light; they carry no bulb-count requirement.

Notice that rules 3 and 4 pull against each other on purpose: rule 3 wants
more bulbs (everything lit), rule 4 wants fewer (nobody sees anybody).
Every well-formed board balances those two forces at exactly one point.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Akari. The generator first scatters walls across the 7×7 grid at random, solves a light-only pass (ignoring numbers) to get *some* valid bulb layout, then labels every wall with the actual bulb count that layout produced next to it. From there it blanks clues back out one at a time — only while a uniqueness check confirms exactly one solution remains — so every number you see is load-bearing.
- **Filling cells.** Click any white cell to toggle a bulb on or off. Lit cells glow, and a bulb that sees another bulb is flagged red immediately.
- **The 💡 hint.** Since every generated puzzle stores its full solution, a hint never has to re-solve. Press **Hint** for a *nudge* — the first white cell whose bulb state disagrees with the answer lights up; press again to *reveal* by toggling it correctly. Using a hint marks the puzzle **assisted**.
- **Completion.** A fully lit board with every clue satisfied logs the solve to your archive.
- **Starting over.** **New puzzle** throws away the current layout and its hint state in favour of a freshly generated 7×7 board.

## Strategy

Every deduction in Akari comes down to two questions asked over and over: "does this cell still need light?" and "does this wall still need bulbs?" Answering both consistently, cell by cell, is what carries you to the unique solution.

### Beginner — read the extremes
- **A "0" forbids its neighbours.** A numbered wall showing 0 means none of its orthogonal white neighbours may ever hold a bulb — cross them all off immediately.
- **A fully-surrounded number is a lock.** If a wall's number exactly equals the count of white cells around it, every one of those cells must hold a bulb — there's no room for anything else.
- **Short runs are easy wins.** A white cell in a run only one cell long (boxed in by walls on both sides in that direction) can only ever be lit from the *other* direction, or must itself carry the bulb — trace these first.
- **Isolated single cells self-select.** A white cell entirely surrounded by walls, with no other white cell in either its row-run or column-run, has no way to be lit except by holding a bulb itself.

### Intermediate — cross-reference walls
- **Kill shared candidates.** If a cell is orthogonally adjacent to two different numbered walls, and one of those walls is already satisfied by bulbs elsewhere, that shared cell can't take a bulb — it would overfill the satisfied wall.
- **Double-duty cells.** A white cell that lies in both an unlit horizontal run and an unlit vertical run is a strong candidate for a bulb — placing one there solves two lighting problems in a single move.
- **Anticipate mutual blinding.** Before placing a bulb, check its entire row and column, not just its immediate neighbours — a bulb two cells away in the same run is just as illegal as one right next door.
- **Use satisfied walls as a boundary.** Once a numbered wall has its full quota of bulbs, treat its remaining orthogonal neighbours as permanently off-limits — that fact stays true for the rest of the solve and is worth marking so you don't reconsider it later.

### Advanced — count and force
- **Cluster accounting.** When several numbered walls share a tight pocket of white candidate cells, add up how many bulbs the walls still need versus how many candidate cells remain; if the two numbers match exactly, every remaining candidate must take a bulb — no exceptions, the same way a Sudoku "naked group" leaves no slack.
- **Forced-pair resolution.** If a wall needs exactly one more bulb from exactly two remaining candidates, and one of those candidates is shared with a wall that's already full, the other candidate is forced.
- **Sweep for stragglers.** After placing every forced bulb you can find, re-scan for white cells whose row-run and column-run are *still* both dark — these final unlit cells usually have only one legal placement left once every other constraint has been applied.
- **Contradiction testing on genuinely ambiguous cells.** On the rare cell where no direct rule fires, tentatively place a bulb and follow the consequences a few steps; if it forces two bulbs to see each other or overfills a wall, the opposite choice is correct — this is deduction by elimination, not a guess, since only one branch survives.
- **Track the darkest regions last.** Save the widest open stretches of white cells for the end of your pass — by then most of their candidate cells have already been eliminated by nearby wall clues, so what's left resolves quickly instead of needing to be reasoned about from scratch.

## Traps & common mistakes

- **Counting diagonal neighbours.** Only the four orthogonal cells feed a numbered wall's count — a bulb diagonally next to a "2" does nothing for it.
- **Forgetting walls block mid-run.** Light doesn't only stop at the grid edge; any wall partway along a row or column — numbered or blank — cuts the run right there.
- **Placing a "helpful-looking" bulb that blinds one further away.** Always trace the *entire* run in both directions before committing, not just the adjacent cells.
- **Confusing redundant light with an error.** A cell being lit by two different directions is completely fine; it's two *bulbs* sharing a run that's illegal, not a cell receiving double light.
- **Forgetting a wall's count can already be satisfied.** Once a numbered wall's quota is filled, don't keep treating its other neighbours as open — they're locked out for the rest of the puzzle.

## A worked example

```
. . .
. 3 .
. # .
```

The centre cell is a numbered wall showing **3**. Its orthogonal
neighbours are: up (white), left (white), right (white), and down
(a blank wall, so it doesn't count). That's exactly three white
neighbours available for exactly three required bulbs — there's no
slack, so all three must hold a bulb. No further reasoning needed;
the count alone forces the placement.

That single deduction usually cascades outward: each of those three
newly-placed bulbs now lights its own row and column, which can
immediately satisfy — or rule out — cells several steps away that
looked ambiguous a moment ago. Re-scanning after a forced cluster
like this is often where the next set of dominoes starts to fall.

## Glossary

- **White cell** — an open cell that must be lit and may hold a bulb.
- **Wall** — a black cell; blank walls just block light, numbered walls (0–4) also constrain the bulb count next to them.
- **Run** — the stretch of white cells a bulb's light reaches along one row or column before a wall stops it.
- **Orthogonal neighbour** — the up/down/left/right cell only; diagonals never count for a wall's clue.
- **Lit** — a white cell reached by at least one bulb's run.
- **Satisfied wall** — a numbered wall whose full bulb quota has already been placed among its neighbours.
- **Candidate cell** — a white cell that could still legally hold a bulb given everything placed so far.

## Where to go next

Fond of numbers that count their neighbours? **Mosaic** uses the exact same "number equals nearby shaded count" mechanic over a sliding window instead of fixed walls, **Nurikabe** trades bulbs for connected sea-and-island shading with its own numbered anchors, and **Slitherlink** turns numbered-cell counting into a loop-drawing puzzle.

All three are built on the same instinct Akari trains: treat every number on the board as a hard limit, not a suggestion, and let the cells that violate it fall away on their own.

If you'd rather stay with placement puzzles specifically, **Star Battle**
swaps "light every cell" for "one star per row, column, and region" while
keeping the same flavour of exclusion-driven deduction.
