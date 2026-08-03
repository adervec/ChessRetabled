import { useEffect, useState } from "react";
import { LEARN_PATHS, getPath } from "../games/learn/paths";
import { useLessonPosition } from "../games/learn/useLessonPosition";
import { GameBoard } from "../games/ui/GameBoard";
import { getGame } from "../games/registry";
import type { GLesson, GLessonStep } from "../games/learn/types";
import type { GameDefinition } from "../games/core/types";
import { useProgress } from "../state/useProgress";
import { useActiveGame } from "../state/activeGame";
import "./Academy.css";

const lessonKey = (gameId: string, lessonId: string) => `g:${gameId}:${lessonId}`;

type View =
  | { mode: "paths" }
  | { mode: "path"; gameId: string }
  | { mode: "lesson"; gameId: string; lessonId: string };

export function Academy() {
  const [view, setView] = useState<View>({ mode: "paths" });
  const lessons = useProgress((s) => s.lessons);
  useActiveGame(view.mode === "lesson" ? view.gameId : null);

  if (view.mode === "lesson") {
    const path = getPath(view.gameId)!;
    const lesson = path.lessons.find((l) => l.id === view.lessonId)!;
    return (
      <div className="page">
        <LessonView
          gameId={view.gameId}
          lesson={lesson}
          onBack={() => setView({ mode: "path", gameId: view.gameId })}
        />
      </div>
    );
  }

  if (view.mode === "path") {
    const path = getPath(view.gameId)!;
    const def = getGame(view.gameId)!;
    return (
      <div className="page">
        <button className="btn btn--sm btn--ghost" onClick={() => setView({ mode: "paths" })}>
          ← All paths
        </button>
        <header className="academy__head">
          <span className="academy__icon">{def.icon}</span>
          <div>
            <h1 className="arcade__title">{def.name} Academy</h1>
            <p className="arcade__sub">{path.tagline}</p>
          </div>
        </header>
        <div className="academy__lessons">
          {path.lessons.map((l, i) => {
            const done = lessons[lessonKey(view.gameId, l.id)]?.completed;
            return (
              <button
                key={l.id}
                className={"academy-lesson" + (done ? " is-done" : "")}
                onClick={() => setView({ mode: "lesson", gameId: view.gameId, lessonId: l.id })}
              >
                <span className="academy-lesson__num">{done ? "✓" : i + 1}</span>
                <span className="academy-lesson__text">
                  <span className="academy-lesson__title">{l.title}</span>
                  <span className="academy-lesson__blurb">{l.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="arcade__head">
        <h1 className="arcade__title">Games Academy</h1>
        <p className="arcade__sub">
          Complete learning paths for every game — rules, tactics, and strategy,
          with hands-on challenges.
        </p>
      </header>
      <div className="academy__grid">
        {LEARN_PATHS.map((p) => {
          const def = getGame(p.gameId)!;
          const done = p.lessons.filter((l) => lessons[lessonKey(p.gameId, l.id)]?.completed).length;
          return (
            <button key={p.gameId} className="academy-card" onClick={() => setView({ mode: "path", gameId: p.gameId })}>
              <span className="academy-card__icon">{def.icon}</span>
              <span className="academy-card__name">{def.name}</span>
              <span className="academy-card__tag">{p.tagline}</span>
              <span className="academy-card__progress">
                {done}/{p.lessons.length} lessons
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LessonView({ gameId, lesson, onBack }: { gameId: string; lesson: GLesson; onBack: () => void }) {
  const def = getGame(gameId)!;
  const [i, setI] = useState(0);
  const [solvedSteps, setSolvedSteps] = useState<Set<number>>(new Set());
  const completeLesson = useProgress((s) => s.completeLesson);
  const step = lesson.steps[i];
  const isLast = i === lesson.steps.length - 1;
  const needsSolve = step.kind === "challenge" && !solvedSteps.has(i);

  const markSolved = () => setSolvedSteps((s) => new Set(s).add(i));

  const finish = () => {
    completeLesson(lessonKey(gameId, lesson.id), 1);
    onBack();
  };

  return (
    <div className="academy-player">
      <div className="academy-player__bar">
        <button className="btn btn--sm btn--ghost" onClick={onBack}>← Lessons</button>
        <span className="tag tag--gold">{def.icon} {lesson.title}</span>
        <span className="academy-player__step">{i + 1} / {lesson.steps.length}</span>
      </div>

      <StepView key={i} def={def} step={step} onSolved={markSolved} />

      <div className="academy-player__nav">
        <button className="btn btn--sm" disabled={i === 0} onClick={() => setI((n) => n - 1)}>
          ← Back
        </button>
        {isLast ? (
          <button className="btn btn--mint" disabled={needsSolve} onClick={finish}>
            ✓ Finish
          </button>
        ) : (
          <button className="btn btn--sky" disabled={needsSolve} onClick={() => setI((n) => n + 1)}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

function StepView({
  def,
  step,
  onSolved,
}: {
  def: GameDefinition<unknown>;
  step: GLessonStep;
  onSolved: () => void;
}) {
  if (step.kind === "text") {
    return (
      <div className="academy-step">
        {step.title && <h2 className="academy-step__title">{step.title}</h2>}
        <p className="academy-step__body">{step.body}</p>
      </div>
    );
  }
  return <ChallengeView def={def} step={step} onSolved={onSolved} />;
}

function ChallengeView({
  def,
  step,
  onSolved,
}: {
  def: GameDefinition<unknown>;
  step: Extract<GLessonStep, { kind: "challenge" }>;
  onSolved: () => void;
}) {
  const game = useLessonPosition(def, step.setup, step.accept);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (game.solved) onSolved();
  }, [game.solved, onSolved]);

  return (
    <div className="academy-step">
      {step.title && <h2 className="academy-step__title">{step.title}</h2>}
      <p className="academy-step__body">{step.body}</p>
      <div className="academy-step__board">
        <GameBoard game={game} />
      </div>
      <div className="academy-step__feedback">
        {game.solved ? (
          <span className="academy-step__ok">✓ {step.success}</span>
        ) : game.wrong ? (
          <span className="academy-step__no">Not quite — try again.{step.hint ? "" : ""}</span>
        ) : (
          <span className="academy-step__prompt">Make your move on the board.</span>
        )}
        {!game.solved && step.hint && (
          <button className="btn btn--sm btn--ghost" onClick={() => setShowHint((h) => !h)}>
            💡 Hint
          </button>
        )}
      </div>
      {showHint && !game.solved && <p className="academy-step__hint">{step.hint}</p>}
    </div>
  );
}
