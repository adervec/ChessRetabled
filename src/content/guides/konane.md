# Kōnane

> A full board that only ever empties — every legal move is a capture, so the game is really a race to be the last one who still can.

**At a glance** · You vs the AI · versus · 10–20 min · Play it under **Games** (`/games`).

## What it is

Kōnane is traditional Hawaiian checkers, played for centuries with black lava stones and white coral on boards carved directly into rock — some ancient playing sites survive on the islands today. Unlike most abstract strategy games, Kōnane starts with the board completely full and spends the entire game emptying it. There's no such thing as a "quiet" move here: from the moment the opening two stones are lifted, every single turn is a capture.

The feel is unusually calm for a capture-only game — because captures aren't forced onto you by a rule, they're just the *only kind of move that exists*. The tension is entirely about running out of options before your opponent does.

## Goal

Be the player who can still make a legal jump when your opponent **cannot**. Running out of jumps on your turn loses immediately — there's no other way to win or lose.

## The board & pieces

An 8×8 board, but unlike checkers every one of the 64 squares starts occupied — stones alternate colour in a checkerboard pattern across the *entire* board, not just the dark squares.

## Rules

1. **Black opens the game** by lifting (removing) one of their own stones from one of eight legal opening points — the **four corners** or the **four centre squares**.
2. **White opens next**, lifting one of their own stones from a square **orthogonally adjacent** to the gap Black just made.
3. From here on, every move is a **jump**: hop orthogonally over an adjacent enemy stone into the empty square immediately beyond it, capturing the jumped stone. **No diagonal moves.**
4. You may **keep hopping in the same straight line** as part of a single turn, capturing another stone each time, for as long as the chain is available — but you're free to stop early at any point along that line rather than take the longest chain.
5. There are **no quiet moves** — if a jump exists, it's the only kind of move on the board; material is removed every single turn once play begins.
6. The first player who has **no legal jump** on their turn **loses**.

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Kōnane and a difficulty — **Easy / Medium / Hard**. All three share the same alpha-beta engine with iterative deepening; Hard searches eight ply deep with zero randomness, planning several jump exchanges ahead.
- **Making the opening lifts.** The first two moves (Black's opening lift, then White's adjacent lift) highlight the legal points directly — click one to remove that stone.
- **Making jumps.** From then on, click one of your stones to highlight every jump (and jump-chain length) it can make, then click the destination you want. Because a chain can be stopped early, shorter jumps are highlighted as separate legal options alongside the longest one — follow the dots to whichever landing square you choose.
- **The 💡 hint.** Press **Hint** for a nudge (the stone the strongest AI would jump is highlighted), press again to reveal the exact jump. Any hint marks the game **assisted** in your history and Dashboard.
- **The computer never snaps.** Its reply is floored to at least one animation, so you can watch each hop land. Captured stones fall into a graveyard beside the board; stones reskin per theme (Dusk/Pastel/Croanada).
- Finished games are logged with the full move list to your archive.

## Strategy

### Beginner
- **Mobility is everything, material is secondary.** Since the only losing condition is running out of jumps, keep counting how many jumps you and your opponent will have available *after* the position develops — not just who has more stones left.
- **Open toward the centre.** The centre opening squares tend to give both sides more room to manoeuvre than a corner opening.
- **Don't take the longest chain automatically.** Sometimes stopping a jump chain early leaves your stone in a much safer spot than finishing it — check where you land before committing.

### Intermediate
- **Watch for forced self-immobilisation.** A jump that captures a stone but leaves your own stone stranded with no further jumps available can quietly cost you the mobility race even though it looks like a "free" capture.
- **Deny jumps rather than just making them.** A move that removes an enemy stone your opponent needed as a jumping platform can be worth more than a move that just grabs material.
- **Keep your stones connected.** Isolated stones run out of jump partners fast; stones near other stones of either colour retain more options longer.

### Advanced
- **Think several exchanges ahead about who runs dry first.** Since the loss condition is purely "no legal jump," strong Kōnane play is really an exercise in counting down the mobility of both sides to the very end of the sequence.
- **Use chain-length choice as a tempo tool.** Deliberately under-jumping (stopping a chain short) can leave the board in a shape where your opponent's *only* reply feeds you an even bigger capture next turn.
- **Corners and edges dry up fastest.** Stones there have fewer jump directions to begin with, so the endgame usually narrows to a fight over the last mobile stones near the centre.

## Traps & common mistakes

- **Finishing every jump chain to the max length out of habit.** The longest jump isn't always the best landing square — check for follow-up traps before committing.
- **Forgetting jumps are orthogonal only.** New players used to checkers instinctively look for diagonal captures here; there are none.
- **Opening in a corner reflexively.** It's legal, but it tends to reduce your own future mobility more than a central opening does.
- **Not noticing you're down to your last jump.** Since there's no warning beyond the board state itself, it's easy to walk into a position with only one legal move left — and lose the turn after your opponent removes it.

## A worked example

Black has a stone that can jump a White stone, land, and then continue jumping a second White stone in the same straight line — but stopping after the first jump leaves Black's stone in a safer square than finishing the chain.

```
B w . w .        Black jumps the first w, landing on the dot,
    ↑             capturing it. Continuing the same line jumps
Two-jump line     the second w too — but the shorter, one-jump
available.        stop may be the safer choice this turn.
```

## Glossary

- **Lift** — the special opening move: removing your own stone without a jump (Black's first move, White's second).
- **Jump chain** — a sequence of captures made in one turn along the same straight line; you may stop at any point along it.
- **Mobility** — the number of legal jumps available to a player; the true currency of the game, since running out is the only way to lose.
- **Opening cell** — one of the eight points (four corners, four centre squares) Black may lift from to start the game.
- **Orthogonal** — up, down, left, or right only; Kōnane has no diagonal moves.

## Where to go next

For more forced-capture geometry with a different flavour, try **Checkers** (diagonal jumps, crowning) or **Fanorona** (chained approach-and-withdrawal captures). If you enjoy the pure "run out of moves and lose" tension, **Breakthrough** flips it into a race instead.
