import { useCallback, useRef } from "react";
import type { SolveEvent } from "../../review/logic.ts";

// Records what a solver actually did, entry by entry, so the review page can say
// more than "solved in 214 moves". Every puzzle already knows its own solution —
// the generator proved it unique — so correctness is free; the only thing that
// needs capturing is the sequence.
//
// Deliberately a ref rather than state: a solve log must never cause a re-render
// of a grid the player is typing into.

export type { SolveEvent };

export interface SolveLog {
  /** Record one entry. `solutionValue` is what that cell holds when solved. */
  record: (i: number, value: number | string, solutionValue: number | string, opts?: { hint?: boolean }) => void;
  /** The log so far, for handing to the archive when the puzzle is finished. */
  events: () => SolveEvent[];
  reset: () => void;
}

export function useSolveLog(): SolveLog {
  const events = useRef<SolveEvent[]>([]);
  /** What each cell last held, so we can tell a correction from a fresh guess. */
  const wasRight = useRef<Map<number, boolean>>(new Map());

  const record = useCallback(
    (i: number, value: number | string, solutionValue: number | string, opts?: { hint?: boolean }) => {
      const ok = String(value) === String(solutionValue);
      const undid = wasRight.current.get(i) === true;
      wasRight.current.set(i, ok);
      // A long solve is still bounded — 4000 entries is far more than any of
      // these puzzles can need, and keeps the archive record a sane size.
      if (events.current.length < 4000) {
        events.current.push({ i, v: value, ok, undid: undid || undefined, hint: opts?.hint || undefined });
      }
    },
    []
  );

  const list = useCallback(() => events.current.slice(), []);
  const reset = useCallback(() => {
    events.current = [];
    wasRight.current = new Map();
  }, []);

  return { record, events: list, reset };
}
