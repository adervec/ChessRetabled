# Chess

> Two minds, sixteen pieces each, and no luck at all — the oldest strategy game still played the way it was meant to be.

**At a glance** · You vs a tunable engine · versus · 10–40 min · Play it under **Play** (`/play`), with tactics under **Puzzles**, courses under **Learn**, and endgame drills under **Practice**.

## What it is

Chess descends from the 6th-century Indian game *chaturanga*, reached Europe by way of Persia and the Arab world, and settled into its modern rules — the powerful queen, the two-square pawn jump, castling — in 15th-century Spain and Italy. It is a game of *perfect information*: nothing is hidden, nothing is random. Everything that happens on the board is a consequence of the two players' choices, which is exactly why it has been the benchmark for human and machine reasoning for five centuries.

The feel of chess is the tension between a long-term plan and a concrete calculation. You want to improve your worst piece and cramp your opponent — but on this move, right now, is that knight actually hanging?

## Goal

Deliver **checkmate**: attack the enemy king so that it is under threat of capture and has no legal way to escape. You never actually capture the king — the game ends the instant escape is impossible. Games also end in a **draw** by stalemate (no legal move but not in check), insufficient material, threefold repetition, or the fifty-move rule.

## The board & pieces

A chessboard is an 8×8 grid of alternating light and dark squares, oriented so each player has a light square in their right-hand corner ("light on right"). Each side starts with:

| Piece | Count | Moves | Rough value |
|-------|-------|-------|-------------|
| Pawn | 8 | Forward one (or two from start); captures diagonally | 1 |
| Knight | 2 | An "L": two-and-one; the only jumper | 3 |
| Bishop | 2 | Any distance diagonally | 3 |
| Rook | 2 | Any distance along ranks/files | 5 |
| Queen | 1 | Any distance straight or diagonal | 9 |
| King | 1 | One square any direction | — (priceless) |

Three special rules complete the set: **castling** (king and rook move together, tucking the king to safety), **en passant** (a pawn that jumps two squares can be captured as if it moved one), and **promotion** (a pawn reaching the far rank becomes any piece, almost always a queen).

## Rules

1. **White moves first**, then players alternate. You must move on your turn.
2. Each piece moves as above; you may not move a piece through another (except the knight, which jumps).
3. A move that captures replaces the enemy piece on its square.
4. **You may never leave your own king in check.** If you are in check, every legal move must resolve it — block, capture the attacker, or move the king.
5. **Castling** is legal only if neither the king nor that rook has moved, the squares between them are empty, and the king is not in check nor passes through an attacked square.
6. The game ends at checkmate (a win), or a draw by the conditions above.

## How it works in ChessRetabled

- **Opening a game.** Go to **Play** and pick a bot. Strength runs across a wide rating band; the engine is Stockfish 16 (NNUE) running in your browser. Weak bots deliberately add the occasional blunder so lower ratings feel human, not just shallow.
- **Making moves.** Click a piece to see its legal-move dots, then click a destination. Promotions prompt you for the piece. Pieces carry stable identities, so captures, castling and en passant animate smoothly instead of teleporting.
- **The 💡 hint.** Press **Hint** once for a *nudge* — the piece the engine would move is highlighted. Press again to *reveal* the full best move. Using a hint at all flags the game as **assisted** in your history, so your honest results stay separable from your helped ones.
- **The other four modes share one engine.** **Puzzles** are forced tactics derived by search (find the mate or the winning shot). **Learn** is a nine-course curriculum. **Practice** drills endgames and themes against the bot. Finished games in every mode are logged to your **Dashboard**, feeding your rating, streak, and the **AI Coach** at `/coach`.
- **Presentation.** Themes (Dusk/Pastel/Croanada) reskin the pieces and board; the 2.5D board can be tilted in Settings.

## Strategy

### Beginner — the opening principles
- **Control the centre.** Push a central pawn (1.e4 or 1.d4) so your pieces have range.
- **Develop knights and bishops** toward the centre before you move a piece twice.
- **Castle early**, usually by move 8–10, to connect rooks and shelter the king.
- **Don't hang pieces.** Before you release a piece, ask: "What does this attack, and what is now undefended?" Most beginner games are decided by pieces left *en prise* (free to take), not by deep plans.

### Intermediate — seeing the whole board
- **Count material and activity together.** A piece doing nothing is worth less than its point value; a rook on an open file is worth more.
- **Trade when ahead, complicate when behind.** Simplifying toward an endgame magnifies a material edge.
- **Look for tactics every move:** forks (one piece hits two), pins (a piece can't move without exposing a bigger one), skewers, and discovered attacks. Puzzles mode is pure tactics training for exactly this.
- **Pawn structure is the skeleton.** Doubled, isolated, and backward pawns are long-term weaknesses; passed pawns are long-term assets.

### Advanced — planning and endgames
- **Make a plan from the pawn structure.** The pawns tell you which side of the board to play on and which pieces are good (a bishop is bad when your own pawns are on its colour).
- **Prophylaxis:** ask what your opponent *wants*, and prevent it before pursuing your own idea.
- **Endgame technique wins points.** Know the square of the pawn, opposition with kings, the Lucena and Philidor rook endings, and that the king is a strong piece once queens are off. Practice mode drills these.

## Traps & common mistakes

- **Scholar's Mate.** Beware early queen-and-bishop attacks on f7/f2; develop a knight to defend rather than chasing the queen.
- **Moving the same piece repeatedly** in the opening while your other pieces sleep.
- **Grabbing pawns with the queen** early and getting it chased around, losing tempo.
- **Auto-recapturing.** When your opponent trades, check whether a *different* recapture (or an in-between move) is stronger.
- **Relaxing when ahead.** More won games are thrown away by a single unchecked blunder than are lost from an even position.

## A worked example

A famous mate in the shortest possible game, *Fool's Mate*, shows how fast king safety matters:

```
1. f3 e5
2. g4 Qh4#
```

White's two pawn moves open the diagonal to the king and never develop; Black's queen delivers checkmate on move two — the king has no escape, no block, and the queen can't be taken. The lesson: every tempo spent not developing or not guarding the king can be fatal.

## Glossary

- **Tempo** — a single move as a unit of time; "gaining a tempo" means making a useful move while forcing your opponent to react.
- **Fork** — one piece attacking two enemy pieces at once.
- **Pin** — a piece that cannot move because a more valuable piece sits behind it.
- **En prise** — a piece sitting undefended and free to capture.
- **Zugzwang** — a position where any move you make worsens it, yet you must move.
- **Fianchetto** — developing a bishop to the long diagonal (g2/b2 or g7/b7).

## Where to go next

If you like the calculation, try **Puzzles** and the tactics-heavy board game **Breakthrough**. If you like the long strategic squeeze, **Reversi** and **Nine Men's Morris** reward the same patient positional thinking.
