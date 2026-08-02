import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useArchive } from "../../state/useArchive";
import { useProgress } from "../../state/useProgress";
import { buildDashboard } from "../../state/stats";
import { suggestActivities } from "../../state/suggest";
import "./WhatNow.css";

/**
 * Three concrete "play this next" cards instead of a lobby of 56 tiles.
 * All the thinking lives in state/suggest.ts; this just renders it and lets you
 * cycle for a different set.
 */
export function WhatNow({ compact = false }: { compact?: boolean }) {
  const records = useArchive((a) => a.records);
  const lessons = useProgress((s) => s.lessons);
  const streak = useProgress((s) => s.streak.count);
  const [seed, setSeed] = useState(0);

  // One timestamp per mount: stable memo deps, and "today" can't shift mid-render.
  const now = useMemo(() => Date.now(), []);
  const picks = useMemo(
    () => suggestActivities(buildDashboard(records, now), { lessons, streak, now, seed }),
    [records, lessons, streak, now, seed],
  );

  return (
    <section className={"whatnow" + (compact ? " whatnow--compact" : "")}>
      <div className="whatnow__head">
        <h2 className="whatnow__title toon-title">What now?</h2>
        <button className="btn btn--sm btn--ghost" onClick={() => setSeed((s) => s + 1)}>
          🎲 Something else
        </button>
      </div>
      <div className="whatnow__grid">
        {picks.map((s) => (
          <Link key={s.id} to={s.path} className={"whatnow__card whatnow__card--" + s.kind}>
            <span className="whatnow__ico" aria-hidden>{s.icon}</span>
            <span className="whatnow__name">{s.title}</span>
            <span className="whatnow__reason">{s.reason}</span>
            <span className="whatnow__cta">{s.cta} →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
