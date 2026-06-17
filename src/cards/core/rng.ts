// Seeded pseudo-random number generator (mulberry32) + Fisher-Yates shuffle.
// Seeding keeps card games reproducible: a game is fully determined by its seed
// plus the sequence of moves, so it can be archived and replayed.

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  /** The seed this RNG was created from. */
  readonly seed: number;
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    seed,
    next,
    int: (n: number) => Math.floor(next() * n),
  };
}

/** Return a shuffled copy of `items` using `rng` (does not mutate the input). */
export function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A seed suitable for a new game (only used in the app, never in the harness). */
export function randomSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
}
