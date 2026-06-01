import type { Color } from "../chess/types";
import type { EngineLevel } from "../engine/types";

export type Drill = {
  id: string;
  title: string;
  icon: string;
  accent: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  fen: string;
  humanColor: Color;
  goal: "checkmate" | "promote";
  level: EngineLevel; // how the defender plays
  tip: string;
};

export const DRILLS: Drill[] = [
  {
    id: "two-rooks",
    title: "Two Rooks vs King",
    icon: "🏰",
    accent: "var(--gold)",
    difficulty: "Easy",
    description:
      "The friendliest checkmate. Roll the king to the edge with your two rooks.",
    fen: "4k3/8/8/8/8/8/8/1R3RK1 w - - 0 1",
    humanColor: "w",
    goal: "checkmate",
    level: { elo: 1500, movetimeMs: 300 },
    tip: "Use one rook to fence off a rank, then check with the other. Keep rooks far from the enemy king so it can't attack them.",
  },
  {
    id: "queen-king",
    title: "Queen vs King",
    icon: "👑",
    accent: "var(--violet)",
    difficulty: "Medium",
    description:
      "Mate with king and queen. Box the king in — but beware stalemate!",
    fen: "4k3/8/8/8/8/8/8/3QK3 w - - 0 1",
    humanColor: "w",
    goal: "checkmate",
    level: { elo: 1700, movetimeMs: 400 },
    tip: "Keep the queen a knight's-move away to shepherd the king to the edge, then bring your own king up to deliver mate. Don't stalemate!",
  },
  {
    id: "rook-king",
    title: "Rook vs King",
    icon: "♜",
    accent: "var(--sky)",
    difficulty: "Hard",
    description:
      "The classic technique. Use your king and rook together to force mate on the edge.",
    fen: "4k3/8/8/8/8/8/8/4K2R w - - 0 1",
    humanColor: "w",
    goal: "checkmate",
    level: { elo: 1800, movetimeMs: 500 },
    tip: "Build a 'box' with your rook and march your king up to take the opposition. Mate comes on the edge of the board.",
  },
  {
    id: "king-pawn",
    title: "King & Pawn",
    icon: "♟",
    accent: "var(--mint)",
    difficulty: "Hard",
    description:
      "Promote your pawn against a lone king. It all comes down to the opposition.",
    fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    humanColor: "w",
    goal: "promote",
    level: { elo: 1800, movetimeMs: 500 },
    tip: "Keep your king in front of the pawn and seize the opposition. Push the pawn only when your king has cleared the way.",
  },
  {
    id: "back-rank-finish",
    title: "Back-Rank Finish",
    icon: "⚡",
    accent: "var(--coral)",
    difficulty: "Easy",
    description: "Convert a winning attack into checkmate on the back rank.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    humanColor: "w",
    goal: "checkmate",
    level: { elo: 1500, movetimeMs: 300 },
    tip: "The enemy king is boxed in by its own pawns. Invade the back rank!",
  },
];

export function getDrill(id: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}
