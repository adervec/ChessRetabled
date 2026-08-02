# Durak

> There's no winner in Durak — only everyone who escaped, and the one poor soul still holding cards when the deck runs dry.

**At a glance** · You vs one AI rival · versus · 10–20 min a round · Play it under **Cards** (`/cards`).

## What it is

Durak ("fool" in Russian) is arguably the most-played card game in Russia and across much of the former Soviet Union — a game every household seems to know, usually learned before double-digit ages, and played everywhere from kitchen tables to long train journeys. It flips the usual card-game framing on its head: instead of racing to *win*, you're racing not to *lose*. There's no scoring, no hand ranking, no combinations to build — just a relentless back-and-forth of attack and defense that rewards reading exactly how much danger you're really in at any given moment.

## Goal

Empty your hand before the stock runs out and stay empty-handed after — or, once the stock is gone, simply get rid of every card in your hand before your opponent does. The last player still holding cards when the other has none is the **durak** (the fool). It's possible for both hands to empty at once, which is a draw.

## The deck & setup

A 36-card deck: ranks **6 through Ace** in all four suits (no 2–5). Each player is dealt **6 cards**. The next card is turned face-up as the **trump** and then slid to the bottom of the stock — so the trump suit is known from the start, but that exact card is the very last one anyone draws.

Rank order (weakest to strongest, standard suits): 6, 7, 8, 9, 10, Jack, Queen, King, Ace. A trump of any rank beats a non-trump of any rank; between two trumps, the higher rank wins as usual. With only 9 ranks per suit and 4 trumps of every rank floating around, hand-reading is tighter than in most trick games — there simply isn't much of the deck left to hide behind once a few rounds have passed.

## Rules

1. One player is the **attacker**, the other the **defender**. The attacker opens by playing any card face-up.
2. The defender must **beat** it: play a higher card of the *same suit*, or **any trump** (trump beats every non-trump regardless of rank; a higher trump beats a lower trump).
3. If the defender beats it, the attacker may **pile on** more cards — but only ranks that already appear somewhere on the table (either as an attack or a successful defense). This continues until the attacker stops, the table reaches **6 pairs**, or the defender's hand can't possibly cover any more cards.
4. If the defender beats every card laid against them, the attacker ends the bout (or has no more legal cards to add); the whole table is **discarded**, and the **defender becomes the new attacker**.
5. If the defender **can't or won't beat** a card, they **take** — picking up every card on the table into their hand. The attacker stays the attacker and opens a fresh bout.
6. After each bout, both players **draw back up to 6 cards** from the stock — the **attacker draws first**, then the defender. This means the defender who just took a pile draws last and often ends the round well below a full hand.
7. Once the stock is empty, no more drawing happens — players simply play out what's in their hands under the same attack/defend rules.
8. The first player to empty their hand is safe and out of danger. The other keeps playing (there's no one left to attack them, since it's two-handed) until they either also empty their hand (a **draw**) or are left holding cards with nothing left to do — that player is the **durak**.

## How it works in ChessRetabled

- **Opening a game.** Under **Cards**, choose Durak. The deck is **seeded**, so a round is reproducible, and every finished game is recorded to your history.
- **Attacking and defending.** Buttons offer exactly the legal moves for your role at that moment — cards you may attack or defend with, plus **Take** or **Done** when appropriate. The AI rival responds on a short, watchable delay so bouts stay readable.
- **The 💡 hint.** First press nudges you toward the idea (press the attack, or take the pile); second press reveals the exact card or action a strong policy would choose. Any hint marks the round **assisted** in your history.
- **Outcome & logging.** The round ends with a clear result — you escaped, your rival is the durak, or a draw — and it feeds your Dashboard.

## Strategy

### Beginner
- **Don't hoard trumps out of fear.** New players often refuse to spend trumps and get buried under a hand that's mostly trump by the time the stock runs out — trumps you never use are just dead weight if you're stuck holding them at the end.
- **Take the pile when the alternative is worse.** Taking isn't losing — it just means you stay the attacker's target a bit longer. Refusing to take by defending with your last good card can leave you defenseless the very next bout.
- **Count what you'd be defending against before you attack.** Piling on more cards than your opponent's hand size can cover is illegal anyway, but even legal piles that stretch their hand thin are exactly the point of attacking.
- **Prioritize getting rid of low, off-trump cards early.** They're the least flexible cards in your hand and the easiest to lose value on later.

### Intermediate — manage your trump curve
- **Defend with the cheapest legal card, not the safest-feeling one.** Beating a low attack with a high trump "to be safe" burns a valuable card on a cheap threat — save your strong trumps for when the attack is actually dangerous.
- **Track suits as they empty.** With only 9 ranks per suit, a suit can run out fast; once you know your opponent is out of a suit, any card of that suit you attack with is unbeatable except by trump.
- **Watch the draw order after you take.** Because the attacker draws first, a defender who just took a big pile refills last and often ends up short — plan your next few moves around having fewer cards than you'd like.
- **Attack with pairs when you can.** Laying two cards of a rank your opponent might also hold forces harder choices and thins your hand of clutter faster than single attacks.

### Advanced — play the endgame precisely
- **Once the stock is empty, every card is fully known-in-principle** — this is the phase where Durak stops being about resource management and becomes closer to a solvable puzzle. Count exactly what your opponent could still be holding based on what's been played and discarded.
- **Bait with mid-value cards to drain trump.** Forcing your opponent to spend a trump defending against a card they didn't need to worry about is a real, if slow, way to erode their options before the stock runs dry.
- **The last attacker into the empty-stock endgame often has the edge**, because piling on forces the defender to commit resources on your schedule. Try to be attacking, not defending, right as the stock empties.
- **Keep one flexible trump in reserve for the final few cards.** A single mid-rank trump held back can defend against almost anything your opponent has left once the deck is known.
- **Weigh a marginal "take" against the cards still in the stock.** Taking a small pile is much less costly early, while the stock can still refill your hand — the same take late in the round, with no more draws coming, is a much heavier commitment.

## Traps & common mistakes

- **Refusing to ever take a pile.** Stubbornly defending with your last usable cards to avoid "losing" a bout usually leaves you worse off a turn later.
- **Attacking with your best cards early.** A card that could win a bout later is wasted if it just gets easily beaten now — attack with the cheap stuff, keep the strong stuff to defend.
- **Losing track of which ranks are already "live" on the table.** The attacker can only pile on ranks that already appeared — misreading this either wastes a turn or misses a legal follow-up.
- **Not noticing when a suit is exhausted.** Playing a card of a suit your opponent can no longer match (short of trump) is a free, easy attack that's easy to miss under time pressure.
- **Forgetting who draws first after a bout.** Misjudging your own hand size going into the next bout can lead to attacking or defending with a thinner hand than you realize.
- **Treating every take as a disaster.** A pile taken early, while the stock still has cards left to refill you, costs far less than the same pile taken in the endgame.

## A worked example

```
Trump: Spades (S)
Attacker plays: 8 of Hearts
Defender's hand includes: 10♥, 6♠ (a trump), Queen♥

Options to beat 8♥:
  10♥  — same suit, higher rank. Beats it, costs a mid-value card.
  6♠   — trump beats any non-trump, but wastes a trump on a cheap threat.
  Q♥   — same suit, higher rank, but far too strong a card to spend here.

Correct defense: 10♥. It clears the attack cheaply and keeps both
the trump and the Queen in hand for a bout that actually needs them.

Later, the attacker piles on a second 8 (a rank already on the table —
legal). If your only remaining Heart is now gone, you must beat it with
a trump or take the whole table. This is exactly why the cheap defense
above mattered: spending 6♠ on the first 8 would have left you with
nothing but the Queen to answer the second one.
```

## Glossary

- **Attacker / defender** — the two roles each bout; the defender who fails to cover everything becomes the taker, not the next attacker.
- **Trump** — the suit shown at the deal; beats any card of any other suit.
- **Take** — the defender giving up on a bout and adding the whole table to their hand.
- **Durak** — "the fool"; whoever is still holding cards once the other player is empty-handed and the stock is gone.
- **Pile on** — the attacker adding further cards of ranks already present on the table, up to the defender's hand limit.

## Where to go next

For another trump-suit trick game with a very different feel — capturing points instead of just surviving — try **Briscola**. If you'd rather escape a table of open cards through arithmetic than combat, **Scopa** is worth a look.
