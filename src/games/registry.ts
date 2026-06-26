// The catalogue of self-contained combinatorial games. Each is a GameDefinition
// driven by the generic alpha-beta engine in core/ai.ts. Adding a game is just
// writing one definition file and listing it here.
import type { GameDefinition } from "./core/types.ts";
import { ticTacToe } from "./defs/tictactoe.ts";
import { connectFour } from "./defs/connect-four.ts";
import { reversi } from "./defs/reversi.ts";
import { gomoku } from "./defs/gomoku.ts";
import { checkers } from "./defs/checkers.ts";
import { nineMensMorris } from "./defs/morris.ts";
import { konane } from "./defs/konane.ts";
import { breakthrough } from "./defs/breakthrough.ts";
import { hex } from "./defs/hex.ts";
import { loa } from "./defs/loa.ts";
import { surakarta } from "./defs/surakarta.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: GameDefinition<any>[] = [
  checkers,
  reversi,
  connectFour,
  gomoku,
  nineMensMorris,
  konane,
  breakthrough,
  surakarta,
  loa,
  hex,
  ticTacToe,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getGame(id: string): GameDefinition<any> | undefined {
  return GAMES.find((g) => g.id === id);
}
