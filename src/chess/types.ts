import type { Color, PieceSymbol, Square } from "chess.js";

export type { Color, PieceSymbol, Square };

export type Orientation = "white" | "black";

export type BoardPiece = {
  square: Square;
  type: PieceSymbol;
  color: Color;
};

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** file index 0..7 (a..h) */
export function fileIndex(sq: Square): number {
  return sq.charCodeAt(0) - 97;
}
/** rank index 0..7 (rank1..rank8) */
export function rankIndex(sq: Square): number {
  return Number(sq[1]) - 1;
}

export function squareFrom(fileIdx: number, rankIdx: number): Square {
  return (FILES[fileIdx] + RANKS[rankIdx]) as Square;
}

/** true if the square is a light square */
export function isLightSquare(sq: Square): boolean {
  return (fileIndex(sq) + rankIndex(sq)) % 2 === 1;
}

/**
 * Display coordinates (col,row) with 0,0 at the top-left of the rendered board,
 * accounting for orientation. White orientation: a8 is top-left.
 */
export function displayCoords(
  sq: Square,
  orientation: Orientation
): { col: number; row: number } {
  const f = fileIndex(sq);
  const r = rankIndex(sq);
  if (orientation === "white") {
    return { col: f, row: 7 - r };
  }
  return { col: 7 - f, row: r };
}

export const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};

export type StaticPiece = {
  id: string;
  square: Square;
  type: PieceSymbol;
  color: Color;
};

/**
 * Parse the placement field of a FEN into pieces, WITHOUT chess.js validation —
 * so illustrative boards (e.g. a lone knight, no kings) can be rendered.
 */
export function fenToPlaced(fen: string): StaticPiece[] {
  const placement = fen.trim().split(/\s+/)[0];
  const rows = placement.split("/");
  const out: StaticPiece[] = [];
  let n = 0;
  for (let r = 0; r < rows.length && r < 8; r++) {
    const rankIdx = 7 - r; // FEN starts at rank 8
    let file = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) {
        file += Number(ch);
      } else {
        const color: Color = ch === ch.toUpperCase() ? "w" : "b";
        const type = ch.toLowerCase() as PieceSymbol;
        if (file < 8) {
          out.push({
            id: `s${n++}`,
            square: squareFrom(file, rankIdx),
            type,
            color,
          });
        }
        file += 1;
      }
    }
  }
  return out;
}

/** Rough material value, used for capture/eval helpers. */
export const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};
