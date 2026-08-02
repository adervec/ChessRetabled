# Hex

> Nobody has ever drawn a game of Hex — the board's own geometry guarantees somebody always gets through.

**At a glance** · You vs the AI · versus · 15–25 min · Play it under **Games** (`/games`).

## What it is

Hex was invented twice, independently, within a few years — first by Piet Hein in Denmark in 1942 (who called it Polygon), then again by mathematician John Nash at Princeton in 1948, where students knew it simply as "Nash." It has been a touchstone of combinatorial game theory ever since, thanks to an elegant strategy-stealing proof that the first player can always force a win — a proof that says nothing at all about *what* that winning strategy actually is.

The feel is deceptively calm. There's no capturing, no urgency in any single move — until you realise the board is a tangle of hidden guaranteed connections, and half of them are already yours or your opponent's without either of you quite noticing.

## Goal

Link your two edges of the board with an unbroken chain of your own stones before your opponent links theirs.

## The board & pieces

Play on an 11×11 rhombus of hexagonal cells, rendered as points joined by lines — each interior cell touches six neighbours, with edge and corner cells touching fewer. **Blue** owns the top and bottom edges and is trying to connect them; **Red** owns the left and right edges. The four corner cells count toward both players' edges. Stones are all identical and, once placed, never move again.

## Rules

1. Players alternate turns, each placing one stone of their colour on any empty cell.
2. Blue wins by linking the top edge to the bottom edge with an unbroken chain of Blue stones, where neighbouring cells share one of six hexagonal sides.
3. Red wins by linking the left edge to the right edge with an unbroken chain of Red stones.
4. Stones never move and are never captured or removed once placed.
5. Because of how a hex grid tiles the board, one side finishing its connection makes the other side's connection mathematically impossible — Hex can never end in a draw.

| Difficulty | Search depth | Randomness | Feel |
|---|---|---|---|
| Easy | 1 ply | High | Reacts to your last move only; misses long-range threats |
| Medium | 2 ply | Moderate | Defends real bridges but can be out-planned |
| Hard | 3 ply | None | Reads connection distance precisely; punishes loose play |

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Hex and a difficulty — **Easy / Medium / Hard**. Higher tiers search deeper (a shared alpha-beta engine with iterative deepening) and cut the randomness that lets Easy wander into blunders.
- **Making moves.** Interaction here is "place": click any empty cell to drop your stone directly — there's no piece to select first, since nothing ever moves.
- **How the AI reads the board.** Rather than counting lines the way it does in other games, the engine measures connection distance toward each edge (an internal shortest-path search over open lanes), so even Easy tends to notice real threats — it just adds more randomness on top.
- **The 💡 hint.** Press once for a nudge (the general area the strongest move falls in is highlighted); press again to reveal the exact cell. Any hint marks the game **assisted**.
- **Pacing.** The computer's reply is floored to at least one animation. Stones reskin per theme (Dusk/Pastel/Croanada); there's no graveyard, since nothing is ever captured. Because Hex can't draw, every finished game logs a decisive winner to your archive.
- **No pie rule.** Real-world Hex tournaments often let the second player "swap" the first move to neutralise the first-player advantage; this version doesn't offer that, so playing first is a genuine edge, not a formality.

## Strategy

### Beginner
- Play near the centre first. A central stone threatens to extend toward both of your edges in more directions than an edge stone can, and it crowds your opponent's shortest paths too.
- Think in terms of your own two edges, not the whole board — you only need one continuous path, so don't spread stones thin trying to hold everywhere at once.
- Block your opponent's *shortest* path, not just any stone they place. A stone that isn't part of their fastest route often isn't worth answering right away.
- Resist filling in random cells far from both players' shapes. Every stone should either extend your own path or answer a specific enemy threat.

### Intermediate
- Learn the **bridge**: two of your stones two cells apart (hexagonally) with two empty connecting cells between them are safely linked — if your opponent takes one connector, you simply take the other. Chains of bridges are the backbone of fast, safe connections.
- Watch for **ladders**: a forced diagonal sequence of blocking moves. Know before you start one whether it actually reaches your edge or your opponent's — running an unfavourable ladder loses on the spot.
- Since there's no pie rule here, take your first move seriously whichever colour you're playing — a strong central opening stone is a real advantage from move one.
- A move placed at the midpoint of two of your existing stones often forms a bridge automatically — look for that shape before calculating a new plan from scratch.

### Advanced
- Value a move by how many independent bridges it preserves, not just its raw distance to your edge. A position with two ways to connect survives one block; a position with a single narrow path doesn't.
- Play "double-threat" stones that would complete two different bridge chains at once, so a single opposing reply can't answer both.
- In the endgame, count precisely: with a clean bridge ladder already running to your edge, you can often ignore a distant opposing threat entirely and simply finish your own connection first.
- Treat your opponent's stones as obstacles to route around, not targets — since nothing is ever captured, the only question that matters is whether your own path still has two independent ways through.
- Against Hard, resist the urge to react to every stone it plays near your path. Its evaluation weighs connection width as well as raw distance, so it sometimes plays a slower move that's actually building a second, harder-to-block route.

## Traps & common mistakes

- Chasing your opponent's stones around the board instead of building your own path — a straight, efficient route beats local skirmishing.
- Breaking your own bridge by playing an aggressive-looking stone that actually removes one of your two safe connectors.
- Opening in a corner or hard against an edge, where a stone sits on far fewer useful lines than one played centrally.
- Assuming a block stops a threat permanently — always check whether your opponent has a second, unblocked path before you relax.
- Playing too defensively for too long. Because Hex can't draw, purely reactive play still loses eventually — you need your own connection, not just a denial of theirs.
- Forgetting that blocking one of your opponent's cells can simultaneously help *your* own connection — look for moves that do double duty before playing a purely defensive one.
- Trusting a pair of stones as connected when they're actually a full cell apart with no genuine bridge shape between them — verify the exact two-cell pattern before you rely on it.

## A worked example

```
Blue plays two stones two cells apart, with an empty pair of
cells linking them — a bridge. Red can occupy only one of those
two linking cells per turn; Blue simply takes the other one, and
the bridge holds no matter what Red tries next.
```

## Glossary

- **Bridge** — two stones of the same colour with two empty, mutually-connecting cells between them; safe against any single block.
- **Ladder** — a forced diagonal sequence of blocking moves that either reaches an edge or fizzles out.
- **Edge set** — the row or column of cells a player is trying to link.
- **Connection distance** — the fewest empty cells a player still needs to fill to link their two edges.
- **Virtual connection** — a set of stones and empty cells guaranteed to connect no matter how the opponent plays; a bridge is the simplest example.

## Where to go next

For a different flavour of "connect, don't capture," try **Lines of Action**. If placement-based territory games appeal to you, **Gomoku** and **Reversi** each take the idea in their own direction.
