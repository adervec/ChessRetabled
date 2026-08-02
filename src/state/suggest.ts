// "What should I play?" — a pure, time-injectable picker that turns the
// dashboard stats + lesson progress into a handful of concrete next actions, so
// 56 games in a lobby never become a wall of choice. Same discipline as
// stats.ts/archetype.ts: no React, no Date.now() unless injected, so
// scripts/validate-stats.mjs can drive it headlessly.

import type { DashboardData } from "./stats.ts";
import { CATEGORY_LABEL, type CatalogEntry } from "../catalog.ts";
import { COURSES } from "../content/lessons.ts";

const DAY = 86400000;

export type SuggestionKind =
  | "lesson"     // the next lesson in the curriculum
  | "streak"     // nothing logged today
  | "improve"    // something you're losing at
  | "momentum"   // something you're mid-run on
  | "fresh"      // something never tried
  | "revisit"    // something you've dropped
  | "favourite"; // your usual

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  icon: string;
  title: string;
  /** One line saying *why* this is being suggested. */
  reason: string;
  cta: string;
  path: string;
}

export interface SuggestInput {
  /** useProgress.lessons — only `completed` is read. */
  lessons?: Record<string, { completed: boolean }>;
  /** Current day streak, for the streak nudge's wording. */
  streak?: number;
  now?: number;
  /** Bump to reshuffle: rotates the list and the pick within each rule. */
  seed?: number;
}

const pick = <T,>(xs: T[], seed: number): T => xs[((seed % xs.length) + xs.length) % xs.length];

const ofGame = (e: CatalogEntry, kind: SuggestionKind, reason: string, cta: string): Suggestion => ({
  id: `${kind}:${e.id}`,
  kind,
  icon: e.icon,
  title: e.name,
  reason,
  cta,
  path: e.path,
});

/** The first lesson in curriculum order that hasn't been completed. */
function nextLesson(lessons: Record<string, { completed: boolean }>): Suggestion | null {
  for (const c of COURSES) {
    for (const l of c.lessons) {
      if (!lessons[l.id]?.completed) {
        return {
          id: `lesson:${l.id}`,
          kind: "lesson",
          icon: c.icon,
          title: `Next lesson — ${l.title}`,
          reason: `${c.title} · ${l.summary}`,
          cta: "Start lesson",
          path: `/learn/${c.id}/${l.id}`,
        };
      }
    }
  }
  return null;
}

export function suggestActivities(d: DashboardData, input: SuggestInput = {}): Suggestion[] {
  const { lessons = {}, streak = 0, now = Date.now(), seed = 0 } = input;
  const today = new Date(now).toISOString().slice(0, 10);
  const playedToday = d.byDay.some((b) => b.date === today && b.count > 0);
  const age = (iso: string | null) => (iso ? now - new Date(iso).getTime() : Infinity);

  const out: (Suggestion | null)[] = [];

  // Nothing today → the cheapest way to keep the streak alive.
  out.push(
    playedToday
      ? null
      : {
          id: "streak:puzzles",
          kind: "streak",
          icon: "🧩",
          title: "A quick tactics puzzle",
          reason: streak > 0
            ? `Nothing logged today — one puzzle keeps your ${streak}-day streak alive.`
            : "Nothing logged today. One puzzle is enough to start a streak.",
          cta: "Solve one",
          path: "/puzzles",
        },
  );

  // Mid-run: played recently, but not today.
  const warm = d.perGame
    .filter((g) => g.played > 0 && age(g.lastPlayedISO) < 5 * DAY && !(playedToday && age(g.lastPlayedISO) < DAY))
    .sort((a, b) => b.last7 - a.last7 || age(a.lastPlayedISO) - age(b.lastPlayedISO));
  const hot = warm.length ? pick(warm, seed) : null;
  out.push(
    hot && ofGame(hot.entry, "momentum", `You're on a run — ${hot.last7} in the last 7 days. Keep it going.`, "Play again"),
  );

  // Needs work: a versus game you're behind in, with enough games to mean it.
  const weak = d.perGame
    .filter((g) => g.entry.kind === "versus" && g.won + g.lost >= 3 && (g.winRate ?? 1) < 0.5)
    .sort((a, b) => (a.winRate ?? 1) - (b.winRate ?? 1));
  const bad = weak.length ? pick(weak, seed) : null;
  out.push(
    bad && ofGame(
      bad.entry,
      "improve",
      `${Math.round((bad.winRate ?? 0) * 100)}% across ${bad.won + bad.lost} decisive games — this one owes you.`,
      "Take a rematch",
    ),
  );

  // Never tried.
  const unseen = d.notPlayed.length ? pick(d.notPlayed, seed) : null;
  out.push(
    unseen && ofGame(
      unseen,
      "fresh",
      `Never played · ${CATEGORY_LABEL[unseen.category]} · ${d.notPlayed.length} still untried.`,
      "Try it",
    ),
  );

  // Dropped: you liked it once, it's been a fortnight.
  const stale = d.perGame
    .filter((g) => g.played >= 3 && age(g.lastPlayedISO) > 14 * DAY)
    .sort((a, b) => age(b.lastPlayedISO) - age(a.lastPlayedISO));
  const cold = stale.length ? pick(stale, seed) : null;
  out.push(
    cold && ofGame(
      cold.entry,
      "revisit",
      `${cold.played} games, then nothing for ${Math.floor(age(cold.lastPlayedISO) / DAY)} days.`,
      "Pick it back up",
    ),
  );

  out.push(nextLesson(lessons));

  // Old faithful, so there's always something familiar on the list.
  out.push(
    d.mostPlayed
      ? ofGame(d.mostPlayed.entry, "favourite", `Your most-played — ${d.mostPlayed.played} games.`, "Play")
      : {
          id: "favourite:chess",
          kind: "favourite",
          icon: "♟",
          title: "Chess",
          reason: "Where the club started. Pick an opponent your size.",
          cta: "Play a bot",
          path: "/play",
        },
  );

  const all = out.filter((s): s is Suggestion => s !== null);
  // Rotate rather than reorder, so pressing "something else" walks the whole
  // list instead of reshuffling the same top three.
  const r = ((seed % all.length) + all.length) % all.length;
  return [...all.slice(r), ...all.slice(0, r)].slice(0, 3);
}
