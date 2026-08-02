import { useCallback, useEffect, useRef, useState } from "react";
import type { Move as ChessMove } from "chess.js";
import { useChessGame } from "./useChessGame";
import { useBoardController } from "./useBoardController";
import type { Color, Orientation, Square } from "./types";
import type { Bot } from "../content/bots";
import { chooseBotMove } from "../engine/bot";
import { getEngine } from "../engine";

export type ManualResult = {
  winner: Color | null;
  reason: "resign" | "agreement" | "timeout";
} | null;

/** Progressive: stage 1 reveals only the piece, stage 2 the full move. */
export type Hint = { from: Square; to: Square; stage: 1 | 2 } | null;

export function useBotGame(
  bot: Bot,
  humanColor: Color,
  initialFen?: string
) {
  const game = useChessGame(initialFen);
  const [thinking, setThinking] = useState(false);
  const [manualResult, setManualResult] = useState<ManualResult>(null);
  const [flipped, setFlipped] = useState(false);
  const [hint, setHint] = useState<Hint>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [evalScore, setEvalScore] = useState<{ cp?: number; mate?: number }>({});
  const [hintBusy, setHintBusy] = useState(false);
  const botMoveToken = useRef(0);

  const orientation: Orientation = (
    flipped ? (humanColor === "w" ? "b" : "w") : humanColor === "w" ? "w" : "b"
  ) as Orientation;

  const overByRules = game.isGameOver;
  const gameOver = overByRules || manualResult !== null;

  const controller = useBoardController({
    game,
    canMove: (from) => {
      if (gameOver || thinking) return false;
      const p = game.placed.find((pp) => pp.square === from);
      return !!p && p.color === humanColor && game.turn === humanColor;
    },
    onMove: () => {
      setHint(null);
    },
  });

  // Bot replies whenever it's the bot's turn.
  useEffect(() => {
    if (gameOver) return;
    if (game.turn === humanColor) return;
    const token = ++botMoveToken.current;
    setThinking(true);
    let cancelled = false;
    const fen = game.fen;
    chooseBotMove(bot, fen)
      .then((mv) => {
        if (cancelled || token !== botMoveToken.current) return;
        if (mv) {
          game.move({ from: mv.from, to: mv.to, promotion: mv.promotion });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled && token === botMoveToken.current) setThinking(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.fen, game.turn, gameOver, humanColor, bot]);

  // Evaluate only on the human's turn (keeps the engine queue free for bot moves).
  useEffect(() => {
    let cancelled = false;
    if (gameOver || game.turn !== humanColor) return;
    getEngine()
      .evaluate(game.fen, { depth: 11 })
      .then((s) => {
        if (!cancelled) setEvalScore(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.fen, game.turn, gameOver, humanColor]);

  // Progressive: first press shows which piece to move, second reveals the
  // move. Using it at all flags the game as assisted (hintUsed is sticky).
  const requestHint = useCallback(async () => {
    if (gameOver || game.turn !== humanColor || hintBusy) return;
    setHintUsed(true);
    if (hint) {
      setHint({ ...hint, stage: 2 });
      return;
    }
    setHintBusy(true);
    try {
      const mv = await getEngine().bestMove(game.fen, { depth: 14 });
      if (mv) setHint({ from: mv.from, to: mv.to, stage: 1 });
    } finally {
      setHintBusy(false);
    }
  }, [game, gameOver, humanColor, hintBusy, hint]);

  const takeback = useCallback(() => {
    if (thinking) return;
    // undo back to the human's turn (usually two half-moves)
    game.undo();
    if (game.getChess().turn() !== humanColor && !game.isGameOver) {
      game.undo();
    }
    setHint(null);
    setManualResult(null);
  }, [game, humanColor, thinking]);

  const resign = useCallback(() => {
    if (gameOver) return;
    setManualResult({ winner: humanColor === "w" ? "b" : "w", reason: "resign" });
  }, [gameOver, humanColor]);

  const offerDraw = useCallback(() => {
    // simple model: bot accepts a draw if the eval is roughly equal
    if (gameOver) return;
    const cp = evalScore.cp ?? 0;
    const fromHuman = humanColor === "w" ? cp : -cp;
    if (Math.abs(fromHuman) < 60) {
      setManualResult({ winner: null, reason: "agreement" });
      return true;
    }
    return false;
  }, [gameOver, evalScore, humanColor]);

  const history = game.history();

  // resolved result for display
  const result =
    manualResult !== null
      ? { over: true, winner: manualResult.winner, reason: manualResult.reason }
      : game.result;

  return {
    game,
    controller,
    orientation,
    thinking,
    hintBusy,
    hint,
    hintUsed,
    evalScore,
    gameOver,
    result,
    history,
    requestHint,
    takeback,
    resign,
    offerDraw,
    flip: () => setFlipped((f) => !f),
    flipped,
  };
}

export function capturedFromHistory(history: ChessMove[]) {
  // returns pieces captured BY white and BY black (piece type letters)
  const byWhite: string[] = [];
  const byBlack: string[] = [];
  for (const m of history) {
    if (m.captured) {
      if (m.color === "w") byWhite.push(m.captured);
      else byBlack.push(m.captured);
    }
  }
  return { byWhite, byBlack };
}
