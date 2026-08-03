import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Move as ChessMove } from "chess.js";
import { Board } from "../components/board/Board";
import { PromotionDialog } from "../components/board/PromotionDialog";
import { useChessGame } from "../chess/useChessGame";
import { useBoardController } from "../chess/useBoardController";
import {
  fenToPlaced,
  START_FEN,
  type Orientation,
  type Square,
} from "../chess/types";
import { getLesson, type Course, type Lesson } from "../content/lessons";
import { useProgress } from "../state/useProgress";
import "./LessonPlayer.css";
import { useActiveGame } from "../state/activeGame";

export function LessonPlayer() {
  useActiveGame("chess");
  const { courseId, lessonId } = useParams();
  const found = getLesson(courseId ?? "", lessonId ?? "");
  if (!found) {
    return (
      <div className="page">
        <h1 className="toon-title">Lesson not found</h1>
      </div>
    );
  }
  return (
    <div className="page">
      <LessonRunner
        key={found.lesson.id}
        course={found.course}
        lesson={found.lesson}
        index={found.index}
      />
    </div>
  );
}

function LessonRunner({
  course,
  lesson,
  index,
}: {
  course: Course;
  lesson: Lesson;
  index: number;
}) {
  const nav = useNavigate();
  const completeLesson = useProgress((s) => s.completeLesson);

  const [stepIdx, setStepIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [stepDone, setStepDone] = useState(false);
  const [status, setStatus] = useState<"prompt" | "wrong" | "done">("prompt");
  const [hint, setHint] = useState<{ from: string; to: string } | null>(null);
  const wrongTotal = useRef(0);
  const hintUsed = useRef(false);

  const step = lesson.steps[stepIdx];
  const game = useChessGame(START_FEN);

  // reset the engine board before paint when we enter a move step
  useLayoutEffect(() => {
    if (step.kind === "move") game.reset(step.fen);
    setStepDone(false);
    setStatus("prompt");
    setHint(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  const handleMove = (mv: ChessMove) => {
    if (step.kind !== "move") return;
    const uci = mv.from + mv.to + (mv.promotion ?? "");
    if (step.answer.includes(uci)) {
      setStepDone(true);
      setStatus("done");
    } else {
      wrongTotal.current += 1;
      game.undo();
      setStatus("wrong");
      window.setTimeout(
        () => setStatus((s) => (s === "wrong" ? "prompt" : s)),
        700
      );
    }
  };

  const controller = useBoardController({
    game,
    canMove: (from) => {
      if (step.kind !== "move" || stepDone) return false;
      const p = game.placed.find((pp) => pp.square === from);
      return !!p && p.color === step.solver && game.turn === step.solver;
    },
    onMove: handleMove,
  });

  const goNext = () => {
    if (stepIdx < lesson.steps.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      const w = wrongTotal.current;
      const stars = w === 0 && !hintUsed.current ? 3 : w <= 2 ? 2 : 1;
      completeLesson(lesson.id, stars);
      setFinished(true);
    }
  };

  const requestHint = () => {
    if (step.kind !== "move") return;
    hintUsed.current = true;
    const a = step.answer[0];
    setHint({ from: a.slice(0, 2), to: a.slice(2, 4) });
  };

  if (finished) {
    const w = wrongTotal.current;
    const stars = w === 0 && !hintUsed.current ? 3 : w <= 2 ? 2 : 1;
    const nextLesson = course.lessons[index + 1];
    return (
      <div className="lesson__complete pop-in">
        <div className="big">🎉</div>
        <h2 className="toon-title">Lesson complete!</h2>
        <div className="lesson__stars-big">
          {"⭐".repeat(stars)}
          <span style={{ opacity: 0.25 }}>{"⭐".repeat(3 - stars)}</span>
        </div>
        <p className="text-dim" style={{ marginBottom: 20 }}>
          {lesson.title} — nicely done.
        </p>
        <div className="row center gap-s" style={{ flexWrap: "wrap" }}>
          {nextLesson ? (
            <button
              className="btn btn--primary btn--lg"
              onClick={() => nav(`/learn/${course.id}/${nextLesson.id}`)}
            >
              Next lesson →
            </button>
          ) : (
            <button
              className="btn btn--primary btn--lg"
              onClick={() => nav("/learn")}
            >
              Back to courses
            </button>
          )}
          <button className="btn" onClick={() => nav("/learn")}>
            All lessons
          </button>
        </div>
      </div>
    );
  }

  const hasBoard = step.kind === "move" || !!step.fen;
  const orientation: Orientation =
    step.kind === "move"
      ? step.solver === "w"
        ? "white"
        : "black"
      : (step.orientation ?? "w") === "w"
      ? "white"
      : "black";

  const statusText =
    status === "done"
      ? step.kind === "move"
        ? step.success
        : "Great!"
      : status === "wrong"
      ? "Not quite — try the highlighted idea again."
      : step.kind === "move"
      ? "Your move."
      : "";

  return (
    <>
      <div className="lesson__top">
        <button className="btn btn--sm btn--ghost" onClick={() => nav("/learn")}>
          ← {course.title}
        </button>
        <div className="lesson__progress">
          <div className="bar">
            <span
              style={{
                width: `${((stepIdx + (stepDone ? 1 : 0)) / lesson.steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <span className="tag">
          {stepIdx + 1}/{lesson.steps.length}
        </span>
      </div>

      <div className={"lesson" + (hasBoard ? "" : " no-board")}>
        {hasBoard && (
          <div>
            <Board
              placed={
                step.kind === "move" ? game.placed : fenToPlaced(step.fen!)
              }
              orientation={orientation}
              interactive={step.kind === "move" && !stepDone}
              selected={controller.selected}
              targets={controller.targets}
              lastMove={step.kind === "move" ? game.lastMove : null}
              checkSquare={step.kind === "move" ? game.checkSquare : null}
              hintSquares={
                hint ? [hint.from as Square, hint.to as Square] : []
              }
              onSquareClick={controller.onSquareClick}
            />
          </div>
        )}

        <div className="lesson__panel">
          <div className="lesson__card">
            {step.title && <div className="lesson__steptitle">{step.title}</div>}
            <div className="lesson__body">{step.body}</div>
          </div>

          {step.kind === "move" && (
            <div className={"lesson__status " + status}>{statusText}</div>
          )}

          <div className="lesson__actions">
            {step.kind === "move" && !stepDone ? (
              <button
                className="btn btn--sm btn--sky"
                onClick={requestHint}
              >
                💡 Hint
              </button>
            ) : null}
            <button
              className="btn btn--primary grow"
              disabled={step.kind === "move" && !stepDone}
              onClick={goNext}
            >
              {stepIdx < lesson.steps.length - 1 ? "Continue →" : "Finish lesson ✓"}
            </button>
          </div>
        </div>
      </div>

      {controller.promotion && (
        <PromotionDialog
          color={controller.promotion.color}
          onChoose={controller.choosePromotion}
          onCancel={controller.cancelPromotion}
        />
      )}
    </>
  );
}
