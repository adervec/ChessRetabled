# Skyscrapers

> Stand at the edge of the city block and count only the rooftops tall enough to peek over the ones standing in front of them.

**At a glance** · Solo · one 5×5 puzzle, fresh clues every time · 10–20 min · Play it under **Logic** (`/logic`).

## What it is

Skyscrapers dresses a plain Latin square up as a city block: each cell holds a building of a certain height, and the clues sit outside the grid — one per row and column edge — counting how many rooftops you'd see looking straight down that line from outside. A tall building blocks the view of every shorter one standing behind it, so a clue of 1 means the tallest building in that line faces you first, and a clue equal to the grid size means every single building is visible, meaning the heights must climb in strictly increasing order from that side.

## Goal

Fill every cell with a building height from 1 to 5 so each row and column contains every height exactly once, and every edge clue matches the count of buildings visible looking inward from that side.

## The grid & clues

The board is a 5×5 grid of cells, framed by up to four clue numbers per row/column — a left and a right clue for each row, a top and a bottom clue for each column (20 possible clue slots in total). Not every slot carries a clue; the generator strips out as many as it can while the remaining clues still pin exactly one solution, so a blank edge simply means "no information needed from that side." The generator first finds a Latin square whose *full* set of edge counts is enough to pin the grid uniquely at all — some Latin squares aren't determined even by all 20 clues, so it retries until it lands on one that is — and only then starts removing clues.

## Rules

1. Place a height **1–5** in every cell.
2. **No height repeats within a row.**
3. **No height repeats within a column.**
4. For a given edge clue: scan inward along that row/column and count a building as visible whenever it's taller than every building already passed from that direction. The total visible count must equal the clue.
5. A row or column is only checked against its clue(s) once every cell in it is filled.

## How it works in ChessRetabled

- **Opening a puzzle.** Under Logic, choose Skyscrapers for a fresh 5×5 grid and clue set every time; there's no difficulty selector.
- **Filling cells.** Select a cell, then tap a height 1–5 on the pad (tap the same height again to clear it).
- **Conflicts.** Row/column repeats are flagged live; a completed row or column that doesn't match its edge clue(s) is flagged across the whole line once it's full.
- **The 💡 hint.** Press **Hint** for a *nudge* — it highlights the next wrong or empty cell; press again to *reveal* it, filling in the solution height. Using a hint marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** The generated puzzle is guaranteed solvable to a unique grid by logic alone — the generator only keeps clue sets it has proven, by exhaustive search, pin exactly one answer. Filling it correctly logs the solve to your archive.

## Strategy

### Beginner
- **A clue of 1 means the tallest building is first.** Looking from that side, the very first cell in the line must hold the maximum height (5, on this grid) — nothing else satisfies "only one visible."
- **A clue equal to the grid size means strictly increasing.** A clue of 5 on this 5-wide grid forces every building taller than the one before it — the heights read 1, 2, 3, 4, 5 in order from that side.
- **Cross-reference both ends of a line.** A row's left and right clues, when both are present, constrain the same five cells from opposite directions — combine them before touching the number pad.

### Intermediate
- **A clue of 2 fixes the tallest building's range.** With a clue of 2 on a line of length 5, the tallest building (height 5) can only occupy certain positions — too early and the clue would read 1, too late and shorter buildings in front might sneak in an extra visible one. Work out the feasible range by testing where 5 could sit.
- **Combine edge-clue deductions with Latin elimination.** Once an edge clue restricts a line's low or high end, cross those heights off the correspondingly restricted cells in every other line crossing them.
- **Corners see two clues at once.** The four corner cells are constrained by a row clue and a column clue simultaneously — they're usually the fastest cells to pin down.

### Advanced
- **Height-5 (and height-1) placement is the master key.** Since the tallest building is always visible from its own side and blocks everything behind it, working out where the extreme heights can legally sit in each clued line often cascades into solving the rest of that line.
- **Check consistency against the opposite clue.** For any candidate arrangement of the tallest few buildings in a line, mentally re-derive what the opposite-side clue for that same line would have to read, and compare it to what's actually printed (if present) — an inconsistency eliminates the candidate outright.
- **Branch on the tightest visibility clue when stuck.** A clue of 2 or 3 on a full-length line has far fewer valid height-orderings than an unclued line; enumerate them and cross-check against the Latin constraint from perpendicular lines to break the tie.

## Traps & common mistakes

- **Forgetting a building can be visible without being the tallest overall.** Visibility only compares against buildings already passed on that line, not the whole grid — a height-3 building is "visible" if only shorter buildings sit in front of it.
- **Double-counting how the clue works.** The clue counts distinct heights that set a new local maximum as you scan inward — a straight run of increasing heights counts every one of them, but a run that decreases after the first counts only that first building.
- **Reading a clue from the wrong direction.** Left clues look rightward into the row; right clues look leftward. Mixing the two up flips your whole deduction for that line.
- **Missing that a blank edge is still meaningful.** A missing clue means the generator judged it unnecessary for uniqueness — not that "anything goes" there. The row, column, and any remaining clues on that line are still fully binding.

## A worked example

A clue of 1 forcing the tallest building immediately:

```
Left clue = 1 on a 5-wide row:

 [1] [ ][ ][ ][ ][ ]

Only one building can be visible from the left --
the very first one must already be the tallest
possible in the line, height 5:

 [1] [5][ ][ ][ ][ ]
```

## Glossary

- **Visible building** — one taller than every building the eye has already passed on that line.
- **Edge clue** — the visible-count number printed outside a row or column.
- **Latin square** — a grid where each symbol appears exactly once per row and column.
- **Corner cell** — a cell constrained by both a row clue and a column clue at once.

## Where to go next

**Futoshiki** and **KenKen** share the same 5×5 Latin-square core with different extra constraints — inequalities and cage arithmetic, respectively. **Sudoku** is the pure version underneath all three.
