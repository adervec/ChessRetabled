# Nurikabe

> Sink everything except the numbered islands — and make sure the sea never pools where it shouldn't.

**At a glance** · Solo · one puzzle, one answer · 10–20 min · Play it under **Logic** (`/logic`).

## What it is

Nurikabe is a shading puzzle named after a Japanese folklore wall-spirit. You're given a scatter of numbered clues on an otherwise empty grid, and you shade the rest of the cells to form a single connected "sea," leaving behind exactly the right islands of unshaded cells. The elegance of Nurikabe is that its rules are almost entirely about *connectivity* — how many cells touch how many other cells — rather than arithmetic, so every deduction comes from tracing what can and can't stay linked, and from noticing which cells are "trapped" between competing claims.

## Goal

Shade cells so that **every numbered clue becomes the sole member of its own island**, that island containing exactly as many cells as its number says, while the shaded cells form **one connected sea** with **no 2×2 all-shaded block** anywhere on the board.

## The grid & clues

The board is a 6×6 grid, the fixed size used throughout ChessRetabled, regenerated fresh every game. A handful of cells carry a number (the clue); every other cell starts blank and is yours to shade or leave as island. Generation grows non-touching islands of the right sizes first, breaks up any accidental 2×2 sea pools by converting a pool cell into land, and only accepts the layout once a solver confirms the resulting clue set has exactly one valid solution.

## Rules

1. Shade cells to form the **sea**; leave the rest **unshaded** (island cells).
2. Every numbered clue cell must end up unshaded, and it is the seed of an island containing **exactly** that many cells, connected orthogonally.
3. Each island contains **exactly one** clue — never zero, never two.
4. Two different islands may never touch **orthogonally** (diagonal contact between islands is fine and, in fact, common).
5. The sea (all shaded cells) must be **one single connected region** — no shaded cell may be cut off from the rest.
6. No **2×2 block of four cells** may be entirely sea, anywhere on the board.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Nurikabe. Each board is a fresh 6×6 grid: islands are grown one at a time so they never touch each other and the leftover sea always stays connected as it shrinks, and any 2×2 sea pool that appears is broken by converting one of its cells to land — all while keeping the layout uniquely solvable.
- **Shading cells.** Click any non-clue cell to toggle it between unshaded (island) and shaded (sea); clue cells themselves are locked and can't be shaded.
- **The 💡 hint.** Every generated puzzle stores its full solution shading, so a hint never has to re-solve anything. Press **Hint** for a *nudge* — one wrongly-shaded cell is highlighted; press again to *reveal*, setting that cell to its correct sea/island state. Using a hint marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** The moment your shading legally partitions the board into a connected sea and correctly-sized islands (one clue each, no 2×2 pools, no island-to-island contact), the solve is detected and logged to your archive.

## Strategy

### Beginner — the local rules first
- **A "1" clue is already a finished island.** All four of its neighbours must be sea immediately — shade them right away and move on.
- **Cells between two clues are usually sea.** If a cell is orthogonally adjacent to two *different* clues (or to a clue and any other island cell it can't belong to), it can't join either island without violating "islands don't touch," so it must be sea.
- **Diagonal-adjacent clues are fine, orthogonal ones can't share territory.** Use that distinction to immediately shade any cell that sits directly between two clues in a straight orthogonal line.
- **Watch for a forming 2×2 sea block.** Any time three cells of a 2×2 square are already shaded, the fourth must be island, no matter what else is going on — this rule alone resolves a lot of the board as the sea fills in.
- **Corners and edges limit island growth.** An island seeded near a corner has fewer directions available to grow into, which often forces its shape well before an island in open space would be forced.

### Intermediate — growing islands correctly
- **An island's shape is only as free as its surroundings allow.** A "3" clue boxed in on two sides by known sea can only grow in the remaining direction(s); trace out every legal-shaped triomino it could still become and see if they all agree on a cell.
- **Count remaining unshaded cells versus remaining island capacity.** If the total of all clue numbers already accounts for most of the free cells, the rest must be sea — this "budget" check narrows things fast on a mostly-solved board.
- **Isolated pockets of unshaded cells must belong to exactly one clue.** If a group of blank cells is cut off from every clue by known sea, it can never become a valid island (no clue to seed it), so it has to be sea itself — a useful contradiction check when you think you're stuck.
- **Distance caps an island's reach.** A clue's island can never extend further than (size − 1) orthogonal steps from the clue cell in any single direction; any cell beyond that reach, once other constraints narrow the shape, safely shades to sea.
- **Two same-sized clues equidistant from a contested cell rarely both want it.** Check whether one of the two islands has an alternative path to its target size that doesn't need the contested cell — if so, the other island is forced to take it.

### Advanced — proving connectivity and uniqueness
- **Simulate the sea's connectivity as you shade.** Before committing a cell to sea, check whether doing so would strand another sea region from the main body — if a cell is the *only* path connecting two shaded areas, it cannot become island no matter what local island-growth logic suggests.
- **Use elimination between competing islands.** When two clues could each plausibly claim the same contested cell, look for a parity or count argument that rules one of them out — often only one of the two islands has any other way to reach its required size, forcing the contested cell to the other.
- **Treat unreachable regions as sea automatically.** Any blank cell that no clue's remaining size budget can possibly reach (accounting for cells already assigned elsewhere) is provably sea, even without a direct adjacency argument.
- **Trust the puzzle's uniqueness.** If you've found two seemingly valid shadings that both look locally legal, one of them secretly violates sea connectivity or the 2×2 rule somewhere you haven't checked yet — recheck those two global constraints before assuming you found a second solution.

## Traps & common mistakes

- **Forgetting to check the 2×2 rule until the very end.** It's easy to build a sea that satisfies every island but quietly contains a shaded 2×2 block; check for it continuously, not just at the end.
- **Letting two islands touch diagonally and assuming that's illegal.** Diagonal contact between islands is explicitly fine — only orthogonal (sharing an edge) contact is forbidden.
- **Shading a cell that disconnects the sea.** Always sanity-check that the sea stays one piece after every shading decision, especially near the board edges where the sea has fewer routes around.
- **Growing an island past its clued size.** Once an island has reached its target cell count, every other neighbouring blank cell must become sea, even if it "looks like" it could extend the island further.
- **Assuming a large clue must sprawl in every direction evenly.** Islands can be any connected shape, including long thin snakes — don't rule out a shape just because it looks unbalanced.

## A worked example

A "1" clue with a "2" clue diagonally nearby:

```
 . . . .
 . 1 . .      The "1" clue is already a complete island —
 . . 2 . .    shade all four of its orthogonal neighbours.
 . . . .      One of those neighbours is also orthogonally
              adjacent to the "2" clue, so that shared cell
              is sea from both sides' logic at once.
```

The "1" resolves instantly, and its forced sea cells immediately start constraining its neighbour's shape too — a small chain reaction typical of how Nurikabe boards unravel.

## Glossary

- **Sea** — the connected region of shaded cells.
- **Island** — a connected group of unshaded cells containing exactly one clue, sized to match it.
- **2×2 pool** — four adjacent shaded cells forming a square; always illegal.
- **Orthogonal adjacency** — sharing a full edge (not just a corner) with another cell.

## Where to go next

If tracing connected regions under strict rules appealed to you, **Bridges** turns the same "everything must connect" idea into a network of islands linked by bridges, and **Slitherlink** asks you to draw a single boundary loop instead of shading a region.
