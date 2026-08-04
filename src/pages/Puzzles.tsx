import { useCallback, useMemo, useRef, useState } from "react";
import { Board } from "../components/board/Board";
import { PromotionDialog } from "../components/board/PromotionDialog";
import { usePuzzle } from "../chess/usePuzzle";
import {
  PUZZLES,
  PUZZLE_THEMES,
  pickPuzzleNear,
  puzzlesByTheme,
  type Puzzle,
} from "../content/puzzles";
import { useProgress } from "../state/useProgress";
import "./Puzzles.css";
import { Link } from "react-router-dom";
import { LOGIC_PUZZLES } from "../logic/registry";
import { LEARN_PATHS } from "../games/learn/paths";
import { useActiveGame } from "../state/activeGame";

function ratingDelta(user: number, puzzle: number, solved: boolean): number {
  const expected = 1 / (1 + Math.pow(10, (puzzle - user) / 400));
  return Math.round(28 * ((solved ? 1 : 0) - expected));
}

type Session =
  | { kind: "training" }
  | { kind: "theme"; theme: string };

export function Puzzles() {
  useActiveGame("chess");
  const [session, setSession] = useState<Session | null>(null);

  if (!session) {
    return (
      <div className="page">
        <PuzzleHub
          onTrain={() => setSession({ kind: "training" })}
          onTheme={(theme) => setSession({ kind: "theme", theme })}
        />
      </div>
    );
  }
  return (
    <div className="page">
      <PuzzleSession session={session} onExit={() => setSession(null)} />
    </div>
  );
}

function PuzzleHub({
  onTrain,
  onTheme,
}: {
  onTrain: () => void;
  onTheme: (theme: string) => void;
}) {
  const rating = useProgress((s) => s.puzzle.rating);
  const solved = useProgress((s) => s.puzzle.solved);
  const best = useProgress((s) => s.puzzle.bestStreak);

  return (
    <div>
      <h1 className="toon-title">Tactics Puzzles</h1>
      <div className="puz-hub__rating">
        <div>
          <div className="puz-hub__bignum" style={{ color: "var(--gold)" }}>
            ⚡ {rating}
          </div>
          <div className="text-dim" style={{ fontWeight: 700 }}>
            Your puzzle rating
          </div>
        </div>
        <div className="row gap-l" style={{ marginLeft: "auto" }}>
          <div>
            <div className="puz-hub__bignum" style={{ fontSize: "1.8rem" }}>
              {solved}
            </div>
            <div className="text-muted" style={{ fontWeight: 700 }}>
              solved
            </div>
          </div>
          <div>
            <div className="puz-hub__bignum" style={{ fontSize: "1.8rem" }}>
              🔥 {best}
            </div>
            <div className="text-muted" style={{ fontWeight: 700 }}>
              best streak
            </div>
          </div>
          <button className="btn btn--primary btn--lg" onClick={onTrain}>
            ▶ Start training
          </button>
        </div>
      </div>

      <h2 className="toon-title" style={{ fontSize: "1.6rem", margin: "8px 0 14px" }}>
        Train by theme
      </h2>
      <div className="puz-hub__themes">
        {PUZZLE_THEMES.map((theme) => (
          <button
            key={theme}
            className="themecard"
            onClick={() => onTheme(theme)}
          >
            <div className="themecard__name">{theme}</div>
            <div className="themecard__count">
              {puzzlesByTheme(theme).length} puzzles
            </div>
          </button>
        ))}
      </div>

      <PuzzleWings />
    </div>
  );
}

function PuzzleSession({
  session,
  onExit,
}: {
  session: Session;
  onExit: () => void;
}) {
  const progress = useProgress();
  const recordPuzzle = progress.recordPuzzle;
  const themeList = useMemo(
    () => (session.kind === "theme" ? puzzlesByTheme(session.theme) : PUZZLES),
    [session]
  );
  const themeIdx = useRef(0);
  const seen = useRef<string[]>([]);

  const firstPuzzle = useMemo<Puzzle>(() => {
    if (session.kind === "theme") return themeList[0];
    return pickPuzzleNear(progress.puzzle.rating, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const [puzzle, setPuzzle] = useState<Puzzle>(firstPuzzle);
  const [delta, setDelta] = useState<number | null>(null);
  const [sessionSolved, setSessionSolved] = useState(0);

  const onSolved = useCallback(
    (clean: boolean) => {
      const user = useProgress.getState().puzzle.rating;
      const d = ratingDelta(user, puzzle.rating, clean);
      recordPuzzle(clean, d);
      setDelta(d);
      if (clean) setSessionSolved((n) => n + 1);
    },
    [puzzle, recordPuzzle]
  );

  const next = useCallback(() => {
    setDelta(null);
    if (session.kind === "theme") {
      themeIdx.current = (themeIdx.current + 1) % themeList.length;
      setPuzzle(themeList[themeIdx.current]);
    } else {
      seen.current = [...seen.current.slice(-15), puzzle.id];
      setPuzzle(pickPuzzleNear(useProgress.getState().puzzle.rating, seen.current));
    }
  }, [session, themeList, puzzle]);

  return (
    <PuzzleView
      key={puzzle.id}
      puzzle={puzzle}
      delta={delta}
      sessionSolved={sessionSolved}
      label={session.kind === "theme" ? session.theme : "Rated training"}
      onSolved={onSolved}
      onNext={next}
      onExit={onExit}
    />
  );
}

function PuzzleView({
  puzzle,
  delta,
  sessionSolved,
  label,
  onSolved,
  onNext,
  onExit,
}: {
  puzzle: Puzzle;
  delta: number | null;
  sessionSolved: number;
  label: string;
  onSolved: (clean: boolean) => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const p = usePuzzle(puzzle, { onSolved });
  const sideToMove = puzzle.solver === "w" ? "White" : "Black";
  const goal =
    puzzle.type === "mate"
      ? `${sideToMove} to move · Mate in ${puzzle.mateIn}`
      : `${sideToMove} to move · ${puzzle.theme}`;

  const bannerText =
    p.status === "solved"
      ? "✓ Solved!"
      : p.status === "wrong"
      ? "✗ Not quite — try again"
      : "Find the best move";

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn btn--sm btn--ghost" onClick={onExit}>
          ← Puzzles
        </button>
        <span className="tag tag--mint">{label}</span>
        <span className="tag">solved this session: {sessionSolved}</span>
      </div>
      <div className="puz">
        <div className="puz__board">
          <Board
            placed={p.game.placed}
            orientation={p.orientation}
            interactive={p.status !== "solved"}
            selected={p.controller.selected}
            targets={p.controller.targets}
            lastMove={p.game.lastMove}
            checkSquare={p.game.checkSquare}
            hintSquares={p.hint ? [p.hint.from, p.hint.to] : []}
            onSquareClick={p.controller.onSquareClick}
          />
        </div>

        <aside className="puz__side">
          <div className={"puz__banner " + p.status}>{bannerText}</div>
          <div className="puz__instruction">{goal}</div>

          <div className="puz__meta">
            <span className="tag">puzzle {puzzle.rating}</span>
            {delta != null && (
              <span className={"puz__delta " + (delta >= 0 ? "up" : "down")}>
                {delta >= 0 ? "+" : ""}
                {delta}
              </span>
            )}
          </div>

          {p.status === "solved" ? (
            <button className="btn btn--primary btn--block btn--lg" onClick={onNext}>
              Next puzzle →
            </button>
          ) : (
            <div className="puz__controls">
              <button className="btn btn--sm btn--sky" onClick={p.requestHint}>
                💡 Hint
              </button>
              <button className="btn btn--sm" onClick={onNext}>
                Skip →
              </button>
            </div>
          )}

          {p.wrongCount > 0 && p.status !== "solved" && (
            <div className="text-muted" style={{ textAlign: "center" }}>
              Keep trying — you've got this.
            </div>
          )}
        </aside>
      </div>

      {p.controller.promotion && (
        <PromotionDialog
          color={p.controller.promotion.color}
          onChoose={p.controller.choosePromotion}
          onCancel={p.controller.cancelPromotion}
        />
      )}
    </div>
  );
}

/**
 * Puzzles are not only a chess thing: the Logic Lab is nothing but puzzles, and
 * every board game has a set of solvable challenge positions in the Academy.
 * They used to be three unrelated corners of the app; this points at all of them
 * from the one place people look.
 */
export function PuzzleWings() {
  const challenges = LEARN_PATHS.reduce(
    (n, p) => n + p.lessons.reduce((k, l) => k + l.steps.filter((st) => st.kind === "challenge").length, 0),
    0
  );
  return (
    <section className="puz__wings">
      <h2 className="puz__wings-h2">More puzzles</h2>
      <div className="puz__wings-grid">
        <Link className="puz__wing" to="/logic">
          <span className="puz__wing-ico" aria-hidden>💡</span>
          <span className="puz__wing-name">Logic Lab</span>
          <span className="puz__wing-sub">
            {LOGIC_PUZZLES.length} kinds of deduction puzzle, each generated with a
            single provable solution.
          </span>
        </Link>
        <Link className="puz__wing" to="/academy">
          <span className="puz__wing-ico" aria-hidden>🎲</span>
          <span className="puz__wing-name">Board-game challenges</span>
          <span className="puz__wing-sub">
            {challenges} set positions across the twelve games — find the move that
            wins, in the Academy.
          </span>
        </Link>
        <Link className="puz__wing" to="/practice">
          <span className="puz__wing-ico" aria-hidden>🎯</span>
          <span className="puz__wing-name">Endgame drills</span>
          <span className="puz__wing-sub">
            Technique you either know or don't: king and rook, back rank, king and
            pawn.
          </span>
        </Link>
      </div>
    </section>
  );
}
