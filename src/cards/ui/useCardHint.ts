import { useCallback, useState } from "react";

/**
 * Progressive card-game hint. Stage 1 gives a coarse nudge (the kind of play),
 * stage 2 reveals the exact action. Requesting a hint at all marks the game
 * as assisted for the archive (`used` is sticky until resetUsed on a new deal).
 */
export function useCardHint<T>() {
  const [hint, setHint] = useState<{ value: T; stage: 1 | 2 } | null>(null);
  const [used, setUsed] = useState(false);

  const request = useCallback((compute: () => T | null) => {
    setUsed(true);
    setHint((h) => {
      if (h) return { ...h, stage: 2 };
      const v = compute();
      return v == null ? null : { value: v, stage: 1 };
    });
  }, []);

  const clear = useCallback(() => setHint(null), []);
  const resetUsed = useCallback(() => { setHint(null); setUsed(false); }, []);
  return { hint, used, request, clear, resetUsed };
}
