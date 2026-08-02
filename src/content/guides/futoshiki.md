# Futoshiki

> A 5×5 Latin square wearing inequality signs like tripwires — every ‹ and › narrows the grid before you place a single digit.

**At a glance** · Solo · one 5×5 puzzle, fresh constraints every time · 10–20 min · Play it under **Logic** (`/logic`).

## What it is

Futoshiki ("inequality" in Japanese) is a Latin-square puzzle related to Sudoku but built around ordering rather than boxes. Some cells start filled as givens, and the border between certain adjacent cells carries a **‹** or **›** sign showing which neighbor holds the larger value. It reads almost like a sorting problem wearing a grid's clothing — you're not just placing distinct digits, you're threading them through a chain of local comparisons that ripple outward across the board.

## Goal

Fill every empty cell with a digit from 1 to 5 so that **each row and column contains every digit exactly once**, and **every inequality sign between two adjacent cells is satisfied**.

## The grid & clues

The board is a 5×5 grid. The generator fully solves a Latin square first, then plants roughly 8 inequality signs (about 1.6× the grid size) on randomly chosen adjacent cell-pairs, oriented to match the hidden solution — so every sign you see is true in the answer. It then starts from the fully solved grid and clears cells one at a time, keeping a cell blank only if the puzzle — the Latin rule plus every inequality sign — still has exactly one solution without it. What's left behind are the **givens**: pre-filled cells you can't edit.

## Rules

1. Place a digit **1–5** in every empty cell.
2. **No digit repeats within a row.**
3. **No digit repeats within a column.**
4. For every **‹**/**›** (horizontal) or **˄**/**˅** (vertical) sign printed between two adjacent cells, the arrow always points at the **smaller** value — the digit on the pointed-to side must be less than the digit on the open side.
5. Givens are fixed and can't be changed; inequality signs apply between any two adjacent cells they connect, givens included.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Futoshiki — every puzzle is a freshly generated 5×5 with new givens and new inequality signs. There's no difficulty selector; the clue count and constraint density are fixed by the generator.
- **Filling cells.** Select an empty (non-given) cell, then tap a digit 1–5 on the pad; tap the same digit again to clear it. Given cells are visually distinct and can't be selected for editing.
- **Conflicts.** Row/column repeats and any violated inequality sign are flagged red as soon as both sides of the sign are filled.
- **The 💡 hint.** The full solution is stored at generation time, so a hint never re-solves anything. Press **Hint** for a *nudge* — it highlights the next empty or wrong cell to look at; press again to *reveal* its correct digit. Using a hint marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** A correctly filled grid, with every sign satisfied, logs the solve to your archive.

## Strategy

### Beginner
- **Extreme values first.** A cell forced smaller than several neighbors, or larger than several, has its candidate range squeezed hard — a cell that must be less than two different neighbors, in a row where 1 and 2 are already placed elsewhere, is instantly solvable.
- **Chains of signs.** A run like `a › b › c` forces a to be at least 3 and c to be at most (size − 2) on a 5-wide grid — walk the whole chain to bound every cell in it.
- **Combine with row/column elimination.** Treat inequality signs as an extra layer on top of ordinary Sudoku-style scanning — check both before writing a digit.

### Intermediate
- **Cells sandwiched between two signs.** A cell with a sign on both sides (e.g. the middle of `a › b › c`) has both an upper and a lower bound at once — often collapsing to one or two candidates immediately.
- **The extremes of the grid.** On a 1–5 grid, only 1 can sit at the "small" end of a chain of four consecutive ‹, and only 5 can sit at the "large" end of one — use the puzzle's longest sign-chain to anchor your extreme digits first.
- **Given-anchored deductions.** A given digit next to an inequality sign fixes a hard bound on its neighbor instantly (a given 2 with `2 › x` forces x to 1) — resolve these before scanning further afield.

### Advanced
- **Combine inequality bounds with Latin exclusion.** Once a chain narrows a cell to two candidates, check whether one of them is already excluded by the row/column rule elsewhere in the grid — this is where most "invisible" forced digits hide.
- **Look for contradictions under trial.** When no direct deduction is left, tentatively place a candidate in a heavily-constrained cell (one touching two or more signs) and follow the forced consequences through both the Latin rule and every touching sign; a contradiction rules it out cleanly.
- **Work outward from the most-constrained region.** Cells with two or three inequality signs converging on them are the cheapest source of new information — prioritize them over open cells with no signs at all.

## Traps & common mistakes

- **Misreading which way a sign points.** ‹ / › and their vertical ˄ / ˅ equivalents always point at the *smaller* value — it's easy to flip the inequality by accident when scanning quickly.
- **Forgetting signs apply to givens too.** A sign between two given cells is still usable for deduction elsewhere, not just decoration.
- **Chasing only one row at a time.** Vertical signs (between a cell and the one below it) matter just as much as horizontal ones, and are easy to overlook if you scan row-by-row out of habit.
- **Ignoring the Latin constraint once a sign is "solved."** Satisfying a sign locally doesn't guarantee the digit is legal in its row/column — check both.

## A worked example

A given digit collapsing its neighbor immediately:

```
Given 2 sits left of an inequality sign pointing at
the empty cell to its right:

 [ 2 ] > [ ? ]

">" points at the smaller value, so the empty cell
must be smaller than 2 -- on a 1-5 grid that's only 1.

 [ 2 ] > [ 1 ]
```

## Glossary

- **Given** — a pre-filled, uneditable cell.
- **Latin square** — a grid where each symbol appears exactly once per row and column.
- **Sign chain** — a run of inequality signs linking several cells in sequence.
- **Bound** — the smallest or largest value a cell's signs still allow.

## Where to go next

If you like the ordering twist, **Skyscrapers** reuses the same 5×5 Latin square with line-of-sight counts instead of signs, and **KenKen** swaps signs for cage arithmetic. **Sudoku** is the pure form underneath all three.
