# Mosaic

> A hidden picture in black and white — every clue counts the shaded cells around it, and every clue overlaps its neighbours.

**At a glance** · Solo · one 7×7 picture · 10–20 min · Play it under **Logic** (`/logic`).

## What it is

Mosaic (known elsewhere as Fill-a-Pix) is a shading puzzle that hides a picture behind a grid of numbers. Every single cell — not just some of them, as in the picture-puzzle's classic form — carries a clue: the number of shaded cells inside its own 3×3 neighbourhood, itself included. There's no drawing skill involved and no guessing at what the picture "should" look like; the numbers alone pin down, cell by cell, exactly which squares are shaded.

Because the underlying picture is generated as pure random noise rather than deliberate art, don't expect a recognisable shape to emerge as you solve — the reward here is watching the logic click into place, not the reveal of a picture. Like the rest of the Logic Lab, ChessRetabled generates a fresh 7×7 puzzle from a random seed and only accepts it once the resulting clue set has one, and only one, valid shading.

## Goal

Shade cells so that **every clue equals the number of shaded cells in the 3×3 block centred on it** (fewer cells at the edges and corners, where the block is clipped by the grid boundary).

## The grid & clues

The board is a fixed 7×7 grid of 49 cells, and every cell shows a number. For an interior cell that number can be 0–9 (its full 3×3 block); an edge cell's block is clipped to 2×3 or 3×2 (max 6); a corner cell's block is clipped to 2×2 (max 4).

There's no separate "picture area" versus "clue area" — the numbers you're solving with are printed directly on the cells you shade, and stay visible underneath the shading itself. Because every one of the 49 cells is both a clue and a shadable square, every clue you satisfy is simultaneously feeding information into up to eight neighbouring clues, which is what makes the deductions cascade so quickly once a region starts to resolve.

## Rules

1. Each cell is either **shaded** or **unshaded**.
2. Each cell's printed clue equals the count of shaded cells in the 3×3 neighbourhood centred on that cell, **including the cell itself**.
3. The neighbourhood is the full 3×3 block — diagonal neighbours count exactly the same as orthogonal ones, unlike puzzles such as Lights Out that only look up/down/left/right.
4. Neighbourhoods that fall off the edge of the grid are simply smaller — a corner clue can only ever range 0–4, an edge clue 0–6.
5. Shaded cells have **no connectivity requirement** — unlike Nurikabe's sea or Hitori's surviving digits, a Mosaic solution can (and often does) scatter isolated shaded cells anywhere the clues demand.
6. There's no cap on how many cells total end up shaded — the picture can be mostly dark, mostly light, or anywhere in between.
7. A finished grid must satisfy every clue simultaneously; the generator guarantees exactly one shading does.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Mosaic — there's no difficulty selector; every puzzle is a fresh 7×7 random picture, re-rolled internally until a uniqueness check confirms its clue set has exactly one valid shading.
- **Shading.** Click a cell to toggle it between shaded and unshaded. A cell whose neighbourhood is currently **over-shaded** (more shaded cells nearby than its clue allows) is flagged right away in red; under-shaded cells aren't flagged, since a clue can still be reached by shading more cells later.
- **The 💡 hint.** The generated puzzle stores its full solution, so a hint never re-solves live. Press **Hint** for a nudge — the first cell whose current shading disagrees with the solution lights up; press again to reveal, which sets that one cell correctly. Using it marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** Matching every clue exactly logs the solve to your archive.

## Strategy

### Beginner — the extremes
- **Zero clues are free.** A 0 means every cell in its block — including cells shared with neighbouring clues — must stay unshaded. Clear them all immediately.
- **Max clues are free too.** A clue at its neighbourhood's ceiling (4 in a corner, 6 on an edge, 9 inside) forces every cell in that block shaded.
- **Start in the corners.** A corner clue only governs 4 cells, so it converges to a forced answer fastest — solve corners and edges before wrestling with 9-cell interior blocks.
- **A clue of 1 next to a 0 is nearly solved.** If a 1-clue's block almost entirely overlaps a solved 0-block, only the non-overlapping cells remain candidates for that single shaded square.
- **Work outward from any solved cluster.** A pocket of fully-determined cells shrinks the unknowns in every clue that touches it, so keep circling back to the border of what you've already solved rather than jumping to a fresh, untouched region.
- **Scan for near-extremes too.** A clue one away from its ceiling (an 8 in an interior block, say) is nearly as informative as a 9 — only one cell in the block is left undecided.
- **Don't skip the first pass.** Before doing any subtraction, do one full sweep of the grid marking every 0 and every maxed-out clue — this alone often solves a third of the board.

### Intermediate — overlap subtraction
- **Compare adjacent clues.** Two clues one cell apart share most of their 3×3 blocks — the only cells that differ are a strip on the far side of each. If you can work out the shading of the *shared* region from other constraints, the difference between the two clue values tells you the state of the non-overlapping strip.
- **Diagonal overlaps work too, just smaller.** Two clues one cell apart diagonally still share a 2×2 corner — a narrower overlap than a straight row/column comparison, but useful once the easy overlaps are exhausted.
- **Use the edges to shrink the problem.** Edge and corner clues have fewer unknowns than interior ones — solve the border first, and its solved cells reduce candidate counts for every interior block that overlaps it.
- **Recheck after every forced cell.** A single newly-shaded (or cleared) cell can push several nearby clues from "ambiguous" to "forced" as it changes their live over- or under-shaded count.
- **Pair up clues that share exactly two cells.** A pair of clues with only a small, well-defined overlap is easier to reason about precisely than a pair sharing most of their blocks.
- **Track candidates, not just certainties.** For a stubborn cell, jot down which clues still call it "maybe shaded" — once every clue touching it agrees, it's forced even if no single overlap proved it alone.

### Advanced — propagation and contradiction
- **Chain the overlaps.** Once you can express one clue's unresolved strip in terms of another's, walk that reasoning across the whole grid the way Nonogram solvers chain run positions — a long line of overlapping 3×3s often unravels from a single solved corner.
- **Read the local density.** Clusters of high clues signal a solid shaded patch nearby; an unexpectedly low clue sitting inside a high-density neighbourhood is worth double-checking first, since it's usually the cell that unlocks the rest of that patch.
- **Count globally.** If most of the board is solved but a small pocket resists, sum what's already fixed against the remaining clues touching that pocket; the arithmetic frequently leaves only one legal combination.
- **Look for isolated pockets last.** A small unresolved region surrounded on all sides by solved cells is the easiest place to finish, since every clue bordering it is already fully informative.
- **Fall back to contradiction sparingly.** If a cell still has two options after full propagation, try shading it and push the consequences forward; if any clue overflows, the other option was correct. The generator's uniqueness guarantee means this always terminates cleanly — it just isn't the first tool to reach for.
- **Prefer the most-constrained cell for a trial.** When you do need to guess, pick the cell whose neighbouring clues are closest to their limits — a wrong guess there fails fastest, wasting the least effort before you backtrack.

## Traps & common mistakes

- **Forgetting a clue counts itself.** The "neighbourhood" includes the clue's own cell, not just the ring around it.
- **Misjudging boundary blocks.** It's easy to treat every clue as a full 3×3 out of habit; edge and corner clues simply have fewer cells to work with, and using the wrong ceiling produces impossible deductions.
- **Trusting the red flag too much.** Over-shading is flagged, but an unfinished, under-shaded board shows no warnings at all — absence of red isn't proof you're on track.
- **Assuming shaded cells must connect.** There's no rule here forcing the shading into one blob, so don't discard an otherwise-valid deduction just because it leaves an isolated shaded square.
- **Losing track after several toggles.** Re-scan a clue's whole neighbourhood after each nearby change rather than assuming your running count is still accurate.
- **Ignoring diagonal cells.** It's easy to mentally treat the neighbourhood as a plus shape out of habit from other puzzles — Mosaic's 3×3 always includes the four diagonal corners too.
- **Chasing an unsolvable clue in isolation.** A clue that looks ambiguous alone is often trivial once you bring in just one neighbouring clue's information — don't stare at a single number for too long before widening your view.

## A worked example

A forced corner, then a knock-on edge deduction:

```
Top-left corner clue is 1, and its block is only
the 2x2 { (0,0) (0,1) (1,0) (1,1) }. Suppose you've
already cleared (0,1) and (1,1) from other clues:

 1 . | ...     Only (0,0) and (1,0) remain unknown,
 . X | ...     and exactly one of the block's 4 cells
 ----+---      must be shaded -- so if (1,0) is forced
               unshaded elsewhere, (0,0)=X is the one.
```

The same subtraction — "the clue minus what's already known" — is the engine behind every harder deduction in the puzzle, all the way up to the interior 3×3 blocks.

## Glossary

- **Clue** — the number printed on a cell; the target count for its own 3×3 neighbourhood.
- **Neighbourhood** — the (up to) 3×3 block of cells a clue counts, clipped at the grid edge.
- **Shaded / unshaded** — a cell's two possible states; shading is what you're solving for.
- **Overlap** — the cells two neighbouring clues' blocks have in common, the basis of most deductions.
- **Density** — how tightly packed the shaded cells are in a region, a rough guide for where to look next when direct overlaps run out.
- **Forced cell** — a cell whose state is fully determined by the clues touching it, with no remaining ambiguity.
- **Most-constrained cell** — an unresolved cell whose neighbouring clues are closest to their shading limits, the best candidate for a trial guess.

## Where to go next

If you enjoy reading a hidden picture out of pure counting, try **Nonogram** (the same idea via row/column run-lengths instead of local neighbourhoods) and **Kakurasu** (shading pinned down by weighted sums rather than local counts). **Hitori** offers a different flavour of shading logic, built on eliminating duplicates instead of matching counts.
