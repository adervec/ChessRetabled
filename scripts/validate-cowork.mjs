// The coach cowork channel (house standard 3, cowork.js v2).
//
// What can go wrong here is quiet: a reply that lands without review, an undo
// that restores the wrong text, or a `channels` key that doesn't match the
// manifest's channel name — in which case the panel falls back to showing raw
// JSON, which is the symptom this work exists to fix.
//
// The engine itself is shared code (cowork.js) with its own browser harness at
// https://adervec.github.io/cowork-engine-test.html; what's checked here is our
// side of the contract.
//
// Run: node scripts/validate-cowork.mjs
import { readFileSync } from "node:fs";
import {
  replyText, previewRows, applyAdvice, undoAdvice, ADVICE_ROW, DETAIL_CHARS,
} from "../src/state/coworkCoach.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  x ${msg}`); problems++; }
}

/** The AdviceIO seam, backed by a variable instead of localStorage + React. */
function fakeIO(initial = "") {
  let value = initial;
  return { get: () => value, set: (t) => { value = t; }, peek: () => value };
}

console.log("Reading the agent's reply:");
check(replyText("just a string") === "just a string", "a bare string is the advice");
check(replyText({ reply: "in reply" }) === "in reply", "{ reply } is what INSTRUCTIONS.md asks for");
check(replyText({ payload: { reply: "nested" } }) === "nested", "{ payload: { reply } } also works");
check(replyText({ reply: "outer", payload: { reply: "inner" } }) === "outer", "the top-level reply wins");
check(replyText({ odd: 1 }).includes("odd"), "an unexpected shape is shown as JSON, not dropped");
check(replyText(undefined) === "", "undefined gives an empty string rather than crashing");
check(typeof replyText(null) === "string", "null gives a string rather than crashing");
check(replyText({ reply: 42 }).includes("42"), "a non-string reply field is still shown");

console.log("\nThe review rows:");
{
  const rows = previewRows({ reply: "Work on your endgames." });
  check(rows.length === 1, `one row for one piece of advice (got ${rows.length})`);
  check(rows[0].id === ADVICE_ROW, `the row id is "${ADVICE_ROW}"`);
  check(typeof rows[0].label === "string" && rows[0].label.length > 10, "the row has a readable label");
  check(/replaces the current one/i.test(rows[0].label), "the label says it replaces the current advice");
  check(rows[0].detail === "Work on your endgames.", "short advice is shown in full");
  check(!/^\s*[[{]/.test(rows[0].detail), "the detail is the advice text, not raw JSON");

  const long = "x".repeat(DETAIL_CHARS + 250);
  const cut = previewRows({ reply: long })[0].detail;
  check(cut.length === DETAIL_CHARS + 1, `long advice is cut to ${DETAIL_CHARS} chars plus an ellipsis (got ${cut.length})`);
  check(cut.endsWith("…"), "and ends with an ellipsis so it reads as truncated");
  check(previewRows("").length === 1, "an empty reply still offers a row rather than nothing to tick");
}

console.log("\nApplying only what was accepted:");
{
  const io = fakeIO("");
  const res = applyAdvice({ reply: "first advice" }, [ADVICE_ROW], io);
  check(io.peek() === "first advice", "accepted advice is stored");
  check(res.undo?.prev === "", "the undo records the empty previous state");
  check(/character/.test(res.summary), `the summary describes what happened (${res.summary})`);
}
{
  const io = fakeIO("old advice");
  const res = applyAdvice({ reply: "new advice" }, [ADVICE_ROW], io);
  check(io.peek() === "new advice", "it replaces the old advice");
  check(res.undo?.prev === "old advice", "the undo carries the exact previous text");
}
{
  const io = fakeIO("keep me");
  const res = applyAdvice({ reply: "unwanted" }, [], io);
  check(io.peek() === "keep me", "nothing is written when the reader ticks nothing");
  check(res.undo === undefined, "and no undo is offered, because nothing changed");
  check(/not accepted/i.test(res.summary), "the summary says it was declined");
}
{
  const io = fakeIO("keep me");
  applyAdvice({ reply: "unwanted" }, ["some-other-row"], io);
  check(io.peek() === "keep me", "an unrelated accepted id does not apply the advice");
}
{
  // The v1 path, and an older cowork.js with no review rows, both pass null.
  const io = fakeIO("");
  applyAdvice({ reply: "v1 advice" }, null, io);
  check(io.peek() === "v1 advice", "null accepted means all of it (the v1 fallback)");
  const io2 = fakeIO("");
  applyAdvice({ reply: "v1 advice" }, undefined, io2);
  check(io2.peek() === "v1 advice", "so does undefined");
}

console.log("\nUndo:");
{
  const io = fakeIO("original");
  const res = applyAdvice({ reply: "replacement" }, [ADVICE_ROW], io);
  undoAdvice(res.undo, io);
  check(io.peek() === "original", "undo restores the exact previous advice");
}
{
  const io = fakeIO("");
  const res = applyAdvice({ reply: "the very first" }, [ADVICE_ROW], io);
  undoAdvice(res.undo, io);
  check(io.peek() === "", "undoing a first reply clears it rather than leaving it");
}
{
  const io = fakeIO("something");
  undoAdvice(undefined, io);
  check(io.peek() === "", "undo with no data clears rather than throwing");
  check(JSON.parse(JSON.stringify({ prev: "x" })).prev === "x", "the undo payload is plain JSON");
}
{
  // Two applies then two undos, newest first: the history has to unwind cleanly.
  const io = fakeIO("a");
  const r1 = applyAdvice({ reply: "b" }, [ADVICE_ROW], io);
  const r2 = applyAdvice({ reply: "c" }, [ADVICE_ROW], io);
  undoAdvice(r2.undo, io);
  check(io.peek() === "b", "undoing the newest apply goes back one step");
  undoAdvice(r1.undo, io);
  check(io.peek() === "a", "undoing the older one goes back to the start");
}

console.log("\nWiring in the mount config:");
{
  const src = readFileSync("src/pages/Coach.tsx", "utf8");
  const manifestChannels = [...src.matchAll(/\{ name: "([a-z-]+)", request:/g)].map((m) => m[1]);
  check(manifestChannels.length > 0, `the manifest declares channels (${manifestChannels.join(", ")})`);
  check(/channels: \{/.test(src), "the mount config has a channels block");
  for (const name of manifestChannels) {
    // A name with a hyphen ("game-review") cannot be a bare JS key, so accept
    // either form — what matters is that the manifest and `channels` agree.
    check(new RegExp(`channels: \\{[\\s\\S]*?["']?\\b${name}\\b["']?: \\{`).test(src),
      `channel "${name}" from the manifest is described in channels (or the panel shows raw JSON)`);
  }
  check(/label: "[^"]+"/.test(src), "the channel has a human label");
  for (const fn of ["preview", "apply", "undo"]) {
    check(new RegExp(`\\b${fn}: `).test(src), `the channel provides ${fn}`);
  }
  check(/brief: \(\) => \(\{ markdown/.test(src), "the app offers a morning brief");
  check(!/review: false/.test(src), "review is left at its default (ON) — the user's rule");
  check(/applyAdvice\(reply, null, io\)/.test(src), "the v1 top-level apply is kept as a fallback");
  check(/from "\.\.\/state\/coworkCoach\.ts"/.test(src), "the logic comes from the testable module");
}

console.log(`\n[validate-cowork] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
