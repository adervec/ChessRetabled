# Tents

> Every tree needs exactly one tent beside it — and no two campers may pitch within arm's reach of each other.

**At a glance** · Solo · one puzzle, one answer · 10–15 min · Play it under **Logic** (`/logic`).

## What it is

Tents (Tents and Trees) is a placement puzzle that pairs a matching problem with a counting problem. You're given a scatter of trees on the grid, and you need to place exactly one tent next to each tree — but the placement also has to satisfy row and column totals, the way a nonogram or a Latin square does, and no two tents may sit anywhere near each other, even diagonally. The puzzle rewards thinking about it two ways at once: sometimes the tree-tent pairing forces a cell, and sometimes the row/column arithmetic forces one instead — the trick is knowing which lens to reach for.

## Goal

Place one tent per tree — each tent orthogonally adjacent to its own tree in a strict one-to-one pairing — so that **no two tents touch, even diagonally**, and **every row and column contains exactly its clued number of tents**.

## The grid & clues

The board is a 7×7 grid, the fixed size used throughout ChessRetabled, freshly regenerated each game. Trees are pre-placed and fixed; every row and every column carries a number along its edge telling you how many tents belong in that line. Generation places non-touching tents first, gives each one its own adjacent tree (never sharing a tree between two tents), and reads the row/column clues straight off that placement before checking the result is uniquely solvable.

## Rules

1. Place exactly **one tent per tree**, each tent orthogonally adjacent (up, down, left, or right) to the tree it belongs to.
2. The tree-to-tent pairing is **one-to-one** — no tree gets two tents, no tent serves two trees, and the total number of tents always equals the total number of trees.
3. **No two tents may touch**, not even at a corner — every tent must have empty space (or a tree) in all eight surrounding cells.
4. Tents never go on a tree's cell, and trees themselves don't count toward row/column tent totals.
5. Every row and column must contain **exactly** its clued number of tents — no more, no fewer.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Tents. Each board is a fresh 7×7 grid: tents are placed one at a time so none ever touch another, each is immediately paired with a fresh adjacent tree, and the row/column totals are read directly off that finished placement — kept only if a solver confirms it's the unique legal answer.
- **Marking cells.** Non-tree cells cycle through three states as you click them: **empty → tent ⛺ → grass · (a "definitely not a tent" marker) → empty**. The grass marker is optional bookkeeping — it doesn't affect solving, but it lets you record "I've ruled this cell out" the same way ✕ works in Slitherlink.
- **Row/column feedback.** The clue numbers along the edges highlight once a row or column's current tent count matches its target, and flag if you've gone over — handy for catching a placement mistake before it cascades.
- **The 💡 hint.** Every generated puzzle stores its full solution, so a hint never has to re-solve anything. Press **Hint** for a *nudge* — one cell whose tent/no-tent state is currently wrong is highlighted; press again to *reveal*, setting it correctly (as a tent or as grass). Using a hint marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** The moment every tree has its matched tent, no two tents touch, and every row/column total is met, the win is detected and logged to your archive automatically.

## Strategy

### Beginner — trees with only one option
- **A tree surrounded by non-empty cells on three sides has a forced tent.** If three of a tree's four orthogonal neighbours are off the board, another tree, or already ruled-out grass, its tent must go in the one remaining cell.
- **A row or column clue of 0 clears the whole line instantly.** Every cell in that row/column becomes grass immediately, which often forces neighbouring trees' tents into a specific column or row by elimination.
- **A row or column clue equal to the maximum possible (accounting for the no-touching rule) forces alternating placement.** A dense clue in a short line usually only has one legal spacing pattern once you account for tents needing breathing room.
- **Mark grass around every placed tent right away.** As soon as a tent goes down, all eight surrounding cells are guaranteed grass — mark them immediately so you don't second-guess a neighbouring tree's placement later.
- **Two trees that are only adjacent to each other's territory usually split cleanly.** If two trees are close together with limited free space around them, work out the few ways they could both get valid, non-touching tents — often only one arrangement survives.

### Intermediate — combining pairing and counting
- **Use row/column budgets to eliminate candidate cells, not just to confirm placed ones.** If a row's clue is already satisfied by tents placed elsewhere in it, every other cell in that row becomes grass immediately, even next to a tree that still needs its tent — forcing that tree's tent into a different row.
- **A tree with two candidate cells, where one candidate is in an already-full row or column, is effectively forced.** Cross off the option that would overflow a satisfied line, and the tree's tent is settled.
- **Chain the no-touching rule across multiple trees.** Placing one tent doesn't just clear its own eight neighbours — it can eliminate a candidate cell for a *different* tree two cells away, which is easy to miss if you only check trees one at a time.
- **Recount remaining budget after every confirmed placement.** A row/column's remaining "tents still needed" versus "cells still available" ratio tightens fast; when they become equal, every remaining candidate cell in that line is forced to be a tent.
- **Watch for trees that share their only two candidate cells.** If two trees can only reach two shared cells between them, and the no-touching rule prevents both tents from using adjacent picks, there's often only one valid pairing left.

### Advanced — matching-theory thinking
- **Think of it as a bipartite matching problem.** Every tree must match to a distinct adjacent cell, exactly like Tents' own solver does — when several trees compete for overlapping candidate cells, work out the matching the same way you'd solve a scheduling conflict: find the tree with the fewest options and resolve it first, then recheck the rest.
- **A "forced grass" chain can ripple across the whole board.** Once row/column exhaustion turns a swath of cells to grass, re-scan every tree adjacent to that swath — a tree that had two options yesterday may now have only one.
- **Use contradiction on a genuinely ambiguous tree.** If a tree has two candidate cells and neither is directly forced, tentatively assign one, propagate the no-touching and row/column consequences, and see if a contradiction (an unmatched tree, or an overshot row/column) appears — that proves the other candidate is correct.
- **Global tent count is a sanity check, not just a target.** The total of all row clues must equal the total of all column clues must equal the number of trees — if your working count of placed tents doesn't reconcile with all three, you've made an error somewhere upstream.

## Traps & common mistakes

- **Forgetting the diagonal no-touching rule.** Two tents in adjacent rows and columns (a diagonal neighbour) is just as illegal as two tents sharing an edge — this is the single most common oversight.
- **Assigning a tent to the "closest-looking" tree instead of checking the actual pairing.** Proximity on the board doesn't decide the matching; a tent must be provably paired via the one-to-one rule, not just visually near a tree.
- **Ignoring row/column overflow until the end.** A line that already has its full quota of tents rules out every other cell in it immediately — leaving that unmarked invites a mistaken tent placement later.
- **Placing a tent on a cell that isn't orthogonally adjacent to any unmatched tree.** Every tent needs its own tree; a "floating" tent that merely fills a row/column quota without a valid tree pairing is not a legal solution.
- **Not marking grass consistently.** Skipping the grass marker makes it easy to forget which cells you've already ruled out, especially on a 7×7 board with several trees active at once.

## A worked example

A tree boxed in on three sides:

```
 . # . .
 # T . .      T is the tree. Its left and top neighbours
 . . . .      are already off-limits (# = known grass,
              from an earlier deduction), and it has no
              neighbour below outside the shown region.
              Its only remaining orthogonal neighbour is
              to the right — the tent is forced there.
```

Once that tent lands, its own eight surrounding cells immediately become grass, which may be exactly the deduction a neighbouring tree needed.

## Glossary

- **Tree** — a fixed clue cell; every tree needs exactly one adjacent tent.
- **Tent** — the placed marker that must pair one-to-one with a tree.
- **Grass** — an optional "not a tent" marker cells cycle through; bookkeeping only.
- **Row/column clue** — the number of tents required in that line, shown along the board's edge.

## Where to go next

Liked pairing clues with a counting grid? **Nurikabe** trades one-to-one matching for connected-region sizing, and **Bridges** keeps the "connect everything correctly" feel but swaps tents for a full network of bridges between numbered islands.
