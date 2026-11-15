// A calendar day is the user's LOCAL day. This proves it in real timezones.
//
// The bug class: `new Date().toISOString().slice(0, 10)` is the UTC day, and
// `new Date("2026-11-10")` is UTC midnight. West of UTC both are off by a day for
// part of every evening, so a streak dies at 21:00 and the daily challenge flips
// while the player is still mid-evening.
//
// Why child processes: Node caches the timezone, and assigning process.env.TZ
// mid-run does not reliably re-read it (notably on Windows). Each case therefore
// re-spawns this file with TZ already set in the child's environment, which works
// everywhere. Reference shape: GymTracker's test/midnight.spec.mjs.
//
// Run: node scripts/validate-timezone.mjs
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { dayKey, dayStart, dayDiff } from "../src/state/day.ts";
import { dailyKey, dailySeed, dailyPuzzleId } from "../src/logic/daily.ts";
import { buildDashboard } from "../src/state/stats.ts";
import { suggestActivities } from "../src/state/suggest.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  x ${msg}`); problems++; }
}

// Spread across the date line in both directions, plus two that observe DST.
const CASES = [
  "America/Sao_Paulo",   // UTC-3: the reported case
  "Pacific/Honolulu",    // UTC-10: furthest behind
  "America/New_York",    // observes DST
  "Europe/Berlin",       // observes DST, east of UTC
  "Asia/Tokyo",          // UTC+9
  "Pacific/Kiritimati",  // UTC+14: furthest ahead
  "UTC",
];

const KEY = "2026-11-10";

// ---------------------------------------------------------------- child mode
if (process.env.TZ_CASE) {
  const tz = process.env.TZ_CASE;
  // Built with the *local* Date constructor, so these are 22:30 and 01:30 on
  // 10 Nov 2026 as the user experiences them, in whatever zone this child runs.
  const evening = new Date(2026, 10, 10, 22, 30, 0);
  const morning = new Date(2026, 10, 10, 1, 30, 0);

  check(dayKey(evening) === KEY, `${tz}: 22:30 local is ${KEY} (got ${dayKey(evening)})`);
  check(dayKey(morning) === KEY, `${tz}: 01:30 local is ${KEY} (got ${dayKey(morning)})`);
  check(dayKey(evening.getTime()) === KEY, `${tz}: epoch ms gives the local day`);
  check(dayKey(evening.toISOString()) === KEY,
    `${tz}: a stored UTC instant maps back to the local day (got ${dayKey(evening.toISOString())})`);
  check(dayKey(KEY) === KEY, `${tz}: a day key handed back in is unchanged, not re-read as UTC`);
  check(dailyKey(evening) === KEY, `${tz}: the daily challenge uses the local day`);
  check(dailySeed(dailyKey(evening)) === dailySeed(KEY), `${tz}: the daily seed follows the local day`);
  check(dailyPuzzleId(dailyKey(evening)) === dailyPuzzleId(KEY), `${tz}: today's puzzle follows the local day`);

  const start = dayStart(KEY);
  check(
    start.getFullYear() === 2026 && start.getMonth() === 10 && start.getDate() === 10,
    `${tz}: dayStart is local midnight, not UTC midnight (got ${start.toString().slice(0, 15)})`
  );
  check(dayDiff("2026-11-09", KEY) === 1, `${tz}: consecutive days are 1 apart`);
  check(dayDiff(KEY, "2026-11-09") === -1, `${tz}: going backwards is -1`);
  check(dayDiff(KEY, KEY) === 0, `${tz}: the same day is 0 apart`);
  check(dayDiff("2026-03-07", "2026-03-09") === 2, `${tz}: 2 days across a spring-forward`);
  check(dayDiff("2026-10-31", "2026-11-02") === 2, `${tz}: 2 days across a fall-back`);
  {
    // A year of steps: no accumulated drift through either DST transition.
    let ok = true;
    for (let i = 0; i < 365; i++) {
      const a = dayKey(new Date(2026, 0, 1 + i));
      const b = dayKey(new Date(2026, 0, 2 + i));
      if (dayDiff(a, b) !== 1) ok = false;
    }
    check(ok, `${tz}: 365 consecutive day steps are each exactly 1`);
  }

  // End to end: a game finished at 22:30 local must land in today's bucket.
  const iso = evening.toISOString();
  const rec = {
    id: "tz-case", gameId: "chess", gameName: "Chess", startedISO: iso, endedISO: iso,
    outcome: "win", humanSide: "w", opponent: "AI", moveCount: 0, moves: [],
  };
  const d = buildDashboard([rec], evening.getTime());
  check(d.byDay.length === 14, `${tz}: the sparkline is 14 days`);
  check(d.byDay[13].date === KEY, `${tz}: the last bucket is today, locally (got ${d.byDay[13].date})`);
  check(d.byDay[13].count === 1, `${tz}: a 22:30 game counts as played today (got ${d.byDay[13].count})`);
  check(d.byDay.reduce((n, b) => n + b.count, 0) === 1, `${tz}: it is counted once, in one bucket`);
  check(d.activeDays === 1, `${tz}: it is one active day`);

  const played = suggestActivities(d, { now: evening.getTime() });
  check(!played.some((s) => s.id === "streak:puzzles"),
    `${tz}: no "nothing logged today" nudge after playing at 22:30`);
  const idle = suggestActivities(buildDashboard([], evening.getTime()), { now: evening.getTime() });
  check(idle.some((s) => s.id === "streak:puzzles"),
    `${tz}: the nudge does appear when nothing was played (the check above is not vacuous)`);

  // Reported to the parent: did UTC and local actually disagree here? If no case
  // disagrees, the suite proves nothing and the parent fails.
  console.log(`diverged=${evening.toISOString().slice(0, 10) !== KEY ? 1 : 0}`);
  console.log(`offset=${-evening.getTimezoneOffset() / 60}`);
  process.exit(problems ? 1 : 0);
}

// --------------------------------------------------------------- parent mode
console.log("Day keys in real timezones (each in its own process, TZ preset):");
let diverged = 0;
const offsets = new Set();
for (const tz of CASES) {
  const r = spawnSync(process.execPath, [process.argv[1]], {
    encoding: "utf8",
    env: { ...process.env, TZ: tz, TZ_CASE: tz },
  });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  const d = /diverged=(\d)/.exec(out);
  const off = /offset=(-?[\d.]+)/.exec(out);
  if (d?.[1] === "1") diverged++;
  if (off) offsets.add(off[1]);
  const failures = out.split("\n").filter((l) => l.trim().startsWith("x "));
  checks++;
  if (r.status !== 0) {
    problems++;
    console.log(`  x ${tz} (UTC${off?.[1] ?? "?"})`);
    for (const f of failures) console.log(`    ${f.trim()}`);
    if (!failures.length) console.log(`    ${out.trim().split("\n").slice(-6).join("\n    ")}`);
  } else {
    console.log(`  · ${tz} (UTC${off?.[1] ?? "?"}) — local day held at 22:30 and 01:30`);
  }
}
check(offsets.size >= 4, `the cases really ran in different zones (saw ${offsets.size} distinct offsets)`);
check(diverged >= 2, `at least two cases where the UTC day differs from the local day (got ${diverged}) — otherwise this suite would pass on the UTC-based code it exists to catch`);

console.log("\nThe UTC day-slice is gone from the source:");
{
  // The ratchet. day.ts's own header names both traps as warnings, so comment
  // lines are skipped.
  const walk = (dir) => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
  const offenders = [];
  for (const file of walk("src")) {
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      // Two shapes of the same mistake: slicing a fresh toISOString(), and
      // slicing a date-ish string that was *stored* as UTC (endedISO et al).
      if (/toISOString\(\)\s*\.\s*(slice\(0,\s*10\)|split\(["']T)/.test(line) ||
          // *ISO only: every instant-bearing field here is named that way
          // (endedISO, nowISO, solvedISO…), and a looser pattern would flag
          // innocents like `candidate.slice(0, 10)`.
          /\b\w*(ISO|iso)\w*\s*\.\s*slice\(0,\s*10\)/.test(line)) {
        offenders.push(`${file}:${i + 1}`);
      }
    });
  }
  check(offenders.length === 0,
    `no file derives a day from toISOString() — use dayKey() from state/day.ts (${offenders.join(", ")})`);

  // And the modules that bucket by day go through the one helper.
  for (const [file, what] of [
    ["src/state/stats.ts", "the dashboard buckets"],
    ["src/state/suggest.ts", "played-today"],
    ["src/state/useProgress.ts", "the streak"],
    ["src/state/cowork.ts", "the review brief"],
    ["src/state/coach.ts", "the coaching brief"],
    ["src/logic/daily.ts", "the daily challenge"],
  ]) {
    // Siblings in src/state import "./day.ts", so match the path's tail only.
    check(/from "[^"]*\bday\.ts"/.test(readFileSync(file, "utf8")),
      `${what} (${file}) uses state/day.ts`);
  }
}

console.log(`\n[validate-timezone] cases=${CASES.length} checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
