// How a single move gets its label. Deliberately game-agnostic: every analyser
// converts its own units into one number — the share of winning chances the move
// gave up, 0 (gave up nothing) to 1 (threw the game) — and this file turns that
// into a verdict. Pure and headless (scripts/validate-review.mjs drives it).

export type MoveLabel =
  | "brilliant"
  | "best"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "forced"
  | "unrated";

export interface LabelMeta {
  icon: string;
  name: string;
  /** CSS token used for the chip colour. */
  tone: string;
  blurb: string;
}

export const LABEL_META: Record<MoveLabel, LabelMeta> = {
  brilliant: { icon: "!!", name: "Brilliant", tone: "var(--sky)", blurb: "The only move that holds, and it wins ground." },
  best: { icon: "★", name: "Best", tone: "var(--mint)", blurb: "Nothing available was better." },
  good: { icon: "✓", name: "Good", tone: "var(--mint)", blurb: "Keeps what you had." },
  inaccuracy: { icon: "?!", name: "Inaccuracy", tone: "var(--gold)", blurb: "Slightly loose — something clearly better existed." },
  mistake: { icon: "?", name: "Mistake", tone: "var(--coral)", blurb: "Hands over a real share of the position." },
  blunder: { icon: "??", name: "Blunder", tone: "var(--coral-dark, var(--coral))", blurb: "Throws away most of what you had." },
  forced: { icon: "=", name: "Forced", tone: "var(--text-muted)", blurb: "No choice — only one legal move." },
  unrated: { icon: "·", name: "Unrated", tone: "var(--text-muted)", blurb: "Not enough information to judge this one." },
};

export const LABEL_ORDER: MoveLabel[] = [
  "brilliant", "best", "good", "inaccuracy", "mistake", "blunder", "forced", "unrated",
];

/** Cut points on the "share of winning chances given up" scale. */
export const THRESHOLDS = {
  best: 0.02,
  good: 0.06,
  inaccuracy: 0.13,
  mistake: 0.25,
} as const;

export interface RateInput {
  /** Winning chances given up, 0..1. Values outside are clamped. */
  loss: number;
  /** The position offered no choice. */
  onlyMove?: boolean;
  /**
   * The move was the single best available AND every alternative was much
   * worse — the "you had to find it" case.
   */
  standout?: boolean;
  /** Analyser could not score this ply. */
  unknown?: boolean;
}

export function rateMove(input: RateInput): MoveLabel {
  if (input.unknown) return "unrated";
  if (input.onlyMove) return "forced";
  const loss = Math.min(1, Math.max(0, input.loss));
  if (loss <= THRESHOLDS.best) return input.standout ? "brilliant" : "best";
  if (loss <= THRESHOLDS.good) return "good";
  if (loss <= THRESHOLDS.inaccuracy) return "inaccuracy";
  if (loss <= THRESHOLDS.mistake) return "mistake";
  return "blunder";
}

/**
 * Centipawns → winning chances. The usual logistic with a 400-point scale, so a
 * +100cp edge reads as about 64%. Mate scores saturate.
 */
export function winChance(cp: number | undefined, mate?: number): number {
  if (mate !== undefined && mate !== 0) return mate > 0 ? 1 : 0;
  const c = cp ?? 0;
  return 1 / (1 + Math.pow(10, -c / 400));
}

/**
 * Board-game scores have no shared unit — one game's "+3" is another's "+300" —
 * so a move is judged against the spread of what was actually available in that
 * position. Losing half of the gap between the best and worst legal move costs
 * half your winning chances, by definition.
 */
export function relativeLoss(played: number, best: number, worst: number): number {
  const spread = best - worst;
  if (!(spread > 0)) return 0; // every move equal ⇒ nothing was given up
  return Math.min(1, Math.max(0, (best - played) / spread));
}

/** Below this share of the score magnitude, a position's moves are all the same. */
export const NOISE_FLOOR = 0.05;

export interface PositionalLossInput {
  /** Search score of the move played, from the mover's point of view. */
  played: number;
  best: number;
  worst: number;
  /** How many legal moves scored strictly better than the one played. */
  betterCount: number;
  /** How many moves were scored in total. */
  total: number;
}

/**
 * How much a board-game move gave up, 0..1.
 *
 * Magnitude alone is not enough. `(best - played) / (best - worst)` treats the
 * range as if every point in it mattered, so in a position where the worst legal
 * move is a catastrophe, a perfectly good move sitting a quarter of the way down
 * gets called a blunder — which is exactly what it did to the strongest AI's own
 * opening moves in Hex, Gomoku and Lines of Action.
 *
 * So a move is marked down only when it is BOTH ranked below the alternatives
 * AND materially worse than the best — and only when the position offered a real
 * choice at all. Taking the smaller of the two signals means a top-ranked move
 * survives a wide range, and a narrowly-worse move survives a crowded field.
 */
export function positionalLoss(input: PositionalLossInput): number {
  const { played, best, worst, betterCount, total } = input;
  const spread = best - worst;
  const scale = Math.max(Math.abs(best), Math.abs(worst), 1);

  // Nothing to choose between: every move scores the same, within noise.
  if (!(spread > 0) || spread < NOISE_FLOOR * scale) return 0;

  const magnitude = relativeLoss(played, best, worst);
  const rank = total > 1 ? Math.min(1, betterCount / (total - 1)) : 0;
  return Math.min(magnitude, rank);
}

export interface Tally {
  label: MoveLabel;
  count: number;
}

/** Counts per label, in display order, skipping labels that never occurred. */
export function tally(labels: MoveLabel[]): Tally[] {
  const counts = new Map<MoveLabel, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  return LABEL_ORDER.filter((l) => counts.has(l)).map((l) => ({ label: l, count: counts.get(l)! }));
}

/**
 * A 0–100 "accuracy" for a set of moves: the average winning chance retained,
 * counting only rated moves. Forced moves can't be got wrong, so they don't
 * flatter or punish the number.
 */
export function accuracy(losses: number[]): number {
  if (losses.length === 0) return 100;
  const kept = losses.reduce((a, l) => a + (1 - Math.min(1, Math.max(0, l))), 0);
  return Math.round((kept / losses.length) * 1000) / 10;
}
