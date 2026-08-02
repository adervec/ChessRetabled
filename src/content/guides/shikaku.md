# Shikaku

> Every number is the floor plan of its own room — carve the grid into rectangles until each one fits exactly.

**At a glance** · Solo · one puzzle, one answer · 8–18 min · Play it under **Logic** (`/logic`).

## What it is

Shikaku (literally "divide by four/square" in Japanese) is a dissection puzzle: the whole grid must be cut into rectangles, each one containing exactly one numbered clue, and each rectangle's area has to equal that clue exactly. There's no arithmetic to perform beyond multiplication — the real puzzle is geometric, working out which of a number's possible width-by-height shapes actually fits the space left by its neighbours.

That geometric flavour is what sets Shikaku apart from the rest of the Logic Lab's grid-filling puzzles: instead of choosing digits for fixed cells, you're choosing the *shape and extent* of a region, and every clue on the board is quietly negotiating for space with every other clue at the same time. As with every Logic Lab puzzle, a valid Shikaku board has exactly one way to dissect it.

## Goal

Divide the grid into non-overlapping rectangles so that **every rectangle contains exactly one numbered clue**, **each rectangle's area (in cells) equals its clue's number**, and **every cell on the board belongs to exactly one rectangle**. All three conditions must hold everywhere at once — a partial dissection that gets most of the board right but leaves one gap or one overlap is still unsolved.

## The grid & clues

The board is a fixed **6×6** grid. Some cells carry a printed number — the clue that rectangle must satisfy — and the rest start empty, waiting to be claimed. There's no fixed shape to guess at beyond "axis-aligned rectangle made of whole cells": a clue of 6, for instance, could end up as 1×6, 2×3, 3×2, or 6×1, and the surrounding clues are what narrow it down to one. There's no difficulty selector — every fresh puzzle tiles the board with a new random set of rectangles before labelling them, so the challenge comes from how tightly those shapes interlock.

## Rules

1. Partition the entire grid into **axis-aligned rectangles**, each made of whole cells.
2. Every rectangle must contain **exactly one** numbered clue cell.
3. A rectangle's **area** (width × height, in cells) must **equal the number** in the clue it contains.
4. Every cell on the board belongs to **exactly one** rectangle — full coverage, no gaps, and no overlaps.
5. A well-formed puzzle has exactly **one** partition satisfying all of the above.

Rule 4 is easy to state and easy to forget while you're focused on a
single stubborn clue: a dissection can satisfy every individual clue's
area perfectly and still be wrong if two rectangles overlap or a cell
is left completely unclaimed somewhere else on the board.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Shikaku. The generator first tiles the whole 6×6 grid with random rectangles (so a valid solution is guaranteed to exist), labels each one with its area written into a randomly chosen interior cell, and keeps only layouts where that set of numbers reconstructs to exactly one dissection.
- **Filling cells.** Click a numbered cell to arm it as the active **anchor** (clearing its previous rectangle, if any); then click a second cell to set the opposite corner — the app draws the rectangle spanning the two clicks automatically. A rectangle whose cell count doesn't match its clue is flagged; clicking a different number re-arms a new anchor instead of extending the old one.
- **The 💡 hint.** Every generated puzzle stores its full solution, so a hint never re-solves anything. Press **Hint** for a *nudge* — the first clue whose drawn rectangle doesn't match the solution lights up; press again to *reveal* it, drawing the correct rectangle for you. Using a hint marks the puzzle **assisted**.
- **Completion.** Full coverage with no overlaps and every rectangle's area matching its clue logs the solve to your archive.
- **Starting over.** **New puzzle** replaces the whole tiling and its clue numbers, not just your drawn rectangles.

## Strategy

Every Shikaku deduction eventually comes down to one question: given
this clue's number, this clue's position, and the space its neighbours
haven't already claimed, which shapes are still even physically possible?

### Beginner — start with the extremes
- **Ones are free.** A clue of **1** is trivially its own 1×1 rectangle — claim it immediately and move on.
- **Prime numbers force a line.** A clue that's a prime number (2, 3, 5, 7, 11, 13…) can only form a straight **1×N or N×1** rectangle — there's no other factor pair, so the "squarish" shape is never an option.
- **Edges and corners narrow fast.** A clue sitting near the border of the grid has fewer legal rectangle placements, since none of them can extend past the edge — resolve those first.
- **Large clues relative to the board are nearly forced.** On a 6×6 grid, a clue like 12 has very few width/height combinations that both fit on the board and stay within range of the clue cell itself — check big numbers early too, not just small ones.

### Intermediate — use your neighbours
- **No rectangle may swallow a second clue.** If a candidate shape for one clue would have to cover another numbered cell, that candidate is illegal outright — cross it off without further thought.
- **Claim the orphaned cells.** If a particular empty cell can only be reached by one clue's remaining candidate shapes (every other nearby clue simply can't stretch that far), that cell belongs to that clue — even before its final shape is fully pinned down.
- **Enumerate factor pairs, then prune.** List every width/height pair whose product matches a clue's number and that fits on the board without hitting a wall or another clue; as neighbouring rectangles lock in, cross off factor pairs whose space just got claimed.
- **Resolve the most constrained clue first.** Between two unresolved clues, tackle whichever one currently has fewer legal candidate shapes — solving it usually removes options from its neighbour too, narrowing the harder clue for free.

### Advanced — account and squeeze
- **The area-sum check.** Every clue's number, summed across the whole board, must equal the total cell count (36 on this grid). If your partial solution's claimed cells plus the areas still owed by unplaced clues don't add up to the true remainder, there's an error somewhere upstream — a fast global sanity check.
- **Squeeze narrow gaps.** When two clues face off across a thin unclaimed strip, that strip's width caps how far either rectangle can reach into it — solve whichever side is more tightly constrained first, and its boundary fixes the other automatically.
- **Commit partial shapes.** A cell reachable by only one remaining clue, once its neighbours have claimed the surrounding space, can be assigned to that clue immediately — even if the clue's full final rectangle isn't settled yet, this partial commitment narrows what shape it can still take.
- **Work the perimeter inward.** Clues along the grid's outer edge have the fewest degrees of freedom of anyone on the board; resolving the full border first often leaves the interior clues with only one workable shape apiece.

## Traps & common mistakes

- **Defaulting to square-ish shapes.** It's tempting to make every rectangle as close to a square as possible; instead let the clue's factor pairs and the surrounding clues dictate the real shape — a 6 might have to end up 1×6, not 2×3, depending on what's around it.
- **Leaving gaps or letting rectangles overlap.** Every single cell must belong to exactly one rectangle — a layout whose areas happen to sum correctly but still leaves an uncovered cell somewhere is still wrong.
- **Drawing a rectangle over a second clue.** Always check the interior of a large candidate rectangle for a stray number before locking it in — a rectangle may contain only its own clue.
- **Re-arming by accident.** Clicking a second numbered cell while trying to set a rectangle's far corner arms *that* number as the new anchor instead of extending the first — always click an empty cell for the opposite corner, never another clue.
- **Forgetting a clue's own cell counts toward its area.** A rectangle's cell count includes the clue cell itself — a clue of 4 needs three *more* cells besides its own, not four more.

## A worked example

```
3 . .
. 2 .
. . .
```

The clue **3** at the top-left is prime, so its rectangle must be
a straight line: either the full 1×3 across row 0, or a 3×1 down
column 0. The clue **2** sits at row 1 — if "3" took the vertical
3×1 shape down column 0, it would swallow the cell at (1, 0),
leaving "2" nothing to claim there. So "3" is forced into the
horizontal 1×3 shape across the top row instead.

With "3" settled along the top row, "2" now has to build downward
or sideways from row 1 without crossing into row 0 at all — a
constraint that didn't exist until the neighbouring clue's shape
was pinned down, which is exactly the kind of chain reaction
Shikaku runs on.

## Glossary

- **Clue** — a numbered cell; the sole clue its rectangle must contain.
- **Rectangle / partition** — an axis-aligned block of whole cells; every cell on the board belongs to exactly one.
- **Area** — width × height in cells; must equal the rectangle's clue number.
- **Factor pair** — a (width, height) combination whose product equals a clue's number; enumerates that clue's possible shapes.
- **Orphaned cell** — an empty cell reachable by only one remaining clue's candidate shapes.

## Where to go next

Like carving a grid into meaningful pieces? **Nurikabe** partitions the board into numbered islands against a connected sea, **Star Battle** works with fixed irregular regions instead of ones you draw yourself, and **Suguru** applies its own per-region rules over similarly hand-shaped cages.

Nurikabe is the closest cousin of the three — it shares Shikaku's habit
of using a clue's own number as a hard constraint on the shape of the
territory around it, just traded for islands instead of rectangles.
