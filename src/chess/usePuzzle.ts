import { useCallback, useEffect, useRef, useState } from "react";
import type { Move as ChessMove } from "chess.js";
import { useChessGame } from "./useChessGame";
import { useBoardController } from "./useBoardController";
import type { Orientation, Square } from "./types";
import type { Puzzle } from "../content/puzzles";

export type PuzzleStatus = "solving" | "solved" | "wrong";

export function usePuzzle(
  puzzle: Puzzle,
  opts: { onSolved?: (clean: boolean) => void } = {}
) {
  const game = useChessGame(puzzle.fen);
  const [status, setStatus] = useState<PuzzleStatus>("solving");
  const [wrongCount, setWrongCount] = useState(0);
  const [hint, setHint] = useState<{ from: Square; to: Square } | null>(null);
  const mate2Phase = useRef(0);
  const lineIdx = useRef(0);
  const wrongRef = useRef(0);
  const usedHintRef = useRef(false);
  const token = useRef(0);
  const solvedRef = useRef(false);

  const solver = puzzle.solver;
  const orientation: Orientation = solver === "w" ? "white" : "black";

  useEffect(() => {
    token.current++;
    game.reset(puzzle.fen);
    setStatus("solving");
    setWrongCount(0);
    wrongRef.current = 0;
    mate2Phase.current = 0;
    lineIdx.current = 0;
    solvedRef.current = false;
    usedHintRef.current = false;
    setHint(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id]);

  const finishSolved = useCallback(() => {
    if (solvedRef.current) return;
    solvedRef.current = true;
    setStatus("solved");
    opts.onSolved?.(wrongRef.current === 0 && !usedHintRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts]);

  const playOpponent = useCallback(
    (uci: string | null) => {
      const myToken = token.current;
      window.setTimeout(() => {
        if (myToken !== token.current) return;
        const chess = game.getChess();
        let u = uci;
        if (!u) {
          const legal = chess.moves({ verbose: true }) as ChessMove[];
          if (!legal.length) return;
          u = legal[0].lan;
        }
        game.move({
          from: u.slice(0, 2) as Square,
          to: u.slice(2, 4) as Square,
          promotion: (u[4] as "q") || undefined,
        });
      }, 430);
    },
    [game]
  );

  const markWrong = useCallback(() => {
    game.undo();
    wrongRef.current += 1;
    setWrongCount(wrongRef.current);
    setStatus("wrong");
    window.setTimeout(
      () => setStatus((s) => (s === "wrong" ? "solving" : s)),
      700
    );
  }, [game]);

  const handleSolverMove = useCallback(
    (mv: ChessMove) => {
      setHint(null);
      const uci = mv.from + mv.to + (mv.promotion ?? "");
      const chess = game.getChess();

      if (puzzle.type === "mate") {
        if (puzzle.mateIn === 1) {
          if (chess.isCheckmate()) finishSolved();
          else markWrong();
          return;
        }
        // mate in 2
        if (mate2Phase.current === 0) {
          if ((puzzle.keys ?? []).includes(uci)) {
            mate2Phase.current = 1;
            playOpponent(null);
          } else markWrong();
        } else {
          if (chess.isCheckmate()) finishSolved();
          else markWrong();
        }
        return;
      }

      // line puzzle
      const expected = puzzle.line?.[lineIdx.current];
      if (uci === expected) {
        lineIdx.current += 1;
        const opp = puzzle.line?.[lineIdx.current];
        if (opp) {
          playOpponent(opp);
          lineIdx.current += 1;
        }
        if (lineIdx.current >= (puzzle.line?.length ?? 0)) finishSolved();
      } else {
        markWrong();
      }
    },
    [puzzle, game, finishSolved, markWrong, playOpponent]
  );

  const controller = useBoardController({
    game,
    canMove: (from) => {
      if (status === "solved") return false;
      const p = game.placed.find((pp) => pp.square === from);
      return !!p && p.color === solver && game.turn === solver;
    },
    onMove: handleSolverMove,
  });

  const requestHint = useCallback(() => {
    usedHintRef.current = true;
    const chess = game.getChess();
    if (puzzle.type === "mate") {
      if (puzzle.mateIn === 2 && mate2Phase.current === 1) {
        for (const m of chess.moves({ verbose: true }) as ChessMove[]) {
          chess.move(m);
          const mate = chess.isCheckmate();
          chess.undo();
          if (mate) {
            setHint({ from: m.from, to: m.to });
            return;
          }
        }
      }
      const key = puzzle.keys?.[0];
      if (key)
        setHint({ from: key.slice(0, 2) as Square, to: key.slice(2, 4) as Square });
    } else {
      const exp = puzzle.line?.[lineIdx.current];
      if (exp)
        setHint({ from: exp.slice(0, 2) as Square, to: exp.slice(2, 4) as Square });
    }
  }, [puzzle, game]);

  return {
    game,
    controller,
    orientation,
    status,
    wrongCount,
    hint,
    requestHint,
    solver,
  };
}
