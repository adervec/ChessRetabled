import { makeRng } from "../cards/core/rng.ts";

// Mastermind: crack a hidden code of 4 pegs from 6 colours (repeats allowed).
// Feedback = black pegs (right colour, right spot) + white pegs (right colour,
// wrong spot). Pure functions so the solver/feedback are harness-testable.

export const CODE_LENGTH = 4;
export const COLORS = 6;
export const MAX_GUESSES = 10;

export type Code = number[]; // length 4, values 1..6

export interface Feedback {
  black: number;
  white: number;
}

export function feedback(guess: Code, secret: Code): Feedback {
  let black = 0;
  const gLeft: number[] = [];
  const sLeft: number[] = [];
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) black++;
    else {
      gLeft.push(guess[i]);
      sLeft.push(secret[i]);
    }
  }
  let white = 0;
  const counts = new Array(COLORS + 1).fill(0);
  for (const c of sLeft) counts[c]++;
  for (const c of gLeft) {
    if (counts[c] > 0) {
      white++;
      counts[c]--;
    }
  }
  return { black, white };
}

export function makeSecret(seed: number): Code {
  const rng = makeRng(seed);
  return Array.from({ length: CODE_LENGTH }, () => rng.int(COLORS) + 1);
}

/** Every possible code — used by the consistency solver. */
export function allCodes(): Code[] {
  const out: Code[] = [];
  const rec = (acc: number[]): void => {
    if (acc.length === CODE_LENGTH) {
      out.push(acc.slice());
      return;
    }
    for (let c = 1; c <= COLORS; c++) rec([...acc, c]);
  };
  rec([]);
  return out;
}

/** A guess consistent with all prior feedback (simple but effective solver). */
export function consistentGuess(history: { guess: Code; fb: Feedback }[], pool: Code[]): Code {
  const ok = pool.filter((cand) =>
    history.every((h) => {
      const f = feedback(h.guess, cand);
      return f.black === h.fb.black && f.white === h.fb.white;
    })
  );
  return ok[0] ?? pool[0];
}

export interface MMState {
  seed: number;
  secret: Code;
  guesses: { guess: Code; fb: Feedback }[];
  phase: "play" | "won" | "lost";
}

export function initMastermind(seed: number): MMState {
  return { seed, secret: makeSecret(seed), guesses: [], phase: "play" };
}

export function submitGuess(s: MMState, guess: Code): MMState {
  if (s.phase !== "play") return s;
  const fb = feedback(guess, s.secret);
  const guesses = [...s.guesses, { guess, fb }];
  const phase = fb.black === CODE_LENGTH ? "won" : guesses.length >= MAX_GUESSES ? "lost" : "play";
  return { ...s, guesses, phase };
}
