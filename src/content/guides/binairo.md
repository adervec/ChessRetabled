# Binairo

> Two symbols, zero arithmetic — and somehow every row and column still ends up with its own unmistakable fingerprint.

**At a glance** · Solo · 6×6 grid, easy/medium/hard · 10–20 min · Play it under **Logic** (`/logic`).

## What it is

Binairo (also known as Takuzu or Binary Puzzle) trades Sudoku's nine digits for exactly two symbols, 0 and 1, and asks you to fill a grid under three deceptively simple rules. Despite the tiny alphabet, it's just as constraining as its bigger cousins — the "no three in a row" and "balanced count" rules combine to force long deduction chains even on a small board, and the requirement that every row (and every column) be unique adds a subtle third layer most players don't expect the first time through.

## Goal

Fill every empty cell with a 0 or a 1 so that no line ever holds three of the same symbol in a row, every row and column has an equal split of 0s and 1s, and no two rows — or two columns — read identically.

## The grid & clues

The board is a fixed 6×6 grid. Some cells start filled as givens; how many depends on the difficulty you pick:

- **Easy** keeps about 62% of the solved grid as givens.
- **Medium** keeps about 50%.
- **Hard** keeps about 42%.

The generator solves a full grid first, then clears cells one at a time in random order, keeping a cell blank only while the puzzle — all three rules together — still has exactly one solution.

## Rules

1. Every cell holds a **0** or a **1**.
2. **No three consecutive cells** in any row or column may hold the same symbol (a run of 0s or 1s never reaches length 3).
3. **Each row and each column contains an equal number of 0s and 1s** — on this 6×6 board, three of each.
4. **No two rows may be identical, and no two columns may be identical.**
5. A grid is solved only when it satisfies rules 2–4 simultaneously.

## How it works in ChessRetabled

- **Opening a puzzle.** Pick Easy, Medium, or Hard under Logic → Binairo; each choice regenerates a fresh 6×6 with a new solution and new givens at that keep-fraction. Switching difficulty starts a new puzzle immediately.
- **Filling cells.** Tap an empty (non-given) cell to cycle it empty → 0 → 1 → empty.
- **Conflicts.** A three-in-a-row run, an over-quota row or column, or a duplicate row/column are all flagged red live as you fill.
- **The 💡 hint.** Press **Hint** for a *nudge* — it highlights a wrong or empty cell; press again to *reveal* it, filling in the generator's solution digit. Using a hint marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** A valid grid logs the solve to your archive with the difficulty noted.

## Strategy

### Beginner
- **Complete pairs force the third.** Two of the same symbol already adjacent (`0 0 _`) force the next cell in both directions to the opposite symbol, since a run of three is banned.
- **Sandwiched cells.** A gap between two matching symbols (`0 _ 0`) forces the middle cell to the opposite symbol too — otherwise you'd create a run of three.
- **Count as you go.** Once a row or column reaches its quota of one symbol (3 of one symbol, on this 6×6 board), every remaining empty cell in that line must be the other symbol.

### Intermediate
- **Balance plus adjacency together.** Even before either rule alone forces a cell, combining "how many 0s/1s are left to place in this line" with "which spots would create a run of three" often narrows the line to one legal arrangement.
- **Uniqueness across full lines.** Once all but one row (or column) is complete, you effectively know all six values a legal grid still needs — check whether the almost-finished line would duplicate one already placed. Occasionally its last two cells are forced by that rule alone, not by adjacency or balance.
- **Start from clustered givens.** A cell touched by two givens on either side is far more constrained than an isolated empty cell — begin deductions from clusters of pre-filled cells.

### Advanced
- **Cross-line propagation.** A cell forced by its row's adjacency rule instantly becomes a given for its column — recheck that column's balance and adjacency immediately rather than finishing the row first.
- **Domino forcing.** Two adjacent unknown cells that together must contain exactly one 0 and one 1 (because either an all-0 or all-1 pairing would break balance or create a run) form a forced "domino." If a matching domino elsewhere in the same row is already resolved, use row-uniqueness to fix this one's order too.
- **Test the tightest remaining line when stuck.** Lines closest to their quota, or with the most givens already fixed, yield the fastest contradictions under a trial placement — far cheaper than guessing in a wide-open line.

## Traps & common mistakes

- **Forgetting columns while fixated on rows.** The adjacency and balance rules apply identically in both directions — a fix that avoids three-in-a-row horizontally can quietly create one vertically.
- **Losing count of the quota.** On a 6-wide line the quota is three and three — miscounting how many 0s or 1s are already placed is the single most common slip.
- **Ignoring the uniqueness rule until the very end.** Row/column uniqueness can resolve ambiguous cells much earlier than most solvers expect — don't save it as a last resort.
- **Losing track of which cells are givens.** Givens are locked and can't be clicked, but it's easy to forget which cells were pre-filled versus placed by you — lean on the visual distinction.

## A worked example

A sandwiched cell forced by the no-three rule:

```
Row fragment:  [0][ ][0]

The middle cell can't also be 0 (that would make
three 0s in a row), so it must be 1:

               [0][1][0]
```

## Glossary

- **Given** — a pre-filled, uneditable cell.
- **Run** — a block of consecutive identical symbols in a line.
- **Quota** — the count of each symbol a fully balanced row or column must hold.
- **Domino** — a pair of adjacent unknown cells whose combined content is fixed even before their order is known.

## Where to go next

**Sudoku** and **Skyscrapers** share the same "unique line" discipline with a larger symbol alphabet; if you enjoy shading logic with a spatial twist, **Hitori** is a natural next stop.
