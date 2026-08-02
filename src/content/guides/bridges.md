# Bridges

> A scattering of numbered islands, each demanding its exact quota of bridges — link them all without a single crossing.

**At a glance** · Solo · one puzzle, one answer · 10–20 min · Play it under **Logic** (`/logic`).

## What it is

Bridges (Hashiwokakero, "build bridges" in Japanese, often shortened to Hashi) is a network-building puzzle. Every island on the board carries a number: exactly that many bridge-ends must touch it once you're done. Bridges only run in straight horizontal or vertical lines between two islands, never diagonally, and the whole finished network has to hold together as one connected structure — no island, however satisfied its own number is, may end up isolated from the rest. Unlike the shading and loop puzzles nearby it in the Logic Lab, Bridges is a puzzle about degree-counting on a graph: each island is a node, each possible bridge is an edge, and you're deciding how many parallel edges (0, 1, or 2) sit on each connection.

## Goal

Connect the numbered islands with horizontal and vertical bridges so that **every island's bridge-count matches its number exactly**, **no two bridges cross**, and **every island is reachable from every other island** through the bridge network.

## The grid & clues

The board is a 7×7 grid, the fixed size used throughout ChessRetabled, freshly regenerated each game. Islands are scattered cells bearing a number; every other cell is empty space a bridge may pass through (but never another island). Two islands are only ever candidates for a bridge if they sit in the same row or column with a completely clear path between them — no other island in the way. Generation grows a connected, non-crossing bridge network first and reads the resulting island counts off it, then relies on a solver to confirm the layout has exactly one legal bridge assignment.

## Rules

1. A **bridge** runs perfectly straight, horizontal or vertical, directly between two islands with nothing else between them.
2. Any pair of islands may be joined by **0, 1, or 2** bridges (a double bridge is drawn as two parallel lines).
3. An island's total bridge-ends (counting a double bridge as 2) must **exactly equal its number**.
4. **Bridges may never cross** — a horizontal and a vertical bridge cannot both occupy the same empty cell.
5. Once the puzzle is solved, **every island must be connected to every other island**, directly or through a chain of bridges — no isolated pockets, even if every individual island's number is already satisfied.

## How it works in ChessRetabled

- **Opening a puzzle.** Under **Logic**, choose Bridges. Each board is a fresh 7×7 grid: a connected, non-crossing bridge network is grown first (so a valid answer always exists), the island numbers are read off that network's bridge-ends, and the layout is only kept once a solver confirms it's the unique legal assignment.
- **Placing bridges.** Tap an island, then tap a neighbouring island in the same row or column to add a bridge between them. Tap the same pair again to upgrade it to a double bridge, and once more to clear it back to zero — a simple three-state cycle per connection. Islands change colour once their count is exactly met, and flag themselves if you've over-committed bridges to them.
- **The 💡 hint.** Every generated puzzle stores its full solution bridge counts, so a hint never has to re-solve anything. Press **Hint** for a *nudge* — the two islands of one incorrect connection are highlighted; press again to *reveal*, setting that connection to its correct bridge count. Using a hint marks the puzzle **assisted** in your history and Dashboard.
- **Completion.** The moment every island's count is satisfied, no bridges cross, and the whole network is one connected component, the win is detected and logged to your archive automatically.

## Strategy

### Beginner — the forced islands
- **A corner island with only two possible directions and a high number is heavily forced.** An island in a corner can only reach two other islands at most; if its number is close to the maximum those two connections could offer (4, from two double bridges), most or all of its bridges are forced immediately.
- **An island with only one possible neighbour must take every bridge from that single connection.** If an island can only see one other island in its row/column (nothing else shares a line with it), its entire number has to come from that one link, up to the double-bridge cap of 2.
- **A "1" island only ever needs a single bridge to any one of its neighbours.** Don't commit to which neighbour yet if there's more than one candidate — but do keep it in mind, since satisfying it can be the last domino for a nearby island.
- **Count each island's maximum reachable bridges before doing anything else.** Add up 2 bridges per visible neighbour; if that maximum exactly equals the island's number, every single one of its connections is a forced double bridge.
- **Mark obviously impossible pairs early.** If a straight line between two islands has a third island sitting on it, they can never be bridged directly — cross that pairing off mentally so you don't waste time considering it.

### Intermediate — counting and elimination
- **Subtract satisfied neighbours from an island's remaining budget.** Once one of an island's connections is fully decided, recompute how many bridges its *other* connections must collectively supply, and check whether that remaining number forces one of them outright.
- **Watch for crossing conflicts as a source of forced decisions.** If placing a bridge on one connection would cross an already-necessary bridge on another, that connection is ruled out entirely, which can cascade into forcing bridges on an island's remaining options.
- **An island one bridge short of its number, with only one remaining undecided connection, is fully forced.** This is the single most common "next move" once a board is partway solved — always scan for it before looking for anything fancier.
- **Isolated clusters are a warning sign, not a solution.** If a group of islands satisfies all their own numbers but has no bridge reaching islands outside the group, the assignment is incomplete — the connectivity rule means you must sacrifice a "locally tidy" solution that doesn't actually connect everything.
- **Use parity on a "3" island with exactly two neighbours.** Two neighbours sharing 3 total bridge-ends must split as 1-and-2 in some order, never 0-and-3 (the cap is 2 per connection) — enumerate the few legal splits and see if outside information picks one.

### Advanced — global connectivity
- **Treat the board as a graph and check for potential cut points.** An island whose removal would split the rest of the network into two disconnected halves is a bridge (in the graph-theory sense) that must carry at least one connection, even if local counting alone doesn't immediately force it.
- **Reserve the connectivity rule for your final tie-breaks.** When two candidate assignments both satisfy every individual island's number, the one that leaves the network in a single connected piece is correct — this frequently resolves the very last undecided pair on a board.
- **Trace forced chains outward from your most-constrained island.** Bridges puzzles often unravel almost entirely from one or two heavily-constrained starting islands; work outward methodically rather than jumping between unrelated corners of the board.
- **Use contradiction when a count alone won't decide a pair.** Tentatively assign 0 bridges to an ambiguous connection and propagate; if that assignment makes some other island impossible to satisfy or strands part of the network, the connection must carry at least 1 bridge instead.

## Traps & common mistakes

- **Forgetting the connectivity rule entirely.** It's easy to satisfy every island's number and still end up with two separate connected clusters — always do a final check that the whole board links up as one piece.
- **Drawing a bridge that crosses an existing one.** The interaction only lets you add non-crossing bridges to a candidate pair, but it's still easy to plan a solution on paper that secretly needs two lines to cross.
- **Over-committing a double bridge too early.** Placing 2 bridges on a connection before you're sure the island's number requires it can force you to undo work once later constraints reveal the split should have been 1-and-1 elsewhere.
- **Ignoring an island once its number looks "met."** Always double-check a satisfied island doesn't accidentally need revisiting if you later discover one of its connections should be split differently.
- **Assuming the nearest island is always the right one to bridge to.** With three or more candidates in different directions, the correct pairing is determined by the whole board's constraints, not by proximity.

## A worked example

A corner island whose only two neighbours cap its maximum exactly:

```
 4 . . 2
 . . . .      The "4" sits in the corner and can only see
 . . . .      two other islands: the "2" to its right and
 3 . . .      the "3" below it. Two neighbours means at
              most 2+2 = 4 bridge-ends available — exactly
              its number — so BOTH connections must be
              double bridges, forced immediately.
```

That single forced pair often cascades: the "2" island is now fully satisfied by that one double bridge, so any other connection it might have had is ruled out at zero.

## Glossary

- **Island** — a numbered cell that bridges connect to.
- **Bridge** — a straight horizontal or vertical link between two islands; up to 2 may join the same pair.
- **Bridge-end** — one unit of connection an island's number counts; a double bridge contributes 2.
- **Connectivity** — the requirement that every island reach every other island through the finished network.

## Where to go next

If you liked reasoning about a connected network of numbered nodes, **Nurikabe** asks a related connectivity question about regions instead of bridges, and **Numberlink** swaps discrete bridge-counts for continuous paths that must fill the whole grid.
