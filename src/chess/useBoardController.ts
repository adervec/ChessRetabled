import { useCallback, useMemo, useState } from "react";
import type { Move as ChessMove } from "chess.js";
import type { Color, PieceSymbol, Square } from "./types";
import type { ChessGame } from "./useChessGame";

export type PendingPromotion = { from: Square; to: Square; color: Color };

export type BoardControllerOptions = {
  game: ChessGame;
  /** Return true if the piece on `from` may be picked up right now. */
  canMove?: (from: Square) => boolean;
  /** Called after a legal move is applied. */
  onMove?: (move: ChessMove) => void;
};

export function useBoardController({
  game,
  canMove,
  onMove,
}: BoardControllerOptions) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<PendingPromotion | null>(null);

  const targets = useMemo(() => {
    if (!selected) return [] as Square[];
    const moves = game.legalMovesFrom(selected);
    return Array.from(new Set(moves.map((m) => m.to)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, game.fen]);

  const clearSelection = useCallback(() => setSelected(null), []);

  const pieceColorAt = useCallback(
    (sq: Square): Color | null => {
      const p = game.placed.find((pp) => pp.square === sq);
      return p ? p.color : null;
    },
    [game.placed]
  );

  const allowed = useCallback(
    (sq: Square) => {
      const color = pieceColorAt(sq);
      if (!color) return false;
      if (game.isGameOver) return false;
      if (color !== game.turn) return false;
      return canMove ? canMove(sq) : true;
    },
    [pieceColorAt, game.isGameOver, game.turn, canMove]
  );

  const applyMove = useCallback(
    (from: Square, to: Square, promo?: PieceSymbol) => {
      const result = game.move({ from, to, promotion: promo });
      setSelected(null);
      setPromotion(null);
      if (result) onMove?.(result);
      return result;
    },
    [game, onMove]
  );

  const onSquareClick = useCallback(
    (sq: Square) => {
      if (promotion) return;

      if (selected) {
        if (sq === selected) {
          setSelected(null);
          return;
        }
        // is this a legal destination from the selected square?
        const moves = game.legalMovesFrom(selected);
        const matching = moves.filter((m) => m.to === sq);
        if (matching.length > 0) {
          const isPromotion = matching.some((m) => m.flags.includes("p"));
          if (isPromotion) {
            setPromotion({ from: selected, to: sq, color: game.turn });
          } else {
            applyMove(selected, sq);
          }
          return;
        }
        // otherwise: select another own piece, or clear
        if (allowed(sq)) setSelected(sq);
        else setSelected(null);
        return;
      }

      if (allowed(sq)) setSelected(sq);
    },
    [promotion, selected, game, allowed, applyMove]
  );

  const choosePromotion = useCallback(
    (type: PieceSymbol) => {
      if (!promotion) return;
      applyMove(promotion.from, promotion.to, type);
    },
    [promotion, applyMove]
  );

  const cancelPromotion = useCallback(() => {
    setPromotion(null);
    setSelected(null);
  }, []);

  return {
    selected,
    targets,
    onSquareClick,
    promotion,
    choosePromotion,
    cancelPromotion,
    clearSelection,
    setSelected,
  };
}
