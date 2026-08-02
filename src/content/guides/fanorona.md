# Fanorona

> Every stone you place is a tripwire — step toward a line of them or away from it, and the whole line falls at once.

**At a glance** · You vs the AI · versus · 15–25 min · Play it under **Games** (`/games`).

## What it is

Fanorona is Madagascar's national game, played on carved wooden boards and scratched into courtyard dirt alike, believed to descend from the wider Alquerque family of games that spread along Indian Ocean trade routes. What sets it apart from its relatives is its capture mechanic: a single step can sweep an entire line of enemy stones off the board, and a good stone keeps going, turning corner after corner in one forcing chain.

The feel is explosive compared to slower capture games. Positions that look balanced can collapse in a single compulsory move, so most of the real thinking happens *before* the capture — in how you shape your lines in the first place.

## Goal

Capture every one of your opponent's stones, or leave them with no legal move, to win.

## The board & pieces

Play on a 5×9 lattice of 45 intersections. Points where column+row is **even** are "strong" points and carry diagonal lines as well as orthogonal ones; all other points are "weak" and connect only up/down/left/right. Each side starts with **22 stones**, filling their two home rows plus half of the shared middle row — the middle row alternates by colour and leaves the very centre point empty, so the whole starting position is symmetric under a 180° turn.

## Rules

1. On your turn, move one stone a single point along a line — eight directions from a strong point, four (orthogonal only) from a weak one.
2. You capture by **approach** — stepping so the point immediately beyond your destination holds enemy stones — or by **withdrawal** — stepping so the point immediately behind your start, in the opposite direction, holds enemy stones. Either way, the *entire* unbroken run of enemy stones along that line is captured at once.
3. If a single step qualifies as both an approach and a withdrawal capture, you choose only one direction to actually take — never both in the same move.
4. Capturing is **compulsory**: if any stone you own has a capture available anywhere on the board, you must play one of them.
5. After capturing, that same stone may continue in a **chain**, provided each new leg heads in a direction it hasn't just used and lands on a point it hasn't already visited this turn.
6. With no capture available anywhere, you make a single quiet **paika** step to an empty neighbouring point instead.
7. Capture every enemy stone, or leave your opponent with no legal move, to win.

| Capture type | You step... | Enemy run taken |
|---|---|---|
| Approach | toward the enemy line | the stones just beyond your destination |
| Withdrawal | away from the enemy line | the stones just behind your starting point |

Both directions capture the *entire* unbroken run along that line, not just the nearest stone — a lone stone and a five-stone wall fall the same way.

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Fanorona and a difficulty — **Easy / Medium / Hard**. Higher tiers search deeper (a shared alpha-beta engine with iterative deepening) and cut the randomness that lets Easy wander into blunders.
- **Making moves.** The board renders as points and lines, with diagonals drawn only from strong points — if you can see a diagonal line through a point, that point can move and capture along it. Click a stone to light up its legal destinations. When any capture exists anywhere on the board, quiet paika moves simply don't appear in the highlights, matching the forced-capture rule.
- **Chains and choices.** A capturing stone highlights its next leg after each step; if a single move can capture in more than one valid way, a pick step lets you choose.
- **The 💡 hint.** Press once for a nudge (your strongest stone lights up); press again to reveal its exact move. Any hint marks the game **assisted**.
- **Pacing.** The computer's reply is floored to at least one animation. Captured stones drop into a graveyard beside the board; stones reskin per theme (Dusk/Pastel/Croanada). A 400-ply cap draws the rare game that runs long.
- Finished games log their full move list to your archive, feeding the Dashboard.

| Difficulty | Search depth | Randomness | Feel |
|---|---|---|---|
| Easy | 2 ply | High | Takes the first capture chain it finds |
| Medium | 3 ply | Low | Compares chains for the safer landing square |
| Hard | 5 ply | None | Plans forced-capture traps several moves out |

## Strategy

### Beginner
- Learn to spot strong points at a glance — anywhere column+row is even — since that's the only place a diagonal capture or chain leg exists.
- Captures are compulsory across your whole army, so you often can't develop quietly in the opening. Check for available captures before planning a paika move.
- Favour moves that threaten an approach or withdrawal line rather than moves that just occupy space. Fanorona rewards lines, not squares.
- Don't panic when a capture is forced — scan all of your capturing stones first; the compulsory move is often still the best one on the board, not a trap.

### Intermediate
- Any straight run of your own stones is a single capture waiting to happen for your opponent — spread out, or make sure the open end of the line is defended.
- When a step offers both an approach and a withdrawal capture, take the one that leaves your landing stone safer, not just the one that removes more material.
- Look past the first capture: since the chain can keep going, ask where it *ends* and whether that landing square is exposed.
- Keep at least one stone off every line your opponent could approach or withdraw along — a single defender interrupting the run limits the capture to nothing.

### Advanced
- Plan chains backward: decide where you want the capturing stone to finish, then check whether a legal no-repeat, no-revisit path actually reaches it.
- Use the forced-capture rule as a weapon — engineer positions where your opponent's *only* legal capture walks them straight into your counter-chain.
- In the endgame, a stone on a strong point commands twice the lines of one on a weak point; fight to keep your last few stones on strong points.
- Count material *and* mobility together. A slight material deficit is often worth it if it leaves you with more live capturing lines than your opponent has stones to defend them.
- When several captures are available, prefer the one that also denies your opponent's best reply next turn, even if a different chain would take one more stone right now.

## Traps & common mistakes

- Lining up three or more of your own stones on one open line — exactly the shape a single approach or withdrawal capture erases in one move.
- Forgetting captures are compulsory and trying to "just develop" — if a capture exists anywhere on the board, no quiet move will be offered at all.
- Repeating a chain's direction or revisiting a point out of Checkers-style habit — Fanorona explicitly forbids both, so a chain can end sooner than you expect.
- Underrating weak points. A stone stuck off the diagonal lattice has half the lines to escape along and is far easier to box in.
- Taking the biggest available capture on reflex instead of checking where the chain leaves your stone standing when it finally ends.
- Overlooking that a single approach step can double as a withdrawal step in the *opposite* direction — always check both readings of a move before you commit to one.
- Assuming the AI's turn ends the moment it captures — a chain keeps the same stone moving, so check whether it can still continue before you plan your reply.

## A worked example

```
Black steps onto a strong point, approaching a run of three
White stones in a row — all three vanish in one step. That same
stone, now on another strong point, turns 90° (a fresh
direction, no repeat) and withdraws away from a fourth White
stone lined up behind it — captured too. One turn, two capture
legs, four stones gone.
```

## Glossary

- **Strong point** — an intersection with diagonal lines (column+row even); a weak point has orthogonal lines only.
- **Approach** — capturing by stepping toward a line of enemy stones.
- **Withdrawal** — capturing by stepping away from a line of enemy stones.
- **Paika** — a quiet, non-capturing step, only legal when no capture exists anywhere.
- **Chain** — a sequence of captures by one stone in a single turn, with no repeated direction and no revisited point.
- **Compulsory capture** — the rule that forces you to play a capturing move whenever any of your stones has one available.

## Where to go next

For more forced-capture tactics, try **Checkers**. For a different flavour of line-based capture on a smaller board, **Surakarta** is the natural next stop, and **Kōnane** offers a third take on compulsory jumps.
