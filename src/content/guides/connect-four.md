# Connect Four

> A children's toy that hides a solved game underneath — the first player wins with perfect play, and the whole fight is over who finds the winning column first.

**At a glance** · You vs the AI · versus · 5–10 min · Play it under **Games** (`/games`).

## What it is

Connect Four has been a fixture of toy aisles since Milton Bradley released it in 1974, but it's also a landmark in game theory: in 1988 it was proven that the first player wins with perfect play by starting in the centre column. That doesn't make it boring — it makes it sharp. Because gravity does the placing for you, every move commits a disc to a column whose consequences ripple upward for the rest of the game.

The feel is fast and visual: threats stack in plain sight, but a "double threat" — two ways to win at once — can appear from a quiet-looking position in a single move.

## Goal

Be the first to connect **four of your own discs in an unbroken line** — horizontal, vertical, or diagonal — anywhere on the grid.

## The board & pieces

A standing grid, **7 columns wide and 6 rows tall** (42 cells). Discs are dropped in from the top of a column and fall to the lowest open slot in it — you never choose a row directly, only a column.

## Rules

1. **Red moves first**, alternating with Yellow.
2. On your turn, choose a column. Your disc falls to the **lowest empty slot** in that column.
3. A column with no empty slots left cannot be chosen.
4. The first player to line up **four discs of their colour** — in a row, a column, or either diagonal — wins immediately.
5. If the grid fills completely with no four-in-a-row for either side, the game is a **draw**.

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Connect Four and a difficulty — **Easy / Medium / Hard**. All three share the same alpha-beta engine with iterative deepening; Hard searches eight ply with zero randomness, so it reliably spots forced wins and blocks your threats well in advance.
- **Making moves.** Click any column to drop your disc — the whole column highlights as clickable when a slot is open, and the disc animates falling to its resting row.
- **The 💡 hint.** Press **Hint** for a nudge (the column the strongest AI would play is highlighted), press again to reveal the exact drop. Any hint marks the game **assisted** in your history and Dashboard.
- **The computer never snaps.** Its reply is floored to at least one animation, so you can watch the disc fall before you plan your response. Discs reskin per theme (Dusk/Pastel/Croanada) but always render as the same red/yellow pair per game.
- Finished games are logged with the full move list to your archive.

## Strategy

### Beginner
- **Start and stay central.** The centre column touches more possible four-in-a-rows than any other; a strong centre presence pays off in every direction.
- **Always scan for an immediate win before anything else** — yours first, then your opponent's. A missed forced win, or a missed forced block, ends games instantly.
- **Watch diagonals.** New players track rows and columns instinctively but miss diagonal threats building quietly across the board.

### Intermediate
- **Count "odd" and "even" threats.** Because discs stack from the bottom, a winning square in a given column only becomes reachable once the slots below it fill. Threats on odd rows favour one side, even rows the other — track which rows your open threats sit on.
- **Avoid building winning squares directly under your opponent's threat.** If you fill the slot beneath a row your opponent needs, you're handing it to them for free on your very next move.
- **Create a double threat.** Two different columns that would each complete four-in-a-row on your *next* move can't both be blocked — that's the standard way games get decided.

### Advanced
- **Play for zugzwang in the lower rows.** In tight positions, forcing your opponent to fill a column against their will (because every other column is worse) can hand you the exact square you need.
- **Claimeven and baseinverse are real endgame techniques.** Proven Connect Four theory pairs up rows so that whichever player is forced to play the lower square of a pair, the other claims the upper one — useful for reasoning out drawn or lost positions well before the board fills.
- **Sacrifice tempo, not threats.** When no immediate win exists, prefer moves that don't create a takeable square for your opponent over moves that build your own long-term threats — safety first, then offense.

## Traps & common mistakes

- **Playing on the edge columns early.** Columns 1 and 7 participate in far fewer possible lines than the centre — a slow start there rarely pays off.
- **Missing a diagonal threat.** It's the single most common way to lose unexpectedly — three discs on a diagonal are easy to overlook next to the more visible rows and columns.
- **Filling in the square just below an opponent's winning row.** This "sets the table" for them — always check what you're creating underneath a threat before you play there.
- **Ignoring a double threat until it's too late.** By the time two winning columns are open simultaneously, blocking is no longer possible — the fix is to prevent the *setup* move, not the follow-through.

## A worked example

Yellow has three discs stacked diagonally with an open landing square beneath the fourth spot. Red must either take that column immediately or lose next move — but taking it fills the very slot Yellow needed, so Red is forced elsewhere and Yellow wins on the following drop.

```
. . . . . . .
. . . y . . .
. . y r . . .
. y r r . . .
y r r r . . .        Yellow drops in column 4 (0-indexed 3):
                      completes the diagonal, four in a row, game over.
```

## Glossary

- **Threat** — a column where dropping a disc completes four-in-a-row.
- **Double threat** — two simultaneous threats that can't both be blocked with one move.
- **Odd/even threat** — a threat square classified by which row it sits on, since gravity determines when it becomes reachable.
- **Zugzwang** — being forced to move when every available column makes your position worse.
- **Claimeven** — an endgame pairing technique: whichever player takes the bottom square of a paired column, the opponent gets to claim the top.

## Where to go next

For more line-forming tactics without gravity's constraint, try **Gomoku** on its open 15×15 grid, or **Tic-Tac-Toe** for the same idea distilled to its smallest possible form. **Nine Men's Morris** offers a different flavour of line-forming, where completed lines capture pieces instead of winning outright.
