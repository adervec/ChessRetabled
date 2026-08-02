# Tic-Tac-Toe

> Solved before you learned to write your name, and still the first place anyone learns what it means to think two moves ahead.

**At a glance** · You vs the AI · versus · 2–5 min · Play it under **Games** (`/games`).

## What it is

Three-in-a-row games go back millennia — versions were scratched into Roman pavements as *Terni Lapilli* long before the grid-and-marks form settled into the "noughts and crosses" of 19th-century Britain. It's since become the canonical first example in game theory: small enough to solve completely by hand, and the standard teaching tool for the minimax idea that powers every AI opponent in this app, chess included.

The feel is quick and familiar — but that familiarity is exactly the point. It's the cleanest possible demonstration that a fully "solved" game rewards precision over cleverness.

## Goal

Be the first to line up three of your own marks — in a row, column, or diagonal — to win.

## The board & pieces

Play on a 3×3 grid. **Crosses** (✕) move first; **Noughts** (◯) move second. There is no piece movement or capture — every mark, once placed, stays exactly where it was played.

## Rules

1. Players alternate placing their mark — Crosses first — on any empty cell.
2. The first player to complete three of their own marks in a row, column, or diagonal wins immediately.
3. If all nine cells fill with no line completed, the game is a draw.

| Cell type | Count | Winning lines through it |
|---|---|---|
| Centre | 1 | 4 (row, column, both diagonals) |
| Corner | 4 | 3 (row, column, one diagonal) |
| Edge | 4 | 2 (row, column only) |

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Tic-Tac-Toe and a difficulty. The tiers here are named **Easy / Medium / Perfect** rather than the usual Easy/Medium/Hard — Perfect searches the entire nine-cell game tree on every move, so it can never lose; the best result available against it is a draw. Easy and Medium keep real, exploitable randomness.
- **Making moves.** Interaction is "place": click any empty cell to drop your mark directly — there's no piece to select first.
- **The 💡 hint.** Press once for a nudge (the general area of the strongest cell is highlighted); press again to reveal the exact cell. Any hint marks the game **assisted**.
- **Pacing.** The computer's reply is floored to at least one animation, even in a game this fast. There's no graveyard, since nothing is ever captured.
- Finished games log their full move list to your archive, feeding the Dashboard.

| Difficulty | Search depth | Randomness | Feel |
|---|---|---|---|
| Easy | 1 ply | Very high | Rarely blocks or forks; easy wins available |
| Medium | 4 ply | Moderate | Blocks obvious threats but can still be forked |
| Perfect | 9 ply (the whole tree) | None | Never loses; the best you can force is a draw |

## Strategy

### Beginner
- Take the centre if it's open — it sits on all four possible winning lines (its row, its column, and both diagonals), more than any other cell.
- If the centre is taken, take a corner. Corners sit on three lines each; the four edge cells sit on only two and are the weakest opening squares.
- Before every move, check two things in order: can I win this turn, and if not, must I block my opponent's win this turn.
- Play the centre on your very first move whenever you get to move first — it's the single strongest opening square on the board.

### Intermediate
- Learn the **fork**: a move that creates two different three-in-a-row threats at once. Your opponent can only block one line, so you win on the following move regardless.
- The standard response to an opening corner is the centre, not the opposite corner — taking the opposite corner invites a fork through the two remaining corners.
- Play safe, not flashy. Since perfect play always draws, your real job against a strong opponent is avoiding forks, not manufacturing a win that isn't there.
- When you must choose between blocking and building your own threat, check whether the blocking square also happens to set up a fork of your own — the best moves in Tic-Tac-Toe often do both at once.

### Advanced
- Tic-Tac-Toe is fully solved: with correct play from both sides, every game ends in a draw. Against **Perfect**, treat every move as fork prevention rather than a hunt for a win you won't find.
- The tree is small enough to genuinely memorise — study the handful of forcing lines from each first move (centre, corner, edge) so you have a drawing response ready for anything Perfect can play.
- Use Easy and Medium as a sandbox for reading the AI itself. Watching exactly where a shallow search blunders builds real intuition for the minimax ideas behind every other bot in Games.
- If you get to move second against Perfect, know the two "safe" replies cold: centre in response to a corner or edge opening, and a corner in response to a centre opening — everything else risks a fork.
- Practice spotting a **double fork setup** two moves early — a piece placed so that *either* of your next two moves creates a fork is stronger than a move that only threatens one line right now.

## Traps & common mistakes

- Opening on an edge cell — it sits on the fewest winning lines and rarely leads anywhere.
- Winning-move tunnel vision: playing your own three-in-a-row instead of noticing your opponent already has one ready to complete.
- Missing a fork because you only checked for threats one move ahead instead of reading two moves out.
- Assuming Easy or Medium play like Perfect — they carry real randomness (a sizeable chance of a non-best move) and can be beaten outright.
- Blocking a threat with a mark that happens to hand your opponent a fork of their own — check the *whole* resulting board, not just the line you just closed.
- Treating a draw against Perfect as a failure. Against a fully solved opponent, a draw is the correct, expected result — the only real mistake is losing.
- Playing on autopilot against Easy or Medium — they're genuinely beatable, but only if you keep checking for forks and blocks instead of assuming the bot won't notice.

## A worked example

```
X holds the centre and one corner; O has blocked the obvious
three-in-a-row. X now plays the opposite corner: two open lines
now cross through X's marks at once, and O can only block one of
them. X wins next move no matter what O plays.
```

## Glossary

- **Fork** — a move that creates two simultaneous three-in-a-row threats at once.
- **Centre / corner / edge** — the three cell types, ranked by how many winning lines pass through them (four, three, and two respectively).
- **Solved game** — a game whose outcome under perfect play from both sides — here, a draw — is fully known.
- **Minimax** — the search technique behind every AI opponent in Games: assume both sides always play their best move, and score positions from there.

## Where to go next

If you like the "line them up" idea, **Connect Four** adds gravity and a bigger board, and **Gomoku** stretches the target to five in a row on a much larger grid. For a game built entirely around connection instead of lines, try **Hex**.
