# Lines of Action

> The wilder your position looks, the faster your army can gather — in Lines of Action, crowding a line is the secret to speed.

**At a glance** · You vs the AI · versus · 15–25 min · Play it under **Games** (`/games`).

## What it is

Lines of Action was invented in the 1960s by games designer Claude Soucie and popularised in Sid Sackson's classic compendium *A Gamut of Games*. It borrows chess's board and its sliding pieces but throws out capture as the objective entirely: the only thing that matters is pulling your own army into a single connected shape before your opponent does theirs.

The feel is magnetic and a little unsettling at first. Pieces — yours and your opponent's — aren't just targets, they're the very things that determine how far anything can move, so the board's population is constantly rewriting the rules of the position.

## Goal

Be the first to connect **all** of your pieces into one group — counting diagonal touches as connected — to win. If a single move connects both armies at once, the player who just moved wins.

## The board & pieces

Play on a standard 8×8 checkered grid. **Black** starts with 12 pieces along the top and bottom edge rows, skipping the two corners of each; **White** starts with 12 pieces along the left and right edge columns, likewise skipping the corners. Every piece is identical — there is no rank or promotion, and the corners start empty because a piece stranded there would have almost nowhere useful to go.

## Rules

1. Choose one of your pieces and a straight line through it — any of the four orthogonal or diagonal directions.
2. Count every piece, yours and your opponent's, anywhere along that **entire** line — the full row, column, or diagonal, not just the stretch between the piece and its target. That count is exactly how many squares the piece must travel.
3. The piece may leap over any of its own pieces along the way, but an enemy piece anywhere before the final square blocks the move completely.
4. If the destination square holds an enemy piece, that piece is captured; you can never land on your own.
5. The instant all of a player's pieces form one connected group, that player wins.
6. In the rare case that the side to move has no legal move at all, their opponent wins outright.

| Pieces on the line | Squares travelled |
|---|---|
| 3 (2 of yours + 1 enemy) | 3 |
| 5 (mixed, either colour) | 5 |
| 8 (a full rank crowded with pieces) | 8 |

The count always includes every piece on the *whole* line, not just the ones between the mover and its destination.

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Lines of Action and a difficulty — **Easy / Medium / Hard**. Higher tiers search deeper (a shared alpha-beta engine with iterative deepening) and cut the randomness that lets Easy wander into blunders.
- **Making moves.** Click a piece to highlight its legal destinations; the highlights already account for the current line-length arithmetic, so you never have to count squares yourself — just follow the dots.
- **The 💡 hint.** Press once for a nudge (your strongest piece lights up); press again to reveal its exact destination. Any hint marks the game **assisted**.
- **Pacing.** The computer's reply is floored to at least one animation. Captured pieces drop into a graveyard beside the board; pieces reskin per theme (Dusk/Pastel/Croanada). A 300-ply cap draws the rare game that runs long, though real games almost always resolve well before that.
- Finished games log their full move list to your archive, feeding the Dashboard.

| Difficulty | Search depth | Randomness | Feel |
|---|---|---|---|
| Easy | 2 ply | High | Drifts toward the centre but misses connection threats |
| Medium | 4 ply | Low | Defends against an obvious one-move win |
| Hard | 6 ply | None | Reads multi-move consolidation and sacrifices accurately |

## Strategy

### Beginner
- Centralise. A piece near the middle sits on longer, busier lines in every direction, which usually means more legal moves and shorter paths to the rest of your army.
- Watch the line-length arithmetic: adding a piece to a crowded line makes every piece on it jump farther, which can suddenly open — or close — an escape route.
- Don't rush to trade. A capture removes an enemy piece from the board, but it also shortens *your* line count on that square, sometimes leaving you with a weaker move than you expected.
- Count your own groups after every move, not just your opponent's — it's easy to lose track of how many separate clusters your own army has split into.

### Intermediate
- Before capturing, ask what the piece was doing. If it stood between two of your opponent's own sub-groups, taking it can hand them a connection instead of preventing one.
- Play for tempo over material. A quiet move that pulls two more of your pieces adjacent is usually worth more than a capture that scatters your own shape.
- Use enemy pieces as scaffolding. Since any piece — friend or foe — adds to a line's length, a well-placed opposing piece can be the exact reason your piece can finally reach the square you need.
- A capture that lands your piece inside your own cluster is usually better than one that lands it on the fringe, even when the fringe capture removes a more central enemy piece.

### Advanced
- Run the connection check every single turn, for both sides: does this move leave all of my pieces adjacent, and does it leave all of *theirs* adjacent too? Both matter, since a move that connects both armies is decided in the mover's favour.
- Sacrifice pieces to reshape lines deliberately. Removing a piece, yours or theirs, changes every line-length calculation running through its square — sometimes a loss opens the one lane your last two pieces need.
- In tight endings, herd stray enemy pieces toward the edges, where lines run short and there are few ways back to the group, while keeping your own pieces out of the corners.
- Think several moves ahead about your own shape, not just your opponent's. A "nearly connected" cluster with one straggler two squares away is often one accurate move from winning outright — race to find it before defending anything else.
- Use diagonal lines deliberately. They're the ones beginners forget to count, and a heavy diagonal often lets a piece cross the board in a single unexpected jump.

## Traps & common mistakes

- Capturing a piece that was silently keeping the opponent's groups apart — the single most common Lines of Action blunder.
- Chasing extra mobility into the corners, then finding a piece stranded there with no short line home.
- Losing count after a capture — the line just got shorter, so recompute the distance instead of assuming it matches last turn.
- Playing purely for material out of Checkers habit. Lines of Action has no forced captures and no reward for piece count, only shape.
- Overextending a lone piece toward the group instead of pulling the group toward it — the shortest path to connection is rarely a single long march.
- Forgetting that a jump can land on and capture an enemy piece that was itself blocking a different line — check what a capture unblocks elsewhere before you take it.
- Assuming a longer jump is always the stronger move — a six-square leap that strands your piece far from the rest of your army can undo several turns of careful gathering.

## A worked example

```
Four of your discs sit on one diagonal, plus one enemy disc —
five pieces total on that line, so any disc on it jumps exactly
five squares along it. Add a sixth piece to the same diagonal
next turn and the jump becomes six: the board's own population
is your piece's speedometer.
```

## Glossary

- **Line** — the full row, column, or diagonal running through a piece's square, edge to edge.
- **Connected group** — a set of same-colour pieces linked by king-move (eight-direction) adjacency.
- **Leap** — jumping over friendly pieces on the way to a destination; enemy pieces block instead.
- **Line count** — the number of pieces, either colour, on a line, which fixes how far a piece on it must travel.
- **Consolidation** — drawing scattered pieces together into fewer, larger groups.

## Where to go next

If the connection goal appeals to you, **Hex** is a purer distillation of the same idea. For more chess-adjacent sliding pieces, try **Checkers** or **Reversi** for a very different take on the same board.
