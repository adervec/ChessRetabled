// Headless verification for the dashboard analytics: the unified catalogue is
// well-formed, and buildDashboard() aggregates a synthetic archive correctly.
// Pure modules, driven via Node 24 type-stripping — no UI.
import { CATALOG, CATALOG_BY_ID, CATEGORY_ORDER } from "../src/catalog.ts";
import { buildDashboard, pct, relativeTime } from "../src/state/stats.ts";
import { deriveArchetype, ARCHETYPE_IDS } from "../src/state/archetype.ts";
import { buildCoachBrief } from "../src/state/coach.ts";
import { suggestActivities } from "../src/state/suggest.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  ✗ ${msg}`); problems++; }
}

console.log("Catalogue:");
{
  const ids = CATALOG.map((e) => e.id);
  check(new Set(ids).size === ids.length, "every catalogue id is unique");
  check(CATALOG.some((e) => e.id === "chess" && e.category === "chess"), "chess is in the catalogue");
  check(CATALOG.some((e) => e.id === "pyramid" && e.kind === "solo"), "pyramid registered as a solo game");
  check(CATALOG.some((e) => e.id === "golf" && e.kind === "solo"), "golf registered as a solo game");
  check(CATALOG.filter((e) => e.category === "logic").every((e) => e.kind === "solo"), "logic puzzles are all solo");
  check(CATALOG.filter((e) => e.category === "board").every((e) => e.kind === "versus"), "board games are all versus");
  check(CATEGORY_ORDER.every((c) => CATALOG.some((e) => e.category === c)), "every category has at least one entry");
  check(CATALOG.every((e) => CATALOG_BY_ID[e.id] === e), "id index matches the list");
  check(CATALOG.every((e) => typeof e.path === "string" && e.path.startsWith("/")), "every entry has a route");
}

console.log("\nbuildDashboard (synthetic archive):");
{
  const now = Date.UTC(2026, 5, 19, 12, 0, 0); // 2026-06-19T12:00Z
  const at = (days, hours = 0) => new Date(now - days * 86400000 - hours * 3600000).toISOString();
  const rec = (gameId, gameName, outcome, endedISO, reason) => ({
    id: gameId + endedISO, gameId, gameName, startedISO: endedISO, endedISO,
    outcome, humanSide: "w", opponent: "AI", moveCount: 0, moves: [], reason,
  });
  const records = [
    rec("chess", "Chess", "win", at(0, 1)),
    rec("chess", "Chess", "loss", at(2)),
    rec("chess", "Chess", "draw", at(10)),
    rec("checkers", "Checkers", "win", at(0, 2)),
    rec("sudoku", "Sudoku", "win", at(1)),
    rec("sudoku", "Sudoku", "abandoned", at(40)),
  ];
  const d = buildDashboard(records, now);

  check(d.totalPlayed === 6, `totalPlayed = 6 (got ${d.totalPlayed})`);
  check(d.triedCount === 3, `triedCount = 3 distinct games (got ${d.triedCount})`);
  check(d.catalogCount === CATALOG.length, "catalogCount matches the catalogue size");

  const chess = d.perGame.find((g) => g.entry.id === "chess");
  check(chess.played === 3 && chess.won === 1 && chess.lost === 1 && chess.drawn === 1, "chess record is 1-1-1 over 3");
  check(Math.abs(chess.winRate - 0.5) < 1e-9, `chess win rate = 50% (got ${pct(chess.winRate)})`);
  check(chess.last7 === 2 && chess.last30 === 3, `chess last7=2 last30=3 (got ${chess.last7}/${chess.last30})`);

  const sudoku = d.perGame.find((g) => g.entry.id === "sudoku");
  check(sudoku.won === 1 && sudoku.abandoned === 1, "sudoku: 1 cleared, 1 abandoned");
  check(sudoku.winRate === null, "solo win rate is null (not a versus game)");
  check(sudoku.last30 === 1, `sudoku last30=1, the 40-day game falls outside (got ${sudoku.last30})`);

  check(d.decisive === 3, `decisive versus games = 3 (got ${d.decisive})`);
  check(d.totalWins === 2, `versus wins = 2, solo clears excluded (got ${d.totalWins})`);
  check(Math.abs(d.overallWinRate - 2 / 3) < 1e-9, `overall win rate = 2/3 (got ${pct(d.overallWinRate)})`);
  check(d.mostPlayed.entry.id === "chess", "most-played game is chess");
  check(d.busiestCategory === "chess", "busiest category is chess");
  check(d.activeDays === 5, `active days = 5 distinct (got ${d.activeDays})`);

  check(!d.notPlayed.some((e) => ["chess", "checkers", "sudoku"].includes(e.id)), "notPlayed excludes everything played");
  check(d.notPlayed.length === CATALOG.length - 3, "notPlayed = catalogue minus the 3 played");

  check(d.byDay.length === 14, "activity sparkline covers 14 days");
  check(d.byDay.reduce((n, b) => n + b.count, 0) === 5, "byDay totals the 5 games inside the window");
  check(d.byDay[13].count === 2, "today's bucket has the 2 games played today");

  check(d.recent.length === 6 && d.recent[0].gameId === "chess", "recent list is newest-first");

  // empty archive is graceful
  const e = buildDashboard([], now);
  check(e.totalPlayed === 0 && e.overallWinRate === null && e.mostPlayed === null, "empty archive yields a safe zero state");
  check(e.notPlayed.length === CATALOG.length, "with no games, the whole catalogue is untried");

  // orphan record (a gameId no longer catalogued) still counts
  const o = buildDashboard([rec("retired-game", "Retired", "win", at(0))], now);
  check(o.totalPlayed === 1, "orphan record still counts toward totals");
}

console.log("\nArchetype (total + deterministic over synthetic archives):");
{
  const now = Date.UTC(2026, 5, 19, 12, 0, 0);
  const at = (days) => new Date(now - days * 86400000).toISOString();
  const rec = (gameId, outcome, endedISO, extra = {}) => ({
    id: gameId + endedISO + Math.random(), gameId, gameName: gameId, startedISO: endedISO,
    endedISO, outcome, humanSide: "w", opponent: "AI", moveCount: 0, moves: [], ...extra,
  });
  const idSet = new Set(ARCHETYPE_IDS);

  // empty archive
  const empty = deriveArchetype(buildDashboard([], now));
  check(empty.id === "unwritten", `empty archive → unwritten (got ${empty.id})`);

  // specialist: 20 games, 18 of them chess
  const spec = deriveArchetype(buildDashboard([
    ...Array.from({ length: 18 }, (_, i) => rec("chess", "win", at(i % 9))),
    rec("hearts", "loss", at(1)), rec("sudoku", "win", at(2)),
  ], now));
  check(spec.id === "specialist", `chess-only grinder → specialist (got ${spec.id})`);

  // apprentice: heavy hint use, low volume/variety
  const app = deriveArchetype(buildDashboard([
    rec("chess", "win", at(1), { assisted: true }),
    rec("chess", "loss", at(2), { assisted: true }),
    rec("hearts", "win", at(3), { assisted: true }),
    rec("sudoku", "win", at(4)),
    rec("gin", "loss", at(5)),
  ], now));
  check(app.id === "apprentice", `hint-heavy play → apprentice (got ${app.id})`);

  // explorer: one game each across many catalogue entries
  const many = CATALOG.slice(0, Math.ceil(CATALOG.length * 0.7)).map((e, i) =>
    rec(e.id, "win", at(i % 20)));
  const exp = deriveArchetype(buildDashboard(many, now));
  check(exp.id === "explorer", `wide variety → explorer (got ${exp.id})`);

  // totality: random archives always map to a known archetype and never throw
  const outcomes = ["win", "loss", "draw", "abandoned"];
  for (let trial = 0; trial < 200; trial++) {
    const n = trial % 37;
    const rs = Array.from({ length: n }, (_, i) => rec(
      CATALOG[(trial * 7 + i * 3) % CATALOG.length].id,
      outcomes[(trial + i) % 4],
      at((trial + i * 5) % 60),
      { assisted: (trial + i) % 3 === 0 || undefined },
    ));
    const a = deriveArchetype(buildDashboard(rs, now));
    if (!idSet.has(a.id)) { check(false, `trial ${trial}: unknown archetype id ${a.id}`); break; }
    if (!a.name || !a.icon || !a.blurb) { check(false, `trial ${trial}: archetype ${a.id} missing display fields`); break; }
  }
  check(true, "200 randomised archives all derived a valid archetype");

  // assisted counting flows through the dashboard
  const ad = buildDashboard([rec("chess", "win", at(0), { assisted: true }), rec("chess", "win", at(1))], now);
  check(ad.assistedCount === 1, `assistedCount = 1 (got ${ad.assistedCount})`);
  check(ad.perGame.find((g) => g.entry.id === "chess").assisted === 1, "per-game assisted tally");
}

console.log("\nCoach brief:");
{
  const now = Date.UTC(2026, 5, 19, 12, 0, 0);
  const rec = (gameId, outcome) => ({
    id: gameId + Math.random(), gameId, gameName: gameId,
    startedISO: new Date(now).toISOString(), endedISO: new Date(now).toISOString(),
    outcome, humanSide: "w", opponent: "AI", moveCount: 0, moves: [],
  });
  const prog = {
    level: 7, xp: 1234, puzzleRating: 950, puzzlesSolved: 40, dayStreak: 4,
    botRecord: { won: 3, drawn: 1, lost: 2 },
  };
  for (const records of [[], [rec("chess", "win"), rec("hearts", "loss")]]) {
    const d = buildDashboard(records, now);
    const brief = buildCoachBrief(d, deriveArchetype(d), prog, new Date(now).toISOString());
    check(brief.startsWith("# ChessRetabled coaching brief"), "brief has the markdown header");
    check(!brief.includes("undefined") && !brief.includes("NaN") && !brief.includes("[object"),
      `brief has no leaked placeholders (records=${records.length})`);
    check(brief.includes("What I want from you"), "brief ends with the coaching request");
  }
}

console.log("\nSuggestions:");
{
  const now = Date.UTC(2026, 5, 19, 12, 0, 0);
  const at = (daysAgo) => new Date(now - daysAgo * 86400000).toISOString();
  const rec = (gameId, outcome, endedISO) => ({
    id: gameId + endedISO + Math.random(), gameId, gameName: gameId,
    startedISO: endedISO, endedISO, outcome,
    humanSide: "w", opponent: "AI", moveCount: 0, moves: [],
  });
  const shapeOk = (list) =>
    list.every((s) => s.id && s.kind && s.icon && s.title && s.reason && s.cta && s.path.startsWith("/"));

  // Empty archive: still gives a full set, and offers something untried.
  const empty = suggestActivities(buildDashboard([], now), { now });
  check(empty.length === 3, `cold start yields 3 suggestions (got ${empty.length})`);
  check(shapeOk(empty), "cold-start suggestions are fully populated");
  check(empty.some((s) => s.kind === "fresh"), "cold start offers something never tried");

  // Nothing today → the streak nudge; something today → no streak nudge.
  check(suggestActivities(buildDashboard([rec("chess", "win", at(3))], now), { now })
    .some((s) => s.kind === "streak"), "idle day suggests a quick puzzle");
  check(!suggestActivities(buildDashboard([rec("chess", "win", at(0))], now), { now })
    .some((s) => s.kind === "streak"), "a game logged today drops the streak nudge");

  // A losing record surfaces as "needs work".
  const losing = [rec("hearts", "loss", at(1)), rec("hearts", "loss", at(2)), rec("hearts", "loss", at(3)), rec("hearts", "win", at(4))];
  const weak = suggestActivities(buildDashboard(losing, now), { now, seed: 7 });
  check(weak.length === 3 && shapeOk(weak), "suggestions stay well-formed with history");

  // Lessons: incomplete → a lesson link; the rule must survive an empty map.
  const withLesson = suggestActivities(buildDashboard([], now), { now, lessons: {}, seed: 5 });
  check(withLesson.every((s) => s.path !== "/learn/undefined/undefined"), "lesson paths are concrete");

  // Reshuffling walks the list instead of repeating the same three.
  const base = suggestActivities(buildDashboard(losing, now), { now, seed: 0 });
  let moved = false;
  for (let s = 1; s < 6; s++) {
    const next = suggestActivities(buildDashboard(losing, now), { now, seed: s });
    if (next.map((x) => x.id).join() !== base.map((x) => x.id).join()) moved = true;
  }
  check(moved, "“something else” produces a different set");

  // Totality: never throws, never empty, over randomised archives.
  const outcomes = ["win", "loss", "draw", "abandoned"];
  let ok = true;
  for (let trial = 0; trial < 200 && ok; trial++) {
    const rs = Array.from({ length: trial % 25 }, (_, i) =>
      rec(CATALOG[(trial * 5 + i * 3) % CATALOG.length].id, outcomes[(trial + i) % 4], at((trial + i * 4) % 40)));
    const list = suggestActivities(buildDashboard(rs, now), { now, seed: trial, streak: trial % 9 });
    if (list.length === 0 || !shapeOk(list)) { ok = false; check(false, `trial ${trial}: bad suggestion set`); }
  }
  if (ok) check(true, "200 randomised archives all produced usable suggestions");
}

console.log("\nFormatters:");
{
  check(pct(null) === "—" && pct(0.5) === "50%" && pct(1) === "100%", "pct formats ratios");
  const now = Date.UTC(2026, 5, 19, 12, 0, 0);
  check(relativeTime(new Date(now - 5 * 60000).toISOString(), now) === "5m ago", "relativeTime minutes");
  check(relativeTime(new Date(now - 3 * 3600000).toISOString(), now) === "3h ago", "relativeTime hours");
  check(relativeTime(new Date(now - 2 * 86400000).toISOString(), now) === "2d ago", "relativeTime days");
}

console.log(`\n[validate-stats] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
