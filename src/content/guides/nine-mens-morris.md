# Nine Men's Morris

> Three nested squares, sixteen lines, and a slow-burn fight where the winning move is often the mill you form for the *second* time.

**At a glance** · You vs the AI · versus · 15–25 min · Play it under **Games** (`/games`).

## What it is

Nine Men's Morris is genuinely ancient — boards for it have been carved into Egyptian temple roofs and Bronze Age sites across Europe and Asia, making it one of the oldest games still played in something close to its original form. It survived because the idea is elegant: no dice, no hidden information, and a board simple enough to scratch into stone, yet deep enough to reward real planning.

The feel changes completely across its three phases. Placement is a quiet land-grab. The slide phase, once every piece is down, turns tactical fast — a "swinging mill" that opens and closes on repeat can grind an opponent's army down piece by piece. And once either side is reduced to three men, the board opens up entirely as that side starts "flying."

## Goal

Reduce your opponent to **fewer than three men**, or leave them with **no legal move** on their turn. Either one ends the game immediately in your favour.

## The board & pieces

Three nested squares — outer, middle, inner — connected by four lines running from the middle of each outer edge straight through to the corresponding middle of the inner square. That gives **24 points** total and **16 possible mill lines** (four along each of the three squares, plus the four connecting lines). Each player has **nine men**.

## Rules

1. **Phase 1 — Placing.** Players alternate placing one man at a time on any empty point until both sides have placed all nine.
2. **Forming a mill.** Whenever three of your men land in a row along one of the 16 marked lines — during placing *or* sliding — you immediately **remove one enemy man** from the board.
3. **Protected mills.** You may not remove a man that is currently part of one of your opponent's own mills — *unless* every one of their remaining men is inside a mill, in which case any of them is fair game.
4. **Phase 2 — Sliding.** Once both sides have placed all nine men, turns become: slide one of your men along a line to an **adjacent empty point**. You may re-form a mill by breaking one open and sliding back into it — this "swinging mill" can repeat and capture every time it closes.
5. **Phase 3 — Flying.** The moment a player is reduced to exactly **three men**, that player may move any of their men to **any empty point** on the board, not just an adjacent one, for the rest of the game.
6. **Winning.** Reduce your opponent below three men, or leave them with no legal move on their turn, and you win.
7. **Draw by inactivity.** Once both sides have placed all their men, if the movement phase goes a long stretch with no mill formed, the game is called a draw.

## How it works in ChessRetabled

- **Opening a game.** Under **Games**, choose Nine Men's Morris and a difficulty — **Easy / Medium / Hard**. All three share the same alpha-beta engine with iterative deepening; Hard searches six ply deep with zero randomness and plans several moves into a swinging-mill sequence.
- **Making moves.** During placement, click any empty point to drop a man. Once both sides have placed all nine, the interaction switches automatically: click one of your men to highlight its legal destinations, then click the target.
- **Forming a mill.** The moment your move completes a line of three, a capture-pick step appears — click the enemy man you want to remove from the highlighted (legal) targets.
- **The 💡 hint.** Press **Hint** for a nudge (the point or piece the strongest AI would play is highlighted), press again to reveal the exact move. Any hint marks the game **assisted** in your history and Dashboard.
- **The computer never snaps.** Its reply is floored to at least one animation. Captured men fall into a graveyard beside the board; pieces reskin per theme (Dusk/Pastel/Croanada) but the board's three-square geometry never changes.
- Finished games are logged with the full move list to your archive.

## Strategy

### Beginner
- **Don't rush a mill during placement.** An early mill only removes one man, but it also tips your hand — spread your placements to keep multiple mill threats alive at once.
- **Favour the T-junction points** (the midpoints where a cross-line meets a square), since they touch more lines and give you more mobility once sliding starts.
- **Watch what you're setting up for your opponent.** Every point you occupy also blocks — or opens — lines for the other side; think both ways before you place.

### Intermediate
- **Build a "double mill" threat.** A man positioned so it can slide into either of two different completed lines forces your opponent to choose which one to block — they can only stop one.
- **The swinging mill is the core engine of the mid-game.** Set up a configuration where you can open a mill and close it again on your very next move, capturing every time it closes, and your opponent can't stop the cycle without giving something else up.
- **Guard against getting flown on.** Once an opponent hits three men, ordinary "adjacent only" defence stops working — they can land anywhere, so keep your mill lines covered rather than relying on distance.

### Advanced
- **Sacrifice placement tempo for structure.** A slightly worse placement that sets up a guaranteed double mill in the sliding phase often outweighs grabbing an extra capture right now.
- **Force your opponent into all-mill material.** If you can manoeuvre so every one of their remaining men sits inside a mill, your next capture is unrestricted — pick off whichever one hurts them most.
- **Racing to three men isn't always good for the flyer.** Flying gives huge mobility, but if your opponent already has a strong mill network, you may be flying straight into repeated captures rather than out of trouble.

## Traps & common mistakes

- **Over-committing to one mill early.** A single obvious mill is easy to guard against; two threats at once are what actually win material.
- **Ignoring the connecting lines.** New players fixate on the three squares and forget the four spokes joining them — those points and lines matter just as much.
- **Letting a swinging mill go unanswered.** If you can't block it, you need to either threaten a mill of your own or accept the material trade and race elsewhere.
- **Forgetting the "all in mills" exception.** If all your remaining men are inside mills, none of them are safe — plan your structure so you're never fully locked in.

## A worked example

Blue has a man on the shared point of two different mill lines and slides it out of a completed mill, then back in on the following turn — capturing once on the way out and again on the way back, without the opponent able to block both closures.

```
Mill A: [ B  B  . ]   Blue slides the shared man OUT of mill A
Mill B: [ .  B  B ]   into the empty slot of mill B — completing
                       mill B and capturing. Next turn it slides
                       back, re-forming mill A, capturing again.
```

## Glossary

- **Mill** — three of your men in an unbroken line along one of the 16 marked lines; forming one lets you remove an enemy man.
- **Swinging mill** — a man that can slide out of one mill and back in (or between two mills) repeatedly, capturing each time it closes.
- **Flying** — once reduced to three men, the ability to move to any empty point rather than only an adjacent one.
- **Double mill threat** — a position where a single move threatens to complete either of two separate mills, which can't both be blocked.
- **Placement phase / sliding phase** — the two main stages of the game, separated by both sides finishing their nine placements.

## Where to go next

For another line-formation game where completing a shape captures rather than wins outright, this is the genre-definer — but **Fanorona** offers a different, chain-capture take on African-tradition board games. For a more direct forced-capture fight, **Checkers** is the classic comparison.
