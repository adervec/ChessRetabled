import { useProgress, useLevel } from "../state/useProgress";
import { COURSES, TOTAL_LESSONS } from "../content/lessons";
import { DRILLS } from "../content/drills";
import { PUZZLES } from "../content/puzzles";
import { SettingsPanel } from "../components/ui/SettingsPanel";
import "./Profile.css";

export function Profile() {
  const p = useProgress();
  const { level, into, need } = useLevel();

  const lessonsDone = COURSES.reduce(
    (n, c) => n + c.lessons.filter((l) => p.lessons[l.id]?.completed).length,
    0
  );
  const stars = COURSES.reduce(
    (n, c) =>
      n + c.lessons.reduce((m, l) => m + (p.lessons[l.id]?.stars ?? 0), 0),
    0
  );
  const drillsDone = DRILLS.filter((d) => p.drills[d.id]?.completed).length;
  const winRate =
    p.games.played > 0
      ? Math.round((p.games.won / p.games.played) * 100)
      : 0;
  const accuracy =
    p.puzzle.attempted > 0
      ? Math.round((p.puzzle.solved / p.puzzle.attempted) * 100)
      : 0;

  return (
    <div className="page">
      <h1 className="toon-title">Your Profile</h1>

      <div className="profile__hero" style={{ marginTop: 16 }}>
        <div className="profile__avatar">🦊</div>
        <div className="profile__level">
          <div className="profile__levelnum" style={{ color: "var(--gold)" }}>
            Level {level}
          </div>
          <div className="text-dim" style={{ fontWeight: 700, marginBottom: 8 }}>
            {p.xp} XP total · {need - into} XP to level {level + 1}
          </div>
          <div className="bar" style={{ height: 18 }}>
            <span
              style={{ width: `${Math.round((into / need) * 100)}%`, background: "var(--gold)" }}
            />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="profile__levelnum" style={{ color: "var(--coral)" }}>
            🔥 {p.streak.count}
          </div>
          <div className="text-muted" style={{ fontWeight: 700 }}>
            day streak
          </div>
        </div>
      </div>

      <div className="profile__grid">
        <div className="statcard">
          <div className="statcard__label">⚡ Puzzle Rating</div>
          <div className="statcard__value" style={{ color: "var(--gold)" }}>
            {p.puzzle.rating}
          </div>
          <div className="statcard__sub">
            {p.puzzle.solved} solved · {accuracy}% accuracy
          </div>
        </div>

        <div className="statcard">
          <div className="statcard__label">🔥 Best Puzzle Streak</div>
          <div className="statcard__value" style={{ color: "var(--coral)" }}>
            {p.puzzle.bestStreak}
          </div>
          <div className="statcard__sub">of {PUZZLES.length} puzzles available</div>
        </div>

        <div className="statcard">
          <div className="statcard__label">♟ Bot Games</div>
          <div className="statcard__value" style={{ color: "var(--mint)" }}>
            {p.games.won}-{p.games.drawn}-{p.games.lost}
          </div>
          <div className="statcard__sub">
            {p.games.played} played · {winRate}% win rate
          </div>
        </div>

        <div className="statcard">
          <div className="statcard__label">🎓 Lessons</div>
          <div className="statcard__value" style={{ color: "var(--sky)" }}>
            {lessonsDone}/{TOTAL_LESSONS}
          </div>
          <div className="statcard__sub">⭐ {stars} stars earned</div>
        </div>

        <div className="statcard">
          <div className="statcard__label">🎯 Drills Mastered</div>
          <div className="statcard__value" style={{ color: "var(--violet)" }}>
            {drillsDone}/{DRILLS.length}
          </div>
          <div className="statcard__sub">endgame technique</div>
        </div>

        <div className="statcard">
          <div className="statcard__label">★ Level</div>
          <div className="statcard__value" style={{ color: "var(--gold)" }}>
            {level}
          </div>
          <div className="statcard__sub">{p.xp} XP earned</div>
        </div>
      </div>

      <SettingsPanel />

      <div className="profile__danger">
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => {
            if (
              window.confirm(
                "Reset ALL progress (rating, lessons, streaks)? This can't be undone."
              )
            ) {
              p.reset();
            }
          }}
        >
          Reset all progress
        </button>
      </div>
    </div>
  );
}
