import type { PieceSymbol, Square } from "../chess/types";

/** How to constrain engine strength for a given request. */
export type EngineLevel = {
  /** Stockfish "Skill Level" 0..20 (used for sub-master play). */
  skill?: number;
  /** UCI_Elo with UCI_LimitStrength (>= ~1320). Takes precedence over skill. */
  elo?: number;
  /** Hard search-depth cap. */
  depth?: number;
  /** Think time in milliseconds. */
  movetimeMs?: number;
};

export type EngineMove = {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  uci: string;
};

export type EvalScore = {
  /** centipawns from side-to-move's perspective (positive = better for mover). */
  cp?: number;
  /** mate in N (positive = mover mates, negative = mover gets mated). */
  mate?: number;
};

export interface ChessEngine {
  readonly name: string;
  init(): Promise<void>;
  ready(): boolean;
  bestMove(fen: string, level: EngineLevel): Promise<EngineMove | null>;
  evaluate(fen: string, opts?: { depth?: number; movetimeMs?: number }): Promise<EvalScore>;
  stop(): void;
  dispose(): void;
}

export function parseUci(uci: string): Omit<EngineMove, "uci"> | null {
  if (!uci || uci.length < 4 || uci === "(none)") return null;
  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  const promo = uci.length > 4 ? (uci[4] as PieceSymbol) : undefined;
  return { from, to, promotion: promo };
}
