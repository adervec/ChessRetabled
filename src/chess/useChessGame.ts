import { useCallback, useMemo, useRef, useState } from "react";
import { Chess, type Move as ChessMove } from "chess.js";
import {
  type Color,
  type PieceSymbol,
  type Square,
  START_FEN,
} from "./types";

export type PlacedPiece = {
  id: string;
  square: Square;
  type: PieceSymbol;
  color: Color;
};

export type SimpleMove = { from: Square; to: Square; promotion?: PieceSymbol };

export type GameResult = {
  over: boolean;
  winner: Color | null; // null on draw / not over
  reason:
    | "checkmate"
    | "stalemate"
    | "threefold"
    | "insufficient"
    | "fiftymove"
    | "draw"
    | null;
};

type IdMap = Record<string, string>;

let idCounter = 0;
const nextId = () => `p${idCounter++}`;

function freshIds(chess: Chess): IdMap {
  const ids: IdMap = {};
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell) ids[cell.square] = nextId();
    }
  }
  return ids;
}

function advanceIds(prev: IdMap, mv: ChessMove): IdMap {
  const ids: IdMap = { ...prev };
  const movingId = ids[mv.from] ?? nextId();
  delete ids[mv.from];

  if (mv.flags.includes("e")) {
    // en passant: captured pawn sits on (file of `to`, rank of `from`)
    const capSq = (mv.to[0] + mv.from[1]) as Square;
    delete ids[capSq];
  }
  ids[mv.to] = movingId;

  if (mv.flags.includes("k") || mv.flags.includes("q")) {
    const rank = mv.from[1];
    const kingside = mv.flags.includes("k");
    const rookFrom = ((kingside ? "h" : "a") + rank) as Square;
    const rookTo = ((kingside ? "f" : "d") + rank) as Square;
    const rid = ids[rookFrom] ?? nextId();
    delete ids[rookFrom];
    ids[rookTo] = rid;
  }
  return ids;
}

function findKing(chess: Chess, color: Color): Square | null {
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === "k" && cell.color === color) return cell.square;
    }
  }
  return null;
}

function computeResult(chess: Chess): GameResult {
  if (!chess.isGameOver()) return { over: false, winner: null, reason: null };
  if (chess.isCheckmate()) {
    // side to move is checkmated -> the other side won
    return {
      over: true,
      winner: chess.turn() === "w" ? "b" : "w",
      reason: "checkmate",
    };
  }
  if (chess.isStalemate())
    return { over: true, winner: null, reason: "stalemate" };
  if (chess.isThreefoldRepetition())
    return { over: true, winner: null, reason: "threefold" };
  if (chess.isInsufficientMaterial())
    return { over: true, winner: null, reason: "insufficient" };
  if (chess.isDraw()) return { over: true, winner: null, reason: "fiftymove" };
  return { over: true, winner: null, reason: "draw" };
}

export function useChessGame(initialFen: string = START_FEN) {
  const chessRef = useRef<Chess>(new Chess(initialFen));
  const [state, setState] = useState<{ fen: string; ids: IdMap }>(() => ({
    fen: chessRef.current.fen(),
    ids: freshIds(chessRef.current),
  }));
  const [lastMove, setLastMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const derived = useMemo(() => {
    const chess = chessRef.current;
    const placed: PlacedPiece[] = [];
    for (const row of chess.board()) {
      for (const cell of row) {
        if (cell) {
          placed.push({
            id: state.ids[cell.square] ?? nextId(),
            square: cell.square,
            type: cell.type,
            color: cell.color,
          });
        }
      }
    }
    const turn = chess.turn();
    const inCheck = chess.inCheck();
    const result = computeResult(chess);
    return {
      placed,
      turn,
      inCheck,
      checkSquare: inCheck ? findKing(chess, turn) : null,
      result,
      isGameOver: result.over,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const legalMovesFrom = useCallback(
    (sq: Square): ChessMove[] => {
      return chessRef.current.moves({ square: sq, verbose: true }) as ChessMove[];
    },
    []
  );

  const move = useCallback((m: SimpleMove): ChessMove | null => {
    const chess = chessRef.current;
    let result: ChessMove | null = null;
    try {
      result = chess.move({
        from: m.from,
        to: m.to,
        promotion: m.promotion ?? "q",
      });
    } catch {
      return null;
    }
    if (!result) return null;
    setState((prev) => ({
      fen: chess.fen(),
      ids: advanceIds(prev.ids, result as ChessMove),
    }));
    setLastMove({ from: result.from, to: result.to });
    return result;
  }, []);

  const undo = useCallback(() => {
    const chess = chessRef.current;
    const undone = chess.undo();
    if (!undone) return null;
    setState({ fen: chess.fen(), ids: freshIds(chess) });
    const hist = chess.history({ verbose: true }) as ChessMove[];
    const prev = hist[hist.length - 1];
    setLastMove(prev ? { from: prev.from, to: prev.to } : null);
    return undone;
  }, []);

  const reset = useCallback((fen: string = START_FEN) => {
    chessRef.current = new Chess(fen);
    setState({ fen: chessRef.current.fen(), ids: freshIds(chessRef.current) });
    setLastMove(null);
  }, []);

  const getChess = useCallback(() => chessRef.current, []);

  const history = useCallback(
    () => chessRef.current.history({ verbose: true }) as ChessMove[],
    // re-evaluate when position changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return {
    fen: state.fen,
    placed: derived.placed,
    turn: derived.turn,
    inCheck: derived.inCheck,
    checkSquare: derived.checkSquare,
    result: derived.result,
    isGameOver: derived.isGameOver,
    lastMove,
    legalMovesFrom,
    move,
    undo,
    reset,
    getChess,
    history,
  };
}

export type ChessGame = ReturnType<typeof useChessGame>;
