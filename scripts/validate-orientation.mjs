// Checks the per-game layout model in src/state/orientation.ts: every catalogue
// entry resolves to a layout, the precedence chain is what it claims to be, and
// — the property the whole thing exists for — a game on screen never changes
// arrangement because the device was turned.
//
//   node scripts/validate-orientation.mjs

import { logicalOrientation, resolveLayout } from "../src/state/orientation.ts";
import { CATALOG } from "../src/catalog.ts";

let checks = 0;
let problems = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    problems++;
    console.error("  FAIL " + msg);
  }
}

// ---- totality: every game has a sane default -------------------------------
for (const e of CATALOG) {
  const l = logicalOrientation(e.id);
  check(l === "portrait" || l === "landscape", `${e.id} resolved to "${l}"`);
}
check(logicalOrientation("no-such-game") === "landscape", "unknown ids fall back");
check(logicalOrientation("") === "landscape", "empty id falls back");

// ---- the defaults follow board shape ---------------------------------------
// Square board → panel beside it; wide board → panel underneath.
for (const [id, want] of [
  ["chess", "landscape"],
  ["checkers", "landscape"],
  ["gomoku", "landscape"],
  ["nine-mens-morris", "landscape"],
  ["connect-four", "portrait"], // 7x6
  ["hex", "portrait"], // 608x380 rhombus
  ["fanorona", "portrait"], // 660x380
  ["klondike", "portrait"], // seven tableau columns
  ["golf", "portrait"],
  ["pyramid", "portrait"],
  ["blackjack", "landscape"],
  ["holdem", "landscape"],
  ["sudoku", "portrait"],
  ["nonogram", "portrait"],
]) {
  const got = logicalOrientation(id);
  check(got === want, `${id} should default to ${want}, got ${got}`);
}

// ---- precedence ------------------------------------------------------------
const base = { gameId: "chess", perGame: {}, global: "auto", deviceIsLandscape: false };

check(resolveLayout(base) === "landscape", "logical default applies when nothing is pinned");
check(
  resolveLayout({ ...base, perGame: { chess: "portrait" } }) === "portrait",
  "a per-game pin beats the logical default"
);
check(
  resolveLayout({ ...base, global: "portrait" }) === "portrait",
  "the app-wide setting beats the logical default"
);
check(
  resolveLayout({ ...base, perGame: { chess: "landscape" }, global: "portrait" }) === "landscape",
  "a per-game pin beats the app-wide setting"
);
check(
  resolveLayout({ ...base, perGame: { klondike: "landscape" } }) === "landscape",
  "another game's pin does not leak (chess still uses its own default)"
);
check(
  resolveLayout({ ...base, perGame: { chess: "auto" } }) === "landscape",
  '"auto" is the same as unpinned'
);

// ---- with no game open, the device decides ---------------------------------
check(
  resolveLayout({ ...base, gameId: null, deviceIsLandscape: true }) === "landscape",
  "no game + turned device → landscape"
);
check(
  resolveLayout({ ...base, gameId: null, deviceIsLandscape: false }) === "portrait",
  "no game + upright device → portrait"
);
check(
  resolveLayout({ ...base, gameId: null, global: "landscape", deviceIsLandscape: false }) === "landscape",
  "an explicit app-wide setting still beats the device"
);

// ---- the point of the whole exercise ---------------------------------------
// For every game, in every pin state, turning the device must change nothing.
for (const e of CATALOG) {
  for (const perGame of [{}, { [e.id]: "portrait" }, { [e.id]: "landscape" }, { [e.id]: "auto" }]) {
    for (const global of ["auto", "portrait", "landscape"]) {
      const upright = resolveLayout({ gameId: e.id, perGame, global, deviceIsLandscape: false });
      const turned = resolveLayout({ gameId: e.id, perGame, global, deviceIsLandscape: true });
      check(
        upright === turned,
        `${e.id} (pin=${JSON.stringify(perGame[e.id] ?? null)}, global=${global}) changed with the device: ${upright} → ${turned}`
      );
    }
  }
}

console.log(`\n[validate-orientation] games=${CATALOG.length} checks=${checks} problems=${problems}`);
if (problems > 0) process.exit(1);
