# Nonogram

> Read the numbers like a loom's punch-card, and a picture rises out of an empty grid one forced cell at a time.

**At a glance** · Solo · one 10×10 picture, fresh every time · 10–20 min · Play it under **Logic** (`/logic`).

## What it is

Nonograms (also called Picross or Griddlers) emerged independently in Japan in the late 1980s, popularized in print puzzle magazines and later by Nintendo's Picross games. Unlike most logic grids, you don't place digits — you shade cells to reveal a hidden picture, guided only by run-length clues along every row and column. It's less arithmetic than spatial reasoning: fitting blocks of consecutive shaded cells into a line the way you'd fit boxes onto a shelf, one gap at a time.

## Goal

Shade the cells that match every row's and every column's clue, so the completed grid's shaded runs — read left-to-right and top-to-bottom — line up exactly with what each clue says.

## The grid & clues

The board is a fixed 10×10 grid (no size or difficulty selector). Each row and column clue is a run-length list, e.g. `3 1 2`, meaning — reading along that line — a block of 3 shaded cells, then a gap, then a block of 1, then a gap, then a block of 2, in that order, with the exact gap sizes left for you to work out. A completely empty line's clue is shown as `0`.

## Rules

1. Every cell ends up either **filled** or **empty**.
2. Reading each row left-to-right, the lengths of its consecutive filled runs, in order, must exactly match that row's clue.
3. Reading each column top-to-bottom, the same must hold for its clue.
4. Runs of filled cells within a line must have at least one empty cell of separation between them.
5. Any grid that satisfies every row and column clue counts as solved — see the note below on what that means for this app's generator.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Nonogram and you get a fresh random picture every time (each cell filled with about 55% probability), turned into row and column run clues. There's no size or difficulty selector.
- **Filling cells.** **Fill** mode paints a cell; **Mark** (✕) mode crosses out a cell you've deduced must stay empty — a bookkeeping aid, not required for the win check.
- **Note on uniqueness.** Unlike Sudoku, Binairo, Futoshiki, KenKen, and Skyscrapers in this Logic Lab, Nonogram's generator does not run a uniqueness search. It derives clues once from a random picture and accepts your grid the instant it matches every row and column clue — whichever way you got there, and whether or not it's pixel-for-pixel the original picture. In practice, clue sets this dense on a 10×10 grid are almost always pinned to one picture by logic alone, but technically it's the clues, not the generator's original image, that define a win.
- **The 💡 hint.** Press **Hint** for a *nudge* — it highlights a cell whose fill state doesn't yet match the generated picture; press again to *reveal* it correctly. Using a hint marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** Matching every clue logs the solve to your archive.

## Strategy

### Beginner
- **Anchor from both ends of a full run.** A run close to the line's length forces overlap: a run of 7 on a 10-cell line must occupy at least cells 4–7 (pack it flush left, then flush right, and take the intersection) no matter where it ultimately sits.
- **Zero clues are free.** A `0` clue means the whole line is empty — cross it all out immediately; it also tells you every crossing column or row has an empty cell there.
- **Start with the longest runs.** The longer a clue is relative to the line length, the less freedom it has to move — solve those lines first.

### Intermediate
- **Push runs from both directions.** If the first clue number plus its minimum leading gaps can't be pushed past a certain column without breaking the line's total, that run's start is forced — work from both the start and the end of the line, not just one.
- **Cross-reference rows against columns.** A cell forced filled by a row clue immediately constrains the column clue crossing it, and vice versa — alternate between the two rather than finishing all rows first.
- **Use completed lines to prune neighbors.** Once a line is fully resolved, treat every one of its cells as a given for the perpendicular lines that cross it.

### Advanced
- **Gap-counting for tight lines.** When a line's total length (every run plus the minimum one-cell gaps between them) is close to the line's actual length, the slack is small; distribute that slack across the gaps to find cells that are filled in every valid arrangement.
- **Mark impossible cells, not just certain ones.** Crossing out cells you've *proven* must be empty (Mark mode) is as valuable as filling — it shrinks the search space for every future run placement on that line.
- **Resolve ambiguity by checking the crossing line.** When a line has two remaining placements for a run, check what each implies for the columns (or rows) it crosses — often only one avoids breaking a crossing clue.

## Traps & common mistakes

- **Forgetting the mandatory gap between runs.** Two clue numbers, e.g. `2 2`, can never touch — there must be at least one empty cell between the blocks even if nothing else forces it.
- **Filling on a guess.** Since the puzzle only checks the final clues, an unconfirmed guess can look fine for a while and then force a contradiction much later, deep in the grid — track which cells are proven versus assumed.
- **Losing track of which mode you're in.** Fill and Mark share the same click target; tapping a cell in the wrong mode wastes a move and muddies your reasoning.
- **Ignoring completed lines.** A finished row still constrains every column crossing it — don't stop checking it just because its own clue is already satisfied.

## A worked example

Overlap forcing on a tight run:

```
Row of 10 cells, clue = [7].

Left-packed:  # # # # # # # . . .   (cells 1-7)
Right-packed: . . . # # # # # # #   (cells 4-10)

Overlap (both agree): cells 4-7 must be filled,
regardless of which packing turns out to be correct.
```

## Glossary

- **Run** — a maximal block of consecutive filled cells in a line.
- **Clue** — the ordered list of run lengths for one row or column.
- **Overlap** — cells forced filled because every valid placement of a run covers them.
- **Mark** — a cell you've deduced must stay empty (✕), as distinct from unknown.

## Where to go next

For more picture-logic in the same "shade to satisfy the clues" spirit, try **Mosaic** (numeric shading clues instead of runs) and **Akari** (light-placement instead of shading). If you'd rather stay in pure grid-of-digits territory, **Sudoku** is the classic next stop.
