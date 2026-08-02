# Breakthrough

> Two rows of pawns, one rule twist — you can only capture on the diagonal — and suddenly a game with no queens, no kings, and no draws becomes a genuine race to the finish line.

**At a glance** · You vs the AI · versus · 8–15 min · Play it under **Games** (`/games`).

## What it is

Breakthrough is a modern abstract game, designed by Dan Troyka in 2000 and quickly adopted by the combinatorial-games community for doing so much with so little: sixteen identical pawns a side, one movement rule, one capture rule, and a board you probably already own. It's since been analysed and even fully solved on smaller board sizes, which tells you something about how sharp the tactics get despite the minimal rule set.

The feel is relentless. Unlike chess pawns, these can step diagonally without capturing, which means the whole army can flow sideways as easily as forward — and because there's no drawing mechanism at all, every game ends in a definite breakthrough for one side or the other.

## Goal

Be the first to march a pawn onto your opponent's **back row**, or leave your opponent with **no legal move** on their turn. Either wins outright — there are no draws in Breakthrough.

## The board & pieces

An 8×8 board. Each side starts with **sixteen pawns**, filling their two home rows completely (unlike chess, there's no gap — every square on both starting rows is occupied).

## Rules

1. **Light moves first**, alternating with Dark. Light starts at the bottom of the board and marches up; Dark starts at the top and marches down.
2. On your turn, move one pawn **one square forward** — either straight ahead or diagonally forward — into an **empty** square.
3. **Captures are diagonal only.** A pawn may capture an enemy pawn one square diagonally forward, taking its place. A pawn can **never** capture straight ahead, even if an enemy sits directly in front of it (that pawn simply blocks the straight move).
4. The first pawn to reach the opponent's **back row** wins immediately for its side.
5. If a player has **no legal move** on their turn, they lose immediately.
6. There is no drawing mechanism — the game always ends decisively.

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Breakthrough and a difficulty — **Easy / Medium / Hard**. All three share the same alpha-beta engine with iterative deepening; Hard searches six ply deep with zero randomness, which is usually enough to spot a forced breakthrough race well before it happens.
- **Making moves.** Click one of your pawns to highlight its legal destinations — straight and diagonal squares light up, with diagonal captures marked distinctly from quiet diagonal steps — then click the target.
- **The 💡 hint.** Press **Hint** for a nudge (the pawn the strongest AI would move is highlighted), press again to reveal the exact move. Any hint marks the game **assisted** in your history and Dashboard.
- **The computer never snaps.** Its reply is floored to at least one animation, so you can watch each step or capture land. Pawns reskin per theme (Dusk/Pastel/Croanada); captured pawns fall into a graveyard beside the board.
- Finished games are logged with the full move list to your archive.

## Strategy

### Beginner
- **Straight moves are for advancing safely; diagonal moves are for fighting.** Since only diagonals capture, a pawn moving straight ahead can't be taken by a pawn directly in front of it — use that to push central pawns forward when the file is clear.
- **Never leave a pawn diagonally exposed with no support.** If an enemy pawn can capture yours and nothing of yours can recapture, that's a pawn (and often tempo) lost for nothing.
- **Count the race, not just the material.** Being down a pawn matters far less here than being a step closer to the back row — always ask "who gets there first if we both just run?"

### Intermediate
- **Build a phalanx.** Two pawns side by side defend each other diagonally — if one gets captured, the other recaptures. A lone runner with no support is easy prey.
- **Defend in depth on the flank your opponent is pushing.** Because pawns can move straight or diagonally, a breakthrough attempt often comes down one file or two — stack defenders so a single capture doesn't open the lane.
- **The edge columns are weaker to defend.** A pawn on the edge file only has one diagonal to worry about attacking from, but it also only has one diagonal to defend itself with — edge breakthroughs are common because they're harder to double-team.

### Advanced
- **Calculate the race exactly.** In the endgame, count the number of moves each side's fastest runner needs to reach the back row, accounting for exactly which enemy pawns can intercept it diagonally — Breakthrough races are often forced and fully calculable well in advance.
- **Sacrifice to clear a lane.** Giving up a pawn to a capture that removes your opponent's only remaining defender on a file can be worth far more than the material, if it opens a clear run to the back row.
- **Watch both flanks at once late in the game.** Because there's no drawing mechanism, a defence that's airtight on one side but thin on the other loses the moment your opponent notices — don't over-commit your whole army to blocking a single threat.

## Traps & common mistakes

- **Assuming a pawn in front of yours is safe from you.** It's actually the other way around — that pawn can't stop your diagonal captures either, but it also can't be captured by a straight-ahead move; check the diagonals specifically.
- **Advancing a lone runner with no support.** It looks fast, but a single well-placed enemy pawn can capture it the moment it reaches a diagonal, ending the run for nothing.
- **Trading down without checking who wins the resulting race.** Fewer pawns on the board often favours whoever is closer to the goal — don't simplify blindly.
- **Ignoring the "no legal move" loss condition.** In cramped positions it's possible to be boxed in entirely, even with pawns still on the board — always check you have at least one square to go before committing elsewhere.

## A worked example

Light has two pawns side by side forming a phalanx. Dark's pawn captures one diagonally, but Light's other pawn recaptures immediately — the phalanx survives the trade and keeps advancing.

```
Row above:   .  d  .
Phalanx:     L  .  L        Dark captures the gap; Light's other
                              pawn recaptures diagonally. Net: even
                              trade, phalanx intact, advance continues.
```

## Glossary

- **Phalanx** — two or more pawns positioned to defend each other diagonally.
- **Diagonal capture** — the only way to remove an enemy pawn; a straight-ahead enemy pawn simply blocks you.
- **Breakthrough** (the move) — successfully getting a pawn past the enemy's defensive line to the back row.
- **Back row** — your opponent's home rank; reaching it wins instantly.
- **Race** — the core calculation of the endgame: who reaches the back row first, accounting for interceptions.

## Where to go next

For diagonal captures with a very different rhythm, try **Checkers** — same geometry idea, but with mandatory jumps and crowning instead of a pure race. **Kōnane** offers another no-draw, last-one-standing dynamic if you enjoyed the decisive finish here.
