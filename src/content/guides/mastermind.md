# Mastermind

> No board, no board state — just a hidden code, and the black-and-white pegs that narrow it down one guess at a time.

**At a glance** · Solo · up to 10 guesses · 5–15 min · Play it under **Logic** (`/logic`).

## What it is

Mastermind is a code-breaking puzzle with no grid to look at — the app secretly picks a 4-peg code from 6 colours (colours may repeat) and you have 10 guesses to find it. After every guess you're told only how close you were, as counts of black and white pegs, never which positions were right. It's pure deduction under uncertainty: each guess is a probe as much as an attempt, and reading the feedback correctly is the whole game. The mechanics are simple, but the search space (1,296 possible codes) is large enough that undisciplined guessing burns through your ten tries fast.

## Goal

**Guess the secret 4-peg code exactly** — all four pegs the right colour in the right position — within 10 guesses.

## The grid & clues

There's no grid at all, just a code of length 4 chosen from 6 colours, with repeats allowed (so 6⁴ = 1,296 possible secrets). Your workspace is a stack of up to 10 guess rows; each submitted guess earns one line of feedback before the next row opens. There's no difficulty selector — every game uses the same code length, colour count, and guess limit, so the challenge is entirely in how efficiently you narrow the field.

## Rules

1. The app picks a secret code: 4 pegs, each one of 6 colours, repeats allowed.
2. You submit a guess: 4 pegs of your choosing.
3. Feedback is two counts:
   - **Black peg** — one for every guess peg that is the exact right colour in the exact right position.
   - **White peg** — one for every guess peg that is the right colour but the wrong position, counted so that each secret peg and each guess peg is only "claimed" once (duplicate colours don't get double credit).
4. Feedback never says **which** positions earned black or white — only the totals.
5. You have up to 10 guesses; matching all 4 pegs (4 black) on any guess wins immediately, and using all 10 without doing so loses, with the code then revealed.
6. Feedback pegs are never colour-coded to match your guess pegs — they're purely a count of black and a count of white, nothing more.

## How it works in ChessRetabled

- **Opening a game.** Under **Logic**, choose Mastermind — a fresh secret code is generated immediately; no difficulty choice, since the code length, colour count, and guess limit are fixed.
- **Guessing.** Tap colour swatches to build a 4-peg guess, then submit; the row locks in with black/white peg feedback shown beside it, and a new row opens for your next guess.
- **The 💡 hint.** Because the secret is known internally from the start, a hint never needs to solve anything. Press **Hint** for a nudge on your **current, in-progress guess** — the first slot where your guess doesn't yet match the secret highlights; press again to reveal, which fills that slot with the correct colour. (The hint only ever touches the guess you're actively building, not a past submitted row.) Using it marks the puzzle **assisted**.
- **Completion.** Both a win (code cracked) and a loss (10 guesses exhausted) log to your archive, with your guess count and outcome — Mastermind is one of the few Logic Lab puzzles that can end in a loss rather than just being left unfinished.

## Strategy

### Beginner — learn the palette first
- **Open with a two-and-two guess**, like AABB rather than four different colours — repeating colours in your opener extracts more information about *how many* of each colour are in the code, which single-colour guesses can't.
- **Track presence before position.** Early guesses should aim to learn which of the 6 colours appear in the code at all (and how many times), rather than trying to place any one peg correctly too soon.
- **A guess of all one colour is a pure counter.** Guessing AAAA and reading the black-peg count directly tells you exactly how many A's are in the secret — no ambiguity possible.
- **Don't repeat a guess you've already made.** It's tempting when stuck, but a repeated guess produces identical feedback and burns a turn for zero new information.

### Intermediate — isolate one peg at a time
- **Change one peg between guesses.** If two consecutive guesses differ in exactly one slot, any shift in the black-peg count is attributable entirely to that slot — a clean, unambiguous read.
- **Total pegs (black + white) tell you the colour overlap.** The sum of black and white pegs from a guess equals how many of the secret's colours (counting duplicates) your guess also contains — useful for bounding the code's colour makeup even before position is known.
- **Once you know the code's 4 colours, it becomes a pure ordering problem.** Swap two pegs between guesses and watch how the black count moves — a jump of +2 means you swapped two pegs into their correct spots at once.
- **Use elimination guesses for colours you haven't tested.** If two colours remain unaccounted for, a guess that isolates just one of them (even in the "wrong" slots) tells you definitively whether it belongs in the code.

### Advanced — minimise the worst case
- **Keep a mental pool of still-possible codes.** After each guess, discard every candidate code that wouldn't have produced the feedback you actually got — your next guess should be the one that splits the *remaining* pool as evenly as possible, not just the one that feels informative.
- **Don't waste your last guesses probing.** With only one or two guesses left, guess an actual surviving candidate rather than another exploratory pattern — you need a guess that can still win outright, not just narrow things further.
- **A probe guess needn't be a candidate itself.** Early on, guessing a code you already know is impossible can still be the most informative move, since its only purpose is to split the remaining pool — save "must be a real candidate" thinking for your final guesses.
- **This puzzle is always crackable well within the guess limit** by consistent, systematic elimination — if you're routinely running out of guesses, the leak is usually in tracking (miscounting duplicate-colour feedback), not in the strategy itself.

## Traps & common mistakes

- **Treating a white peg as a position hint.** It never tells you where the colour belongs — only that it exists somewhere else in the code.
- **Double-counting duplicate colours.** If your guess has two red pegs but the secret has only one, you can earn at most one black-or-white credit from red across both guess slots — not two.
- **Assuming the code has 4 distinct colours.** Colours can and do repeat in the secret; narrowing your candidate pool to "no duplicates" too early throws away valid solutions.
- **Reading feedback as tied to specific pegs.** The black/white counts are aggregate totals for the whole guess — there's no way to know from one guess alone *which* peg earned which colour of feedback.
- **Forgetting a prior guess's feedback once it's off-screen.** Every past row's feedback stays relevant to the candidate pool for the rest of the game — don't let an earlier constraint slip from consideration just because your most recent guess is more front-of-mind.

## A worked example

Working out feedback by hand, duplicates and all:

```
Secret: R Y B G
Guess:  R R B G

Position 1: R = R -> black.
Position 3: B = B -> black.
Position 4: G = G -> black.
Position 2: guess's R vs secret's Y -> no direct match.
  The secret's only R was already claimed by position
  1's black peg, so this second R has nothing left to
  match -- not even a white peg.

Result: 3 black, 0 white.
```

## Glossary

- **Black peg** — right colour, right position.
- **White peg** — right colour, wrong position (duplicate-safe: each secret and guess peg counts once).
- **Candidate pool** — the set of codes still consistent with every guess and its feedback so far.
- **Duplicate-safe counting** — the rule that prevents extra copies of an already-matched colour from earning extra credit.
- **Probe guess** — a guess made purely to gather information, not necessarily a code you believe could be the answer.

## Where to go next

Mastermind is the Logic Lab's one pure code-breaking game — for a similar taste of deduction from aggregate feedback rather than a visible board, there isn't a direct sibling here, but **Lights Out** and the **15-Puzzle** share its uncluttered, mechanics-over-clues feel if you want more of that register.
