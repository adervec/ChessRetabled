// Headless verification for the dashboard analytics: the unified catalogue is
// well-formed, and buildDashboard() aggregates a synthetic archive correctly.
// Pure modules, driven via Node 24 type-stripping — no UI.
import { CATALOG, CATALOG_BY_ID, CATEGORY_ORDER } from "../src/catalog.ts";
import { buildDashboard, pct, relativeTime } from "../src/state/stats.ts";

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
