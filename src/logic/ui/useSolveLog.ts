import { useCallback, useEffect, useRef } from "react";
import type { SolveEvent } from "../../review/logic.ts";

// Records what a solver actually did, entry by entry, so the review page can say
// more than "solved in 214 moves". Every puzzle already knows its own solution —
// the generator proved it unique — so correctness is free; the only thing that
// needs capturing is the sequence.
//
// Deliberately refs rather than state: a solve log must never re-render a grid
// somebody is typing into.

export type { SolveEvent };

export interface SolveLog {
  /** Record one entry. `solutionValue` is what that cell holds when solved. */
  record: (
    i: number,
    value: number | string,
    solutionValue: number | string,
    opts?: { hint?: boolean }
  ) => void;
  /** The log so far, for handing to the archive when the puzzle is finished. */
  events: () => SolveEvent[];
  reset: () => void;
}

const MAX_EVENTS = 4000;

export function useSolveLog(): SolveLog {
  const events = useRef<SolveEvent[]>([]);
  /** What each cell last held, so we can tell a correction from a fresh guess. */
  const wasRight = useRef<Map<number, boolean>>(new Map());

  const record = useCallback(
    (i: number, value: number | string, solutionValue: number | string, opts?: { hint?: boolean }) => {
      const ok = String(value) === String(solutionValue);
      const undid = wasRight.current.get(i) === true;
      wasRight.current.set(i, ok);
      if (events.current.length < MAX_EVENTS) {
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

/**
 * The same log, derived rather than declared.
 *
 * Most puzzles here keep their working in one array — cells, mask, shaded, sea,
 * stars — and every interaction is some `setX(prev => …)`. Watching that array
 * change catches every entry from one line in the component, instead of
 * threading a call through a dozen click handlers per puzzle and getting one of
 * them wrong.
 *
 * `solution` is the generator's proven-unique answer. When it lines up with the
 * working array, each change is scored against it; when it doesn't — the loop
 * and path puzzles keep their answer in a different shape entirely — entries are
 * still recorded, but marked unverifiable rather than guessed at.
 */
export function useSolveTrace<T>(
  current: readonly T[] | undefined,
  solution: readonly unknown[] | undefined
): SolveLog {
  const events = useRef<SolveEvent[]>([]);
  const wasRight = useRef<Map<number, boolean>>(new Map());
  const previous = useRef<readonly T[] | null>(null);

  const comparable =
    !!current && !!solution && Array.isArray(solution) && solution.length === current.length;

  useEffect(() => {
    if (!current) return;
    const before = previous.current;
    previous.current = current.slice();

    // First render, or the puzzle was replaced: nothing to diff against.
    if (!before || before.length !== current.length) {
      if (before && before.length !== current.length) {
        events.current = [];
        wasRight.current = new Map();
      }
      return;
    }

    for (let i = 0; i < current.length; i++) {
      if (Object.is(before[i], current[i])) continue;
      if (events.current.length >= MAX_EVENTS) break;

      if (!comparable) {
        events.current.push({ i, v: String(current[i]), ok: false, unknown: true });
        continue;
      }
      const ok = String(current[i]) === String(solution![i]);
      const undid = wasRight.current.get(i) === true;
      wasRight.current.set(i, ok);
      events.current.push({
        i,
        v: typeof current[i] === "number" ? (current[i] as number) : String(current[i]),
        ok,
        undid: undid || undefined,
      });
    }
  }, [current, solution, comparable]);

  const record = useCallback(() => {}, []);
  const list = useCallback(() => events.current.slice(), []);
  const reset = useCallback(() => {
    events.current = [];
    wasRight.current = new Map();
    previous.current = null;
  }, []);

  return { record, events: list, reset };
}
