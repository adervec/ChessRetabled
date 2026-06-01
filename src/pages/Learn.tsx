import { useNavigate } from "react-router-dom";
import { COURSES, TOTAL_LESSONS, type Course } from "../content/lessons";
import { useProgress } from "../state/useProgress";
import "./Learn.css";

export function Learn() {
  const lessons = useProgress((s) => s.lessons);
  const completedCount = COURSES.reduce(
    (n, c) => n + c.lessons.filter((l) => lessons[l.id]?.completed).length,
    0
  );

  return (
    <div className="page">
      <div className="row between wrap" style={{ marginBottom: 6 }}>
        <h1 className="toon-title">Learn Chess</h1>
        <span className="tag tag--sky">
          {completedCount}/{TOTAL_LESSONS} lessons done
        </span>
      </div>
      <p className="text-dim" style={{ marginBottom: 22 }}>
        Guided, interactive lessons from your very first move to advanced
        endgame technique.
      </p>
      {COURSES.map((course) => (
        <CourseBlock key={course.id} course={course} />
      ))}
    </div>
  );
}

function CourseBlock({ course }: { course: Course }) {
  const nav = useNavigate();
  const lessons = useProgress((s) => s.lessons);
  const done = course.lessons.filter((l) => lessons[l.id]?.completed).length;

  return (
    <section
      className="course"
      style={{ ["--course-accent" as string]: course.accent }}
    >
      <div className="course__head">
        <div className="course__icon">{course.icon}</div>
        <div style={{ minWidth: 0 }}>
          <div className="course__title">{course.title}</div>
          <div className="course__desc">{course.description}</div>
        </div>
        <div className="course__progress">
          <span className="tag">{course.level}</span>
          <div className="bar" style={{ marginTop: 8 }}>
            <span style={{ width: `${(done / course.lessons.length) * 100}%` }} />
          </div>
          <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
            {done}/{course.lessons.length}
          </div>
        </div>
      </div>
      <div className="course__lessons">
        {course.lessons.map((lesson, i) => {
          const rec = lessons[lesson.id];
          return (
            <button
              key={lesson.id}
              className="lessonrow"
              onClick={() => nav(`/learn/${course.id}/${lesson.id}`)}
            >
              <div className={"lessonrow__badge" + (rec?.completed ? " done" : "")}>
                {rec?.completed ? "✓" : i + 1}
              </div>
              <div className="lessonrow__main">
                <div className="lessonrow__title">{lesson.title}</div>
                <div className="lessonrow__summary">{lesson.summary}</div>
              </div>
              {rec?.completed ? (
                <div className="lessonrow__stars" title={`${rec.stars} stars`}>
                  {"⭐".repeat(rec.stars)}
                  <span style={{ opacity: 0.25 }}>{"⭐".repeat(3 - rec.stars)}</span>
                </div>
              ) : (
                <span className="lessonrow__cta">Start →</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
