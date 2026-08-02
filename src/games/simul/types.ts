import type { EngineLevel } from "../../engine/types";

// A simultaneous exhibition: the player ("the master") faces many boards at once
// and moves at each in turn — exactly like the early-20th-century simuls. Boards
// can be any mix of chess and the arcade games.

export type SimulLevel = "easy" | "medium" | "hard";

export const SIMUL_LEVELS: { id: SimulLevel; name: string }[] = [
  { id: "easy", name: "Easy" },
  { id: "medium", name: "Medium" },
  { id: "hard", name: "Hard" },
];

/** "chess" or a games-suite definition id. */
export type SlotType = string;

export interface SlotSpec {
  id: string;
  type: SlotType;
}

/** Chess engine strength per simul level (drives the per-slot MinimaxEngine). */
export function chessLevel(level: SimulLevel): EngineLevel {
  switch (level) {
    case "easy":
      return { skill: 2 };
    case "medium":
      return { skill: 8 };
    case "hard":
      return { skill: 16 };
  }
}

/** Index into a game definition's difficulty list per simul level. */
export function difficultyIndex(level: SimulLevel): number {
  return level === "easy" ? 0 : level === "medium" ? 1 : 2;
}

export type SlotResult = { over: boolean; outcome: "win" | "loss" | "draw" | null };
