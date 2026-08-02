# Go Fish

> A children's game that hides a real memory puzzle: every rank you ask for tells your rival exactly what's in your hand — and vice versa.

**At a glance** · You vs AI · versus · 5–10 min a round · Play it under **Cards** (`/cards`).

## What it is

Go Fish is one of the oldest matching games taught to card-playing kids, a close cousin of Happy Families and Authors. There's no betting, no trump suit, no hidden strategy manual — just two players asking each other for cards and hoping for a hit. What keeps it interesting past the age of eight is the information game underneath: every question you ask reveals something about your own hand, and every answer (or refusal) narrows what your opponent might be holding. Played well, Go Fish is less "guess and hope" and more "deduce and strike." It's the same skill chess players call reading a position from the moves already played — you're never told what's in your rival's hand directly, only what their choices imply about it.

## Goal

Collect more **books** — all four cards of a single rank — than your rival by the time the ranks are claimed out.

## The deck & setup

A standard 52-card deck, no jokers. Two players: you and one AI rival. Each of you is dealt **7 cards**; the remaining **38 cards** form the **ocean** (the draw stock), face down between you.

## Rules

1. On your turn, ask your opponent for a specific **rank** — but only a rank you already hold at least one card of. You can't fish blind for something you don't have a piece of.
2. If your opponent holds any cards of that rank, they must hand over **every one** of them. Add them to your hand and **go again** — ask another rank, same turn.
3. If they hold none, you "**go fish**": draw the top card of the ocean.
   - Drawn the exact rank you asked for? Lucky — go again.
   - Anything else, and your turn ends and passes to your opponent.
4. The instant your hand holds all four cards of a rank, that rank is set aside as a completed **book** — this happens automatically, mid-turn or not.
5. If your hand ever empties on your turn, you draw a fresh card from the ocean to keep playing, so long as the ocean isn't empty too.
6. The round ends once all 13 books are claimed, or neither player can hold or draw another card. Most books wins; equal books is a tie.
7. It's possible, though rare, for the round to end by exhaustion — both hands and the ocean empty — before all 13 books are claimed. Whoever holds more books at that moment still wins; any ranks split unclaimed between the two hands simply go uncounted.

## How it works in ChessRetabled

- **Dealing.** Opened under **Cards**, the 52-card shoe is **seeded**, so every deal is reproducible, and every finished round is logged to your history and the Dashboard.
- **Asking.** Your rank buttons only ever show ranks you actually hold — you can't accidentally ask for something illegal.
- **The rival's memory.** The AI tracks every rank either of you has ever asked for as public information, then prefers to ask for a rank it knows you hold before falling back to whichever rank it holds the most copies of itself. It genuinely uses your own questions against you, so guard your asks.
- **The 💡 hint.** Stage one nudges you toward asking for a rank you hold several copies of; stage two names the exact rank — usually the one your rival is already known to be sitting on. Taking it marks the round **assisted** in your history.
- **Pacing.** The AI answers and asks on a short, watchable delay rather than instantly, so you can follow the exchange.

## Strategy

### Beginner
- **Ask for ranks you hold multiples of.** Asking with two 7s in hand costs you nothing extra if you miss, and rewards you double if you hit.
- **Take every free turn.** A successful ask lets you go again — always keep asking until you either fish or complete a book, never stop early.
- **Watch the ocean shrink.** With 38 cards, the odds of any specific rank being in your rival's hand versus the ocean shift as the game goes on; early asks are closer to a coin flip, late asks are closer to certain.
- **Don't be afraid to "waste" an ask.** Even a rank you only hold once is a legal, useful question — there's no penalty for asking beyond losing the turn on a miss.

### Intermediate
- **Track your own asks — your opponent will.** Every rank you ask for tells the AI (and a sharp human) that you hold at least one. That doesn't change what they can do, but it does shape how they read your hand for the rest of the game.
- **Remember what you were asked for.** If the AI asks you for 9s and you had none, you now know the remaining 9s are somewhere in the ocean or fully in the AI's hand — useful the moment you draw one.
- **Prioritize ranks close to a book.** Asking to turn a three-of-a-kind into a book is worth more than chasing a lone single, since it locks in points immediately.
- **Read a fished-and-matched turn as a tell.** If your rival's turn continues past a "go fish," it's because they happened to draw the exact rank they asked for — pure luck, not a sign they're tracking you especially well.

### Advanced
- **Count what's unaccounted for.** With 4 copies of each rank total, subtract what's in your hand, what's already booked, and what's been publicly revealed through asks — the remainder tells you the real odds a card is sitting in the ocean versus your rival's closed hand.
- **Use asks as information probes, not just card grabs.** Asking for a rank you only hold one of still tells you something about the world — a hit or a fish both update your model of the game, even on a round you're not favored to gain much from.
- **Play the endgame tightly.** As the ocean thins, hands become close to fully mirrored in public knowledge through prior asks and fishes; the last few books often come down to whoever draws the deciding card, so hold onto every earlier deduction instead of asking blind at the end.
- **Model your rival's asking policy.** The AI reaches first for any rank it already knows you hold, and only falls back to its own best-stocked rank when it has no known target — so a rival ask out of nowhere for a rank you've never revealed usually means it's guessing from its own hand strength, not from anything you gave away.

## Traps & common mistakes

- **Forgetting your own tells.** Asking for a rank announces you hold it — sloppy, repeated asks for the same rank telegraph your hand.
- **Ignoring the rival's asks.** The single biggest free information source in the game is what your opponent asks *you* for — many players tune it out entirely.
- **Treating a "go fish" draw as wasted.** Even a miss updates your knowledge of what's left in the ocean versus your rival's hand.
- **Chasing books you have no lead on.** Asking repeatedly for a rank you hold only one of, with no evidence your rival holds any either, burns turns better spent elsewhere.
- **Losing count of the ranks already booked.** There are only 13 ranks total — once several are claimed, the remaining live ranks are a much smaller, more predictable pool worth reasoning about explicitly.

## A worked example

```
Your hand has: 7♠ 7♦ K♣ K♥ 3♠ 9♦ 2♣
You ask: "Got any 7s?"
Rival has none → "Go fish."
You draw the top ocean card... it's a 7♣!
→ Rank matched — go again. Ask again: "Got any 7s?"
Rival now hands over the 7♥ → your 7s complete a book automatically.

You go again: "Got any Kings?" Rival hands over K♦ and K♠ — three Kings now,
one shy of a book. You ask a third time, but the rival holds none left to give
and no King turns up on the fish. Turn passes with the book still open.
```

## Glossary

- **Book** — all four cards of one rank, set aside as a scoring unit.
- **Ocean** — the face-down draw stock between the two hands.
- **Go fish** — the forced draw when your ask comes up empty.
- **Known rank** — a rank either player has publicly asked for, tracked as shared memory.
- **Exhaustion** — the round ending because neither hand nor the ocean has cards left, even with books still unclaimed.

## Where to go next

For more shared, gradually-revealed information, try **Old Maid**. For a purer memory test with no asking at all, **Memory** strips the game down to pure recall. If you'd rather build sets than collect them, **Gin Rummy** scratches a similar itch with hidden hands.
