import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LOGIC_PUZZLES } from "../logic/registry";
import { LOGIC_COMPONENTS } from "../logic/ui/components";
import {
  dailyKey, dailyNumber, dailyPuzzleId, dailySeed,
  recentKeys, shareText, streak, totalSolved,
} from "../logic/daily";
import { useDaily } from "../state/useDaily";
import { useArchive } from "../state/useArchive";
import { pinSeed } from "../cards/core/rng";
import { useActiveGame } from "../state/activeGame";
import "../logic/ui/Logic.css";

export function Daily() {
  const todayKey = dailyKey(new Date());
  const puzzleId = dailyPuzzleId(todayKey);
  const meta = LOGIC_PUZZLES.find((p) => p.id === puzzleId);
  const Puzzle = LOGIC_COMPONENTS[puzzleId];

  const results = useDaily((s) => s.results);
  const markSolved = useDaily((s) => s.markSolved);
  const done = results[todayKey];
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  useActiveGame(playing ? puzzleId : null);

  // Pin the seed *during render*, before the puzzle below renders: every puzzle
  // seeds itself in a useState initialiser, which runs in its own render pass —
  // after this line, and long before any effect of ours could fire.
  pinSeed(playing ? dailySeed(todayKey) : null);
  useEffect(() => () => pinSeed(null), []);

  // All 25 puzzles log their win through useArchive.add — the single funnel they
  // already share — so watching it is how the daily learns it was solved
  // without a callback prop in any of them.
  useEffect(() => {
    if (!playing || done) return;
    return useArchive.subscribe((s, prev) => {
      if (s.records === prev.records) return;
      const top = s.records[0];
      if (!top || top.gameId !== puzzleId || top.outcome !== "win") return;
      markSolved(todayKey, {
        puzzleId,
        solvedISO: top.endedISO,
        assisted: top.assisted,
      });
    });
  }, [playing, done, puzzleId, todayKey, markSolved]);

  if (playing && Puzzle) {
    return (
      <div className="page">
        <Puzzle onExit={() => setPlaying(false)} />
      </div>
    );
  }

  const run = streak(results, todayKey);
  const share = shareText(results, todayKey);

  const onShare = async () => {
    try {
      if (navigator.share) await navigator.share({ text: share });
      else await navigator.clipboard.writeText(share);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* dismissed the share sheet, or no clipboard permission — nothing to do */
    }
  };

  return (
    <div className="page">
      <header className="arcade__head">
        <h1 className="arcade__title">📅 Daily Challenge</h1>
        <p className="arcade__sub">
          One puzzle a day, picked by the date — so everyone gets the same one.
          Generated on your device from the date alone, which is why it still
          works offline.
        </p>
      </header>

      <div className="daily-card">
        <div className="daily-card__head">
          <span className="daily-card__no">#{dailyNumber(todayKey)}</span>
          <span className="daily-card__icon">{meta?.icon ?? "💡"}</span>
          <div className="daily-card__name">
            <strong>{meta?.name ?? puzzleId}</strong>
            <span className="text-muted">{meta?.blurb}</span>
          </div>
        </div>

        {done ? (
          <>
            <p className="bj-result bj-result--win">
              Solved today{done.assisted ? " (with a hint)" : ""} 🎉
            </p>
            <p className="text-muted">
              The next one unlocks at midnight. Until then the Logic Lab has all
              25 puzzles on tap.
            </p>
          </>
        ) : (
          <button className="btn btn--gold" onClick={() => setPlaying(true)}>
            ▶ Solve today's {meta?.name ?? "puzzle"}
          </button>
        )}

        <div className="daily-stats">
          <span className="tag tag--gold">🔥 {run}-day streak</span>
          <span className="tag">✓ {totalSolved(results)} solved</span>
        </div>

        <div className="daily-week" aria-label="The last seven days">
          {recentKeys(todayKey).map((k) => {
            const r = results[k];
            const cls = r ? (r.assisted ? "is-assisted" : "is-done") : "is-missed";
            return (
              <span key={k} className={"daily-week__day " + cls} title={k}>
                {k.slice(8)}
              </span>
            );
          })}
        </div>

        <div className="logic-foot">
          <button className="btn btn--sm btn--sky" onClick={onShare}>
            {copied ? "✓ Copied" : "↗ Share result"}
          </button>
          <Link to="/logic" className="btn btn--sm btn--ghost">← Logic Lab</Link>
        </div>
        <p className="text-muted" style={{ fontSize: "0.8rem" }}>
          The share text says which days you solved — never anything about the
          grid, so it can't spoil the puzzle.
        </p>
      </div>
    </div>
  );
}
