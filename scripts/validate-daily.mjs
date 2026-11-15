// Headless verification for the daily challenge.
//
// The claim the whole feature rests on is "everyone gets the same puzzle from
// the date alone, with no server". That is only true if (a) the date -> puzzle
// mapping is pure and stable and (b) every one of the 25 generators really is
// deterministic under a pinned seed. Both are checked here, the second by
// generating each puzzle twice and comparing.
import { readFileSync } from "node:fs";
import {
  DAILY_EPOCH, dailyKey, dailyPool, dailyNumber, dayIndex, dailySeed,
  dailyPuzzleId, shiftKey, streak, totalSolved, recentKeys, shareText,
} from "../src/logic/daily.ts";
import { LOGIC_PUZZLES } from "../src/logic/registry.ts";
import { pinSeed, randomSeed } from "../src/cards/core/rng.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  x ${msg}`); problems++; }
}

const POOL = dailyPool();

console.log("Day keys and arithmetic:");
check(/^\d{4}-\d{2}-\d{2}$/.test(dailyKey(new Date())), "the key for today is YYYY-MM-DD");
check(dailyKey(new Date(2026, 0, 5)) === "2026-01-05", "months and days are zero-padded");
check(dailyNumber(DAILY_EPOCH) === 1, "the epoch is puzzle #1");
check(dayIndex(DAILY_EPOCH) === 0, "the epoch is day 0");
check(shiftKey("2026-01-31", 1) === "2026-02-01", "steps across a month boundary");
check(shiftKey("2026-12-31", 1) === "2027-01-01", "steps across a year boundary");
check(shiftKey("2028-02-28", 1) === "2028-02-29", "knows 2028 is a leap year");
check(shiftKey("2027-02-28", 1) === "2027-03-01", "knows 2027 is not");
check(shiftKey(shiftKey("2026-06-15", -9), 9) === "2026-06-15", "shifting round-trips");
check(dayIndex("2026-01-02") - dayIndex("2026-01-01") === 1, "consecutive days differ by 1");
{
  // Stepping back a day must stay correct across a DST change, which is why the
  // arithmetic reads keys as UTC rather than local midnight.
  let k = "2026-03-10", ok = true;
  for (let i = 0; i < 400; i++) {
    const back = shiftKey(k, -1);
    if (dayIndex(k) - dayIndex(back) !== 1) ok = false;
    k = back;
  }
  check(ok, "400 consecutive backward steps each move exactly one day");
}

console.log("\nDate to puzzle:");
check(dailySeed("2026-05-05") === dailySeed("2026-05-05"), "the same date gives the same seed");
check(dailySeed("2026-05-05") !== dailySeed("2026-05-06"), "a different date gives a different seed");
check(dailySeed("2026-05-05") > 0, "the seed is a positive int32");
{
  const seeds = new Set();
  let k = DAILY_EPOCH;
  for (let i = 0; i < 1000; i++) { seeds.add(dailySeed(k)); k = shiftKey(k, 1); }
  check(seeds.size === 1000, "1000 consecutive days give 1000 distinct seeds");
}
check(dailyPuzzleId("2026-05-05") === dailyPuzzleId("2026-05-05"), "the same date gives the same puzzle");
check(POOL.length === LOGIC_PUZZLES.length && POOL.length === 25, "the pool is all 25 puzzles");
{
  // The point of the block-shuffle: no puzzle repeats until all have run.
  let allWindowsComplete = true, allReal = true;
  let k = DAILY_EPOCH;
  const ids = [];
  for (let i = 0; i < 25 * 12; i++) { ids.push(dailyPuzzleId(k)); k = shiftKey(k, 1); }
  for (const id of ids) if (!POOL.includes(id)) allReal = false;
  for (let b = 0; b < 12; b++) {
    const win = ids.slice(b * 25, b * 25 + 25);
    if (new Set(win).size !== 25) allWindowsComplete = false;
  }
  check(allReal, "every scheduled id is a real registry puzzle");
  check(allWindowsComplete, "each run of 25 days covers all 25 puzzles with no repeat");
  check(new Set(ids.slice(0, 25)).size === 25, "the first 25 days are 25 different puzzles");
  check(ids[0] !== ids[25] || ids[1] !== ids[26], "consecutive blocks are not the same order");
}
{
  // Dates before the epoch must not crash or fall off the pool.
  let ok = true;
  let k = DAILY_EPOCH;
  for (let i = 0; i < 40; i++) { k = shiftKey(k, -1); if (!POOL.includes(dailyPuzzleId(k))) ok = false; }
  check(ok, "dates before the epoch still schedule a real puzzle");
}

console.log("\nThe seed pin (what makes the daily shared):");
check(randomSeed() !== undefined, "randomSeed works unpinned");
pinSeed(12345);
check(randomSeed() === 12345, "a pinned seed is what randomSeed returns");
check(randomSeed() === 12345 && randomSeed() === 12345, "it keeps returning it");
pinSeed(null);
{
  const a = randomSeed(), b = randomSeed(), c = randomSeed();
  check(!(a === b && b === c), "clearing the pin restores randomness");
}

console.log("\nEvery puzzle is reproducible from a pinned seed:");
// The real test: each component generates with generate(randomSeed()), so if any
// generator reached for Math.random the daily would differ per player.
const MODULES = {
  sudoku: ["sudoku.ts", "generate"], kenken: ["kenken.ts", "generate"],
  futoshiki: ["futoshiki.ts", "generate"], nonogram: ["nonogram.ts", "generate"],
  binairo: ["binairo.ts", "generate"], hitori: ["hitori.ts", "generate"],
  skyscrapers: ["skyscrapers.ts", "generate"], hidato: ["hidato.ts", "generate"],
  akari: ["akari.ts", "generate"], kakuro: ["kakuro.ts", "generate"],
  suguru: ["suguru.ts", "generate"], starbattle: ["starbattle.ts", "generate"],
  shikaku: ["shikaku.ts", "generate"], mosaic: ["mosaic.ts", "generate"],
  aquarium: ["aquarium.ts", "generate"], kakurasu: ["kakurasu.ts", "generate"],
  lightsout: ["lightsout.ts", "generate"], slide: ["slide.ts", "initSlide"],
  mastermind: ["mastermind.ts", "makeSecret"], slitherlink: ["slitherlink.ts", "generate"],
  masyu: ["masyu.ts", "generate"], nurikabe: ["nurikabe.ts", "generate"],
  bridges: ["bridges.ts", "generate"], tents: ["tents.ts", "generate"],
  numberlink: ["numberlink.ts", "generate"],
};
check(Object.keys(MODULES).length === 25, "all 25 puzzles are covered below");
for (const id of POOL) {
  const entry = MODULES[id];
  if (!entry) { check(false, `${id}: no generator mapped`); continue; }
  const [file, fn] = entry;
  const mod = await import(`../src/logic/${file}`);
  const gen = mod[fn];
  if (typeof gen !== "function") { check(false, `${id}: ${fn} is not exported`); continue; }
  pinSeed(dailySeed("2026-07-04"));
  const first = JSON.stringify(gen(randomSeed()));
  const second = JSON.stringify(gen(randomSeed()));
  pinSeed(null);
  check(first === second, `${id}: the pinned seed reproduces the identical puzzle`);

  // A generator that gives up and returns a hardcoded fallback looks fine on a
  // single seed but serves everyone the same board. Kakuro did exactly that for
  // 76 of every 80 seeds, so this sweeps a fortnight of real dates: near-total
  // collapse is the signal, one coincidental repeat is not.
  let k = "2026-07-04";
  const fortnight = new Set();
  for (let d = 0; d < 14; d++) { fortnight.add(JSON.stringify(gen(dailySeed(k)))); k = shiftKey(k, 1); }
  check(fortnight.size >= 13, `${id}: 14 days give 14 different puzzles (got ${fortnight.size})`);
}

console.log("\nStreaks:");
const res = (...keys) => Object.fromEntries(keys.map((k) => [k, { puzzleId: "sudoku", solvedISO: k }]));
check(streak({}, "2026-06-10") === 0, "no history is no streak");
check(streak(res("2026-06-10"), "2026-06-10") === 1, "solving today is a 1-day streak");
check(streak(res("2026-06-08", "2026-06-09", "2026-06-10"), "2026-06-10") === 3, "three in a row counts 3");
check(
  streak(res("2026-06-08", "2026-06-09"), "2026-06-10") === 2,
  "an unsolved today does not break the run before the day is over"
);
check(
  streak(res("2026-06-07", "2026-06-09", "2026-06-10"), "2026-06-10") === 2,
  "a missed day ends the run"
);
check(streak(res("2026-06-01"), "2026-06-10") === 0, "an old solve is not a current streak");
check(
  streak(res("2026-02-28", "2026-02-27", "2026-03-01"), "2026-03-01") === 3,
  "a streak spans a month boundary"
);
check(totalSolved(res("2026-01-01", "2026-02-02")) === 2, "total counts every solved day");
check(recentKeys("2026-06-10").length === 7, "the week strip is 7 days");
check(recentKeys("2026-06-10")[6] === "2026-06-10", "the week strip ends today");
check(recentKeys("2026-06-10")[0] === "2026-06-04", "the week strip starts 6 days back");

console.log("\nShare text is spoiler-free:");
{
  const r = res("2026-06-09", "2026-06-10");
  const txt = shareText(r, "2026-06-10");
  const id = dailyPuzzleId("2026-06-10");
  const puzzle = JSON.stringify(
    (await import(`../src/logic/${MODULES[id][0]}`))[MODULES[id][1]](dailySeed("2026-06-10"))
  );
  const longRuns = (puzzle.match(/\d+/g) ?? []).filter((n) => n.length >= 4);
  check(txt.includes("Retabled Daily"), "the share text names the app");
  check(txt.includes(`#${dailyNumber("2026-06-10")}`), "it carries the puzzle number");
  check(txt.split("\n").length === 2, "it is two short lines");
  check(!longRuns.some((n) => txt.includes(n)), "it leaks no long digit run from the grid");
  check(!/solution|answer/i.test(txt), "it says nothing about the solution");
  check(txt === shareText(r, "2026-06-10"), "it is stable for the same input");
  check(shareText({}, "2026-06-10").includes("⬜"), "an empty week shows as missed days");
}

console.log("\nWiring:");
{
  // The component map is .tsx, so it cannot be imported headlessly - but a
  // missing key means a blank daily, so check it textually.
  const src = readFileSync("src/logic/ui/components.tsx", "utf8");
  const missing = POOL.filter((id) => !new RegExp(`^\\s*${id}:`, "m").test(src));
  check(missing.length === 0, `every puzzle has a component (missing: ${missing.join(", ") || "none"})`);
  const app = readFileSync("src/App.tsx", "utf8");
  check(app.includes('path="/daily"'), "the /daily route is registered");
  const dt = readFileSync("src/state/dataTransfer.ts", "utf8");
  check(/daily/.test(dt), "daily results ride along in the export/sync bundle");
}

console.log(`\n[validate-daily] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
