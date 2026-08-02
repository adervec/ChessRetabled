# Sudoku

> No arithmetic, no luck — just one hidden arrangement of nine digits and the pure logic that pins it down.

**At a glance** · Solo · one puzzle, one answer · 5–30 min · Play it under **Logic** (`/logic`).

## What it is

Sudoku is a constraint puzzle: a 9×9 grid, partly filled, that you complete so a simple set of rules is satisfied. Despite the numbers, it is **not** a maths puzzle — the digits are just nine distinct symbols. What you are really doing is deduction: using the givens to force each empty cell to a single possible value, one inference at a time. A proper Sudoku has **exactly one solution** reachable by logic alone, so you never have to guess.

## Goal

Fill every empty cell so that **each row, each column, and each of the nine 3×3 boxes contains the digits 1–9 exactly once**.

## The grid & clues

The board is 9×9, divided into nine 3×3 boxes. A number of cells are pre-filled as **givens** (clues). The count of givens sets the difficulty: fewer clues generally mean deeper chains of reasoning. Every valid puzzle's remaining cells are uniquely determined by those givens.

## Rules

1. Place a single digit **1–9** in each empty cell.
2. **No digit repeats within a row.**
3. **No digit repeats within a column.**
4. **No digit repeats within a 3×3 box.**
5. A correct grid satisfies all three simultaneously — and for a well-formed puzzle there is only one way to do it.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Sudoku and a difficulty. Each board is freshly **generated**: the solver removes clues only while a uniqueness check confirms the solution stays the one-and-only, so you are guaranteed a puzzle solvable by logic.
- **Filling cells.** Select a cell and enter a digit; conflicts (a digit that breaks a row, column, or box) are flagged so you catch slips early.
- **The 💡 hint.** Every generated puzzle stores its full solution, so a hint never has to re-solve. Press **Hint** for a *nudge* — a single cell is highlighted as the next place to look; press again to *reveal* its correct digit. Using a hint marks the puzzle **assisted** in your history and Dashboard, keeping unaided solves distinct.
- **Completion.** Filling the grid correctly logs the solve to your archive with your time and difficulty.

## Strategy

### Beginner — scanning
- **Cross-hatching.** Pick a digit and a box; scan the rows and columns already containing that digit to eliminate cells, and see if only one cell in the box remains — that's a forced placement ("hidden single").
- **Work the fullest units first.** A row, column, or box that already has 7–8 digits often forces its last cells immediately.
- **Pencil in candidates.** For a tricky cell, note which digits are still possible; the puzzle progresses as candidate lists shrink to one.

### Intermediate — interactions between units
- **Naked pairs/triples.** If two cells in a unit can only be, say, {4, 7}, then 4 and 7 are locked to those two cells and can be removed as candidates from the rest of that unit.
- **Pointing pairs.** If within a box a candidate is confined to one row (or column), it can be eliminated from that row (or column) *outside* the box.
- **Hidden singles hide in plain sight.** A cell may have many candidates, but if a digit fits *only* that cell within its row/column/box, it goes there.

### Advanced — chains
- **X-Wing / Swordfish.** Rectangular patterns of a candidate across rows and columns let you eliminate that candidate elsewhere.
- **Colouring and forcing chains.** Follow the consequences of a candidate being true or false along a chain; a contradiction proves the other state. Hard boards are ultimately cracked by these longer inferences — but never by guessing, since the solution is unique.

## Traps & common mistakes

- **Guessing.** A proper Sudoku never needs it; if you feel forced to guess, there's an eliminated candidate you missed.
- **Ignoring the box constraint.** Beginners scan rows and columns and forget the third rule that makes the digit forced.
- **Stale pencil marks.** After a placement, update candidate lists in the affected row, column, and box, or you'll chase phantoms.
- **Tunnel vision on one region.** When stuck, switch the digit you're hunting rather than the cell.

## A worked example

A hidden single by cross-hatching:

```
Box (top-left) is missing a 5. Rows and columns
crossing it already hold a 5 in every cell but one:

 . . . | ...        the only cell in the box not
 . 5 . | ...        "seen" by another 5 is forced —
 . . X | ...        X must be 5.
```

No candidate counting needed — the existing 5s do the eliminating for you.

## Glossary

- **Given / clue** — a pre-filled cell.
- **Candidate** — a digit still possible in a cell.
- **Naked single** — a cell with only one candidate left.
- **Hidden single** — a digit that fits only one cell within a unit.
- **Unit** — a row, column, or box (each must hold 1–9 once).

## Where to go next

Love the Latin-square core? Try **KenKen**, **Futoshiki**, and **Skyscrapers**, which add arithmetic, inequality, and line-of-sight twists to the same "each symbol once per line" idea.
