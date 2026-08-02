# Surakarta

> A stone can vanish off one edge of the board and reappear, mid-slide, to strike from clear across it — the corner loops turn geometry into ambush.

**At a glance** · You vs the AI · versus · 15–25 min · Play it under **Games** (`/games`).

## What it is

Surakarta takes its name from the Javanese city where it's traditionally played, its board said to be carved right into the paving stones of the town square. It belongs to a small, distinctive family of games where the *board itself* — not a special piece — carries the trick: the outer and inner edges loop back on themselves, so a stone sliding off one side of the board can reappear on another line entirely and keep travelling until it finds something to hit.

The feel is patient and slightly hypnotic. Nothing captures at close range; danger arrives from across the board, along lines you have to trace in your head before you can trust a square is safe.

## Goal

Capture every one of your opponent's stones — or leave them with no legal move at all — to win.

## The board & pieces

Play on a 6×6 grid of 36 intersections. Each side starts with **12 stones**, filling the two rows nearest their own edge. The stones are identical; there is no promotion and no special piece.

## Rules

1. On your turn, move one stone either as an **ordinary step** to any adjacent empty point (all eight neighbours count) or as a **capture slide**.
2. A capture slides in a straight line — orthogonally only, never diagonally — through any number of empty points, curls around at least one corner **loop**, and keeps travelling until it reaches an occupied point. If that point holds an enemy stone, it is captured and your stone lands there.
3. If the line runs off the board with no loop present, meets one of your own stones, or loops all the way back to where it started without finding an enemy, that direction simply yields no capture.
4. Only the **outer** (border) lines and the **inner** (second-from-edge) lines carry loops. The two centre lines on each axis run straight off the edge and can never capture.
5. Capturing is optional — you may always play a quiet step instead, even with a capture on the board.
6. Capture every enemy stone, or leave your opponent with no legal move, to win.

| Line type | Carries a loop? | Can capture along it? |
|---|---|---|
| Outer (the two border lines per axis) | Yes — turns at the same corner | Yes |
| Inner (second-from-edge lines) | Yes — crosses to the partner line at that corner | Yes |
| Centre (the two middle lines per axis) | No | Never |

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Surakarta and a difficulty — **Easy / Medium / Hard**. Higher tiers search deeper (a shared alpha-beta engine with iterative deepening) and cut the randomness that lets Easy wander into blunders.
- **Making moves.** The board renders as 36 intersections joined by lines rather than square cells. Click one of your stones to light up every legal destination — ordinary steps and any loop captures it can reach — then click the target.
- **The 💡 hint.** Press once for a nudge (your strongest stone lights up); press again to reveal its exact destination. Any hint marks the game **assisted**.
- **Pacing.** The computer's reply is floored to at least one animation, so you can watch a capture curl round the loop before it lands. Captured stones drop into a graveyard beside the board; stones reskin per theme (Dusk/Pastel/Croanada).
- Finished games log their full move list to your archive, feeding the Dashboard.

| Difficulty | Search depth | Randomness | Feel |
|---|---|---|---|
| Easy | 2 ply | High | Takes obvious captures, misses long loop setups |
| Medium | 3 ply | Low | Reads one loop-capture ahead reliably |
| Hard | 4 ply | None | Plans blocker and lane-pressure sequences several moves out |

## Strategy

### Beginner
- Keep stones off the outer and inner lines when you can — those are the only lines a loop can turn a distant stone's slide onto. A stone sitting on one of the two centre lines of each axis can never be captured along that line.
- Don't chase every capture. Because capturing is optional, taking a stone that leaves your own line open behind it is often worse than the small material gain.
- Learn the loops by sight: each corner has one outer turn and one inner turn. A stone is in danger the moment it shares a straight line — through any number of empty points — with an enemy stone beyond one of those turns.
- Count material only after checking safety. A stone that wins a piece but leaves your own line wide open in return is rarely a good trade this early.

### Intermediate
- Use a friendly stone as a **blocker**: any occupied point stops a slide dead, so parking a stone in front of an exposed piece shields it from every capture line that has to pass through that point first.
- Build lane pressure by aiming two stones at the same loop from different lines, so your opponent can't parry both threats with a single move.
- Remember captures are orthogonal-only. A diagonal neighbour is safe from a straight-line slide, but it's still just one ordinary step away — don't mistake that for long-term safety.
- Trade blockers when you're ahead in stones, the same way you would in Checkers — fewer stones on the board means fewer lanes for the opponent's slides to hide behind.

### Advanced
- A slide can glide over the same empty point twice on its way around a loop, so a long "quiet" lane can be more dangerous than it looks — trace the whole path, not just the nearby squares.
- Sacrifice a blocker deliberately when removing it opens a loop capture elsewhere that nets more material overall.
- With few stones left, mobility outweighs material. A stone commanding two live lanes — one outer, one inner — is worth more than a passive extra piece sitting on a centre line.
- Read the position from your opponent's side too. Any lane that threatens their stone threatens yours the moment the turn passes, since the loops are symmetric for both colours.
- Late in the game, herd the last few enemy stones onto the centre lines where they have no capture threats at all, then close in with ordinary steps — you don't need loops to finish a lone, cornered stone.

## Traps & common mistakes

- Assuming a capture is forced, the way it is in Checkers or Fanorona — in Surakarta it never is, so look for a safer alternative before you commit.
- Retreating to a centre line and assuming total safety — it blocks captures along that line only; the stone is still one ordinary step from being surrounded.
- Sliding forward without checking where the loop actually deposits you — the geometry is symmetric, and your landing square can be someone else's ambush too.
- Mixing up outer and inner loops: outer loops turn at the same corner point, but inner loops cross over to the *other* line at that corner, not the one you'd expect.
- Treating an ordinary step as always safe — a purely developmental-looking step can still walk a stone onto a line the opponent already has aimed through a loop.
- Ignoring stones two or three lines away. Because a slide passes freely through empty points, "far" often means "one move," not "safe."
- Overcommitting your whole army to one side of the board — a slide needs a fully open lane, and cramming your own stones together blocks your own captures just as easily as your opponent's.

## A worked example

```
Red stone on the bottom-right column, heading north. It glides
up the empty column, curls through the outer loop at the
top-right corner, and continues left along the top row until it
meets Blue's stone — captured. One slide, one stone taken,
because the line never had to cross open board to get there.
```

## Glossary

- **Ordinary step** — moving one point to any adjacent empty intersection, in any of eight directions.
- **Capture slide** — a straight-line move that curls around a loop and removes the first enemy stone it meets.
- **Outer circuit** — the loops on the four border lines.
- **Inner circuit** — the loops one line in from the border.
- **Centre line** — the two loop-free lines through the middle of each axis; nothing captures along them.
- **Blocker** — a stone placed to stop an enemy slide from reaching further down a line.
- **Lane** — the line a capture slide travels along, including any loop it passes through.

## Where to go next

For more geometry-driven capture, try **Fanorona** and **Checkers**. If you enjoy the "trace the line before you trust the square" feel, **Kōnane** rewards the same kind of careful reading.
