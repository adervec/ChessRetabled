# Checkers

> Deceptively simple pieces, brutally sharp tactics — the game that a computer finally *solved* after 18 years of calculation.

**At a glance** · You vs the AI · versus · 5–15 min · Play it under **Games** (`/games`).

## What it is

Checkers — **English draughts**, played on an 8×8 board with twelve pieces a side — is one of the most-studied abstract games in history. In 2007 it became the largest game ever *solved*: with perfect play by both sides it is a **draw**. That fact is oddly encouraging. It means every loss you take is a real mistake you can learn from, and that the whole game lives in the tactics between here and the drawn endgame.

The feel is forcing. Captures are **compulsory**, so a good move is often one that hands your opponent a capture they *must* take — straight into a trap you've already seen.

## Goal

Leave your opponent with **no legal move** — either by capturing all their pieces or by blocking every one they have left. That is the win; a position neither side can win is a draw.

## The board & pieces

Play on the 32 dark squares of an 8×8 board. Each player starts with **12 men** on the three rows nearest them. Men move and capture **diagonally forward only**. A man that reaches the far row is **crowned a king**, which moves and captures diagonally in *both* directions.

## Rules

1. **Dark squares only**, moving one square diagonally forward into an empty square.
2. **Capturing is mandatory.** If a jump is available you must take it; if several are available you may choose which, but you must keep jumping with that piece as long as more jumps exist (**multi-jumps** are a single move).
3. You capture by jumping diagonally over an adjacent enemy piece into the empty square beyond it. Jumped pieces are removed after the move completes.
4. Reaching the last rank **crowns** a man into a king. If a man reaches the back rank by a jump and could jump again *only* as a king, the move ends there (the crowning stops the turn).
5. Kings jump forward and backward.
6. No legal move = you lose.

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Checkers and an AI difficulty — **Easy / Medium / Hard**. Higher tiers search deeper (the AI is a shared alpha-beta engine with iterative deepening) and play with less randomness.
- **Making moves.** Click one of your pieces to highlight its legal squares, then click the destination. Because captures are forced, only the legal (capturing) moves light up when a jump exists. Multi-jumps resolve as one move — follow the highlighted chain.
- **The 💡 hint.** Press **Hint** for a *nudge* (your piece to move is highlighted); press again to *reveal* the exact move. Any hint marks the game **assisted** in your history and Dashboard.
- **The computer never snaps.** Its reply is floored to at least one animation, so you can watch the jump land. Captured pieces drop into a graveyard beside the board.
- Finished games are logged with the full move list to your archive.

## Strategy

### Beginner
- **Keep your back row intact** as long as you can — it stops enemy men from crowning.
- **Advance in a connected phalanx**, not with lone runners. A supported man can't be safely jumped, because the recapture wins the exchange.
- **Trade when ahead.** Up a piece, swap pieces off; the fewer left, the more decisive your extra man.

### Intermediate
- **Count the exchange before you offer it.** Give up a man only when you jump back and come out even or ahead — or when the forced sequence wins material a few moves later.
- **Control the centre** (the two central files). Men on the edge attack fewer squares and are easy to immobilise.
- **The "trap" is the core tactic.** Move so your opponent's *mandatory* jump lands them where a bigger multi-jump of yours is waiting. Since they can't decline, you can calculate these lines with certainty.

### Advanced
- **First king usually wins the tempo battle.** Race to promote, but not by weakening your back rank while they're a move ahead.
- **Opposition and the move.** In king-and-man endings, whoever "has the move" (can force the other to give way) controls the key squares — the same idea as king opposition in chess.
- **Two kings beat one** almost always; drive a lone king to the edge and coordinate to trap it.

## Traps & common mistakes

- **Breaking the back row too early**, letting an enemy man stroll in to crown.
- **Greedy jumps.** The forced-capture rule cuts both ways: taking the piece you're *offered* can walk you into a multi-jump.
- **Edge hugging.** Pieces on the side rows are half as mobile and often become dead weight.
- **Forgetting kings go backward** and getting jumped from behind once the endgame opens up.

## A worked example

The simplest forced-capture trap: you advance a man your opponent *must* jump, and their landing square sets up your double.

```
You push a man to where Black's only jump is forced.
Black must jump  →  lands on a square your man now
double-jumps, taking two for one. Net: +1 piece.
```

The principle generalises: in checkers you rarely "take" a piece — you *arrange* for it, because the opponent's hand is forced.

## Glossary

- **Man** — an uncrowned piece, moving forward only.
- **King** — a crowned piece, moving both ways.
- **Multi-jump** — several captures chained in one turn; mandatory to complete.
- **Back row** — your home rank; keeping it slows enemy crowning.
- **The move / opposition** — having the tempo that forces your opponent to give ground.

## Where to go next

For more forced-capture geometry, try **Kōnane** and **Fanorona**. If you like racing pieces to the far side, **Breakthrough** scratches the same itch with different rules.
