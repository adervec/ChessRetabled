// What happens when you walk away from a game.
//
// Two things get confused if you don't separate them: quitting a game you were
// playing, and closing something you opened by accident. Treating both as a loss
// punishes a misclick; treating neither as one makes every record meaningless,
// because a losing position can always be escaped by leaving.
//
// Pure and headless — scripts/validate-sessions.mjs drives it.

export type AbandonOutcome = "loss" | "abandoned" | "discard";

export interface AbandonVerdict {
  /** "loss" counts against you; "abandoned" is logged but not a defeat;
   *  "discard" means nothing happened worth recording. */
  outcome: AbandonOutcome;
  /** Shown to the player before they confirm, so the cost is never a surprise. */
  reason: string;
}

export interface AbandonInput {
  /** Moves the human has actually made. */
  moveCount: number;
  /** Wall-clock time with the game open. */
  elapsedMs: number;
  /** Versus games have an opponent to lose to; solo ones don't. */
  kind: "versus" | "solo";
  /** True when the game is already effectively lost — leaving changes nothing. */
  losing?: boolean;
}

/** Below both of these, nothing meaningful happened. */
export const ENGAGED_MOVES = 4;
export const ENGAGED_MS = 90_000;

/** Has the player actually started playing, as opposed to looking? */
export function isEngaged(input: Pick<AbandonInput, "moveCount" | "elapsedMs">): boolean {
  return input.moveCount >= ENGAGED_MOVES || input.elapsedMs >= ENGAGED_MS;
}

export function judgeAbandon(input: AbandonInput): AbandonVerdict {
  const engaged = isEngaged(input);

  if (!engaged) {
    return {
      outcome: "discard",
      reason:
        input.moveCount === 0
          ? "You haven't made a move — this won't be recorded at all."
          : `Only ${input.moveCount} move${input.moveCount === 1 ? "" : "s"} in. Closing this won't be recorded.`,
    };
  }

  // A puzzle has no opponent to lose to. An unfinished solve is unfinished, and
  // saying otherwise would make the win rate on solo games meaningless.
  if (input.kind === "solo") {
    return {
      outcome: "abandoned",
      reason: "This will be logged as an unfinished attempt. It won't count as a loss.",
    };
  }

  if (input.losing) {
    return {
      outcome: "loss",
      reason: "You're losing this one, so leaving counts as a resignation.",
    };
  }

  return {
    outcome: "loss",
    reason: "You're far enough in that leaving counts as a resignation.",
  };
}

/** One-line summary for the confirm button. */
export function abandonLabel(v: AbandonVerdict): string {
  if (v.outcome === "loss") return "Resign";
  if (v.outcome === "abandoned") return "Give up";
  return "Close";
}
