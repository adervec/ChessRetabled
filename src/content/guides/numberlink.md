# Numberlink

> Every pair of numbers wants a path between them — and together, those paths have to cover the entire board with no gaps and no overlaps.

**At a glance** · Solo · one puzzle, one answer · 10–15 min · Play it under **Logic** (`/logic`).

## What it is

Numberlink is a path-connection puzzle: a handful of matching number pairs sit scattered on the grid, and your job is to draw a path between each pair using only orthogonal steps. What sets ChessRetabled's version apart from the loosest form of the puzzle is that it's played in the stricter "flow" style — every single cell on the board must end up part of exactly one path, so the puzzle isn't just "connect the dots," it's "connect the dots so the paths jointly tile the whole grid." That extra constraint is what makes the solution unique instead of merely one of many valid routings.

## Goal

Connect each pair of matching numbers with a single path of orthogonally adjacent cells so that **no two paths cross or share a cell**, and **every cell on the board belongs to exactly one path** by the time you finish.

## The grid & clues

The board is a 5×5 grid, the fixed size used throughout ChessRetabled, freshly regenerated each game with **3 to 5 colour pairs** placed on it (the exact count varies puzzle to puzzle). Each colour appears in exactly two cells — its two endpoints — and every other cell starts empty, waiting to be claimed by whichever path threads through it. Generation lays a single Hamiltonian path across the entire grid first (a route that visits every cell exactly once) and then cuts that path into 3–5 coloured segments, so a full-board-filling solution is always guaranteed to exist before any puzzle is offered; the layout is kept only once a solver confirms that solution is unique.

## Rules

1. Draw one continuous path of orthogonally adjacent cells connecting each matching pair of numbers.
2. Paths may **not cross or overlap** — every cell belongs to exactly one path.
3. **Every cell on the board must be filled** by some path; empty leftover cells mean the board isn't finished, even if every pair looks connected.
4. A path's two ends must be exactly the two cells sharing its number — nothing else counts as a valid endpoint.
5. A path may bend as many times as it likes, but each step must move to an orthogonally adjacent cell (no diagonal jumps).

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Numberlink. Each board is a fresh 5×5 grid: a Hamiltonian path is generated across the whole board first, then sliced into 3–5 coloured segments (each at least 2 cells long) whose endpoints become the number pairs — kept only once a solver confirms that exact segmentation is the unique legal solution.
- **Drawing a path.** Tap a numbered endpoint to make its colour active, then tap through adjacent empty (or same-colour) cells to extend the path one step at a time; tapping back onto an earlier cell in the same path trims it back to that point, which is the easiest way to undo a wrong turn. Tapping a different colour's endpoint switches which path is currently active.
- **Cell ownership.** A cell already claimed by one colour's path can't be entered by another colour's path — the interaction simply won't let the step happen, so you can't accidentally create an overlap.
- **The 💡 hint.** Every generated puzzle stores its full solution path for every colour, so a hint never has to re-solve anything. Press **Hint** for a *nudge* — the endpoints of one incorrectly-drawn colour are highlighted; press again to *reveal*, drawing that colour's entire correct path (trimming back any other path that had claimed one of its cells). Using a hint marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** The moment every colour's path runs endpoint-to-endpoint with no overlaps and every cell on the board is filled, the win is detected and logged to your archive automatically.

## Strategy

### Beginner — obvious forced cells
- **A corner cell that isn't an endpoint has only two possible neighbours.** Whichever path eventually fills that corner has to enter and leave through those same two cells — useful for predicting how a path must bend near the edges.
- **An endpoint tucked into a corner has only one legal first step.** With just two neighbours available and one of the constraints being "don't dead-end the rest of the board," corner endpoints are often the easiest place to start drawing.
- **Because every cell must be filled, an empty cell surrounded by only one live colour's path is that colour's territory.** If just one path is close enough to reach an isolated empty cell without crossing another path, that cell belongs to it.
- **Start with the colour that has the fewest plausible routes.** A pair of endpoints close together with limited detour room usually has only one or two sensible paths between them; resolve those first to free up space for the more flexible colours.
- **Remember every non-endpoint cell needs exactly two path-neighbours once filled.** This "degree two" rule (endpoints only need one) is the single biggest constraint-checker as you fill in the grid.

### Intermediate — filling the whole board, not just connecting pairs
- **Treat leftover empty regions as a capacity problem.** After sketching a few paths, look at any pocket of empty cells still unclaimed — figure out which colour(s) can actually reach it without crossing existing paths, since an unreachable pocket means an earlier path took a wrong turn.
- **A path that takes a shortcut can accidentally strand cells behind it.** Even if a direct route between two endpoints looks tempting, check whether it leaves an unreachable island of empty cells with no path able to reach them — the correct route often has to detour specifically to sweep those cells up.
- **Use parity on cell count.** Since every cell must be filled, count how many empty cells remain in a region versus how many path-ends still need to pass through it — if the numbers don't match up, some currently-drawn segment needs revising.
- **Two colours boxed into the same limited region must split the space cleanly.** If two different pairs' remaining routes all funnel through the same tight area, work out the one way to divide that area between them without a crossing.
- **Backtrack early rather than late.** Because paths can only be trimmed from their growing end, it's much cheaper to undo a recent wrong step than to discover three moves later that an earlier turn boxed in another colour.

### Advanced — full-board reasoning
- **Think in terms of the underlying Hamiltonian structure.** Every ChessRetabled Numberlink board is secretly one single path through all 25 cells, cut into coloured pieces — so once most colours are drawn, the remaining cells almost always have just one legal way to link the unfinished colour through them, since any other routing would leave a gap the puzzle's construction guarantees can't exist.
- **Use "no dead space" as a constant check, not a final one.** After every few moves, scan for any group of empty cells that no remaining colour's path could actually reach without crossing something already drawn — catching this immediately is far more efficient than backtracking after filling most of the board.
- **When a colour has multiple plausible routes, let the other colours decide it.** Rather than committing early to one of several valid-looking paths for an ambiguous colour, work on more constrained colours first; their finished paths often eliminate all but one option for the ambiguous one.
- **Verify degree constraints as a final consistency check.** Every filled non-endpoint cell should touch exactly two same-colour path-cells; if you find one touching only one (a dead end) or three (an accidental branch), that's exactly where the routing went wrong.

## Traps & common mistakes

- **Connecting a pair with a "valid-looking" path that leaves cells unreachable.** The single biggest Numberlink mistake: a path is only correct if it's part of a whole-board tiling, not just because it links its own two numbers.
- **Forgetting a path can also travel through cells of its own colour.** You can loop back near an earlier part of the same path (as long as you don't reuse a cell) — the interaction allows tapping through same-colour territory when extending.
- **Taking the shortest route by default.** The correct path is often longer than the direct line between two numbers, specifically because it has to sweep up cells no other colour can reach.
- **Not noticing a stranded single empty cell.** A lone empty cell with no adjacent path able to reach it is easy to miss visually on a busy board — always do a final scan for gaps before assuming you're close to done.
- **Mixing up which endpoint belongs to which colour on a crowded board.** With up to 5 colours active, double-check you're extending the path you intend to, especially right after tapping a fresh endpoint.

## A worked example

A corner cell forcing part of a path's shape:

```
 1 . . . .
 . . . . .     Cell (0,0) holds endpoint "1". Since it's
 . . . . .     a corner, it only has two neighbours: the
 . . . . .     cell to its right and the cell below it.
 . . . . 2     Whichever one the "1" path uses first, the
              OTHER neighbour must be filled by some other
              colour's path — it can never stay empty.
```

That single observation about corner degree is often the seed that tells you which colour has to sweep through a given side of the board.

## Glossary

- **Endpoint** — one of the two cells sharing a colour's number; where its path must start and end.
- **Path** — the ordered chain of orthogonally adjacent cells connecting one colour's two endpoints.
- **Flow-fill rule** — the requirement that every cell on the board, not just the endpoints, belongs to some path.
- **Hamiltonian path** — a route that visits every cell of the grid exactly once; the hidden structure every generated board is built from.

## Where to go next

Enjoyed routing non-crossing paths across a full grid? **Masyu** and **Slitherlink** both ask for a single loop rather than several paths, while **Bridges** keeps the "connect distinct endpoints without crossing" spirit but swaps continuous paths for discrete bridge-counts.
