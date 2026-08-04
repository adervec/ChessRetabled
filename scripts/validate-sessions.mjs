// The abandon policy decides whether walking away costs you a game. Getting it
// wrong in either direction is bad: punish a misclick and the record is a lie,
// forgive a resignation and every losing position has a free exit.
//
//   node scripts/validate-sessions.mjs

import {
  judgeAbandon,
  isEngaged,
  abandonLabel,
  ENGAGED_MOVES,
  ENGAGED_MS,
} from "../src/state/abandon.ts";
import { otherSessions } from "../src/state/useSessions.ts";
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

const V = (o) => judgeAbandon(o).outcome;

/* ---- backing out of a misclick costs nothing ---------------------------- */
check(V({ moveCount: 0, elapsedMs: 0, kind: "versus" }) === "discard", "opening a board and leaving costs nothing");
check(V({ moveCount: 1, elapsedMs: 4000, kind: "versus" }) === "discard", "one move in is still a misclick");
check(
  V({ moveCount: ENGAGED_MOVES - 1, elapsedMs: ENGAGED_MS - 1, kind: "versus" }) === "discard",
  "just under both thresholds is not a game"
);
check(
  V({ moveCount: 0, elapsedMs: 0, kind: "versus", losing: true }) === "discard",
  "a losing evaluation on an untouched board is meaningless"
);

/* ---- a game you were playing counts ------------------------------------- */
check(V({ moveCount: ENGAGED_MOVES, elapsedMs: 0, kind: "versus" }) === "loss", "enough moves makes it a game");
check(V({ moveCount: 0, elapsedMs: ENGAGED_MS, kind: "versus" }) === "loss", "enough time makes it a game");
check(V({ moveCount: 40, elapsedMs: 600000, kind: "versus" }) === "loss", "a long game is a resignation");
check(
  V({ moveCount: 30, elapsedMs: 300000, kind: "versus", losing: true }) === "loss",
  "leaving a lost position is a resignation"
);
check(
  judgeAbandon({ moveCount: 30, elapsedMs: 3e5, kind: "versus", losing: true }).reason.includes("losing"),
  "the reason says why when you were losing"
);

/* ---- a puzzle has nobody to lose to ------------------------------------- */
check(V({ moveCount: 50, elapsedMs: 600000, kind: "solo" }) === "abandoned", "an unfinished solve is not a defeat");
check(V({ moveCount: 1, elapsedMs: 500, kind: "solo" }) === "discard", "a glance at a puzzle costs nothing");
check(
  V({ moveCount: 99, elapsedMs: 9e6, kind: "solo", losing: true }) === "abandoned",
  "solo never becomes a loss, however long you were at it"
);

/* ---- every verdict is explained and actionable -------------------------- */
for (const kind of ["versus", "solo"]) {
  for (const moveCount of [0, 1, 3, 4, 10, 200]) {
    for (const elapsedMs of [0, 1000, ENGAGED_MS, 9e6]) {
      for (const losing of [undefined, true, false]) {
        const v = judgeAbandon({ moveCount, elapsedMs, kind, losing });
        check(
          ["loss", "abandoned", "discard"].includes(v.outcome),
          `unknown outcome for ${kind}/${moveCount}/${elapsedMs}`
        );
        check(v.reason.length > 10, `verdict for ${kind}/${moveCount} has no explanation`);
        check(abandonLabel(v).length > 0, "every verdict has a button label");
      }
    }
  }
}

/* ---- engagement is monotonic: more play never becomes less of a game ----- */
let sawLoss = false;
for (const n of [0, 1, 2, 3, 4, 5, 10, 50]) {
  const engaged = isEngaged({ moveCount: n, elapsedMs: 0 });
  if (engaged) sawLoss = true;
  check(!sawLoss || engaged, `engagement flipped back off at ${n} moves`);
}

/* ---- solo/versus comes from the catalogue, so every game has an answer --- */
for (const e of CATALOG) {
  const v = judgeAbandon({ moveCount: 10, elapsedMs: 2e5, kind: e.kind });
  check(
    e.kind === "solo" ? v.outcome === "abandoned" : v.outcome === "loss",
    `${e.id} (${e.kind}) resolved to ${v.outcome}`
  );
}

/* ---- the bar never offers you the game you are already looking at -------- */
const list = [
  { gameId: "chess", gameName: "Chess" },
  { gameId: "hex", gameName: "Hex" },
];
check(otherSessions(list, "chess").length === 1, "the active game is hidden from the bar");
check(otherSessions(list, "chess")[0].gameId === "hex", "the other game is still offered");
check(otherSessions(list, null).length === 2, "with no game open, everything is offered");
check(otherSessions([], "chess").length === 0, "no sessions, nothing to show");

console.log(`\n[validate-sessions] catalogue=${CATALOG.length} checks=${checks} problems=${problems}`);
if (problems > 0) process.exit(1);
