import { Chess } from "chess.js";
import { getEngine } from "./index";
import type { EngineMove } from "./types";
import type { Bot } from "../content/bots";

/** Pick a move for a bot: engine move, with random blunders mixed in for weak tiers. */
export async function chooseBotMove(
  bot: Bot,
  fen: string
): Promise<EngineMove | null> {
  const chess = new Chess(fen);
  const legal = chess.moves({ verbose: true });
  if (legal.length === 0) return null;

  const randomMove = (): EngineMove => {
    const m = legal[Math.floor(Math.random() * legal.length)];
    return { from: m.from, to: m.to, promotion: m.promotion, uci: m.lan };
  };

  if (bot.blunder > 0 && Math.random() < bot.blunder) {
    return randomMove();
  }

  const mv = await getEngine().bestMove(fen, bot.level);
  return mv ?? randomMove();
}
