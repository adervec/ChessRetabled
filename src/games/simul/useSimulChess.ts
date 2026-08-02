import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChessGame } from "../../chess/useChessGame";
import { MinimaxEngine } from "../../engine/minimax";
import type { EngineLevel } from "../../engine/types";
import type { Color, Square } from "../../chess/types";
import { useSettings, aiThinkFloorMs } from "../../state/useSettings";

// A self-contained chess game for a simul slot. Uses a per-slot MinimaxEngine so
// many boards can run at once without contending on the single Stockfish worker.
// Auto-queens promotions (no dialog needed in a compact slot).
export function useSimulChess(humanColor: Color, level: EngineLevel) {
  const g = useChessGame();
  const engineRef = useRef<MinimaxEngine | null>(null);
  if (engineRef.current === null) engineRef.current = new MinimaxEngine();

  const [selected, setSelected] = useState<Square | null>(null);
  const [thinking, setThinking] = useState(false);
  const aiToken = useRef(0);
  const animSpeed = useSettings((s) => s.animSpeed);

  const isHumanTurn = !g.isGameOver && g.turn === humanColor && !thinking;

  const targets = useMemo<Square[]>(
    () => (selected ? g.legalMovesFrom(selected).map((m) => m.to) : []),
    [selected, g]
  );

  useEffect(() => {
    if (g.isGameOver || g.turn === humanColor) return;
    const token = ++aiToken.current;
    setThinking(true);
    const floor = aiThinkFloorMs(animSpeed);
    let moveTimer: ReturnType<typeof setTimeout> | undefined;
    const start = setTimeout(async () => {
      const t0 = Date.now();
      const best = await engineRef.current!.bestMove(g.fen, level);
      const wait = Math.max(0, floor - (Date.now() - t0));
      moveTimer = setTimeout(() => {
        if (token !== aiToken.current) return;
        setThinking(false);
        if (best) g.move({ from: best.from, to: best.to, promotion: best.promotion });
      }, wait);
    }, 30);
    return () => {
      clearTimeout(start);
      if (moveTimer) clearTimeout(moveTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.fen, g.turn, g.isGameOver, humanColor, animSpeed]);

  const onSquareClick = useCallback(
    (sq: Square) => {
      if (!isHumanTurn) return;
      if (selected) {
        const m = g.legalMovesFrom(selected).find((x) => x.to === sq);
        if (m) {
          g.move({ from: selected, to: sq, promotion: "q" });
          setSelected(null);
          return;
        }
        const own = g.placed.find((p) => p.square === sq && p.color === humanColor);
        setSelected(own ? sq : null);
        return;
      }
      const own = g.placed.find((p) => p.square === sq && p.color === humanColor);
      if (own) setSelected(sq);
    },
    [isHumanTurn, selected, g, humanColor]
  );

  return {
    game: g,
    selected,
    targets,
    thinking,
    isHumanTurn,
    onSquareClick,
  };
}
