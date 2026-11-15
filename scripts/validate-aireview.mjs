// The game-review cowork channel (house standard 18): an AI second opinion on
// the games this app already graded by algorithm.
//
// This is the only channel whose reply is *stored and rendered*, and it is written
// by an agent that read outside content — so the reply is untrusted input at a
// trust boundary. Most of what follows is that: a review for a game we never
// asked about must not land, a grade must not be stored unchecked, and an apply
// must never overwrite the app's own verdict.
//
// Run: node scripts/validate-aireview.mjs
import { readFileSync } from "node:fs";
import {
  REVIEW_CHANNEL, REVIEW_INSTRUCTIONS, MAX_SESSIONS, applyReviews, buildRequest,
  parseReviews, pendingSessions, previewRows, requestHash, trendHistory, undoReviews,
} from "../src/state/coworkGameReview.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  x ${msg}`); problems++; }
}

const appGrade = (accuracy = 80) => ({
  accuracy, method: "fixed depth 5", turningPointPly: 12,
  counts: { best: 10, inaccuracy: 2 }, gradedISO: "2026-11-14T10:00:00.000Z",
});
const rec = (id, endedISO, gameId = "chess") => ({
  id, gameId, gameName: "Chess", endedISO, outcome: "win", opponent: "AI", moves: ["e4", "e5"],
});

/** The store seam, backed by a plain object. */
function fakeIO(initial = {}) {
  const byRecord = structuredClone(initial);
  return {
    get: (id) => byRecord[id],
    setAi: (id, ai) => { byRecord[id] = { ...byRecord[id], ai }; },
    removeAi: (id) => { if (byRecord[id]) delete byRecord[id].ai; },
    all: () => byRecord,
  };
}

console.log("Which games get sent:");
{
  const records = [rec("a", "2026-11-10"), rec("b", "2026-11-12"), rec("c", "2026-11-11")];
  const graded = { a: { app: appGrade() }, b: { app: appGrade() }, c: {} };
  const out = pendingSessions(records, graded);
  check(out.length === 2, `only graded games are offered (got ${out.length})`);
  check(out.map((r) => r.id).join() === "b,a", `newest first (got ${out.map((r) => r.id).join()})`);
  check(!out.some((r) => r.id === "c"), "a game the app has not graded is not sent");
}
{
  // "Sessions since the last review" falls out of this: an applied review stops
  // the session being pending, so it can never be sent twice.
  const records = [rec("a", "2026-11-10")];
  check(pendingSessions(records, { a: { app: appGrade() } }).length === 1, "a graded, unreviewed game is pending");
  check(pendingSessions(records, { a: { app: appGrade(), ai: { grade: "B" } } }).length === 0,
    "once reviewed it stops being pending — never sent twice");
}
{
  const many = Array.from({ length: 12 }, (_, i) => rec(`r${i}`, `2026-11-${String(i + 1).padStart(2, "0")}`));
  const graded = Object.fromEntries(many.map((r) => [r.id, { app: appGrade() }]));
  check(pendingSessions(many, graded).length === MAX_SESSIONS,
    `the request is capped at ${MAX_SESSIONS} sessions (move lists are not small)`);
  check(trendHistory(many, graded).length === 12, "but the trend history covers more games");
  check(
    trendHistory(many, graded).every((h) => !("moves" in h)),
    "the trend history carries scores only, never move lists"
  );
}

console.log("\nThe request:");
{
  const records = [rec("a", "2026-11-12")];
  const graded = { a: { app: appGrade(77) } };
  const sessions = pendingSessions(records, graded).map((r) => ({ ...r, appScore: graded[r.id].app }));
  const req = buildRequest(sessions, trendHistory(records, graded), "2026-11-14T12:00:00.000Z");
  check(req.kind === "game-review-request", "it is labelled as a game-review request");
  check(typeof req.requestHash === "string" && req.requestHash.length > 0, "it carries a requestHash to echo");
  check(req.payload.sessions.length === 1, "one entry per session");
  const s = req.payload.sessions[0];
  check(s.sessionId === "a", "the session id is the archive record id");
  check(s.appScore.accuracy === 77, "the app's own score rides along");
  check(s.appScore.counts.best === 10, "and its breakdown, so the AI grades the same thing");
  check(Array.isArray(s.moves) && s.moves.length === 2, "the raw move list is included");
  check(req.payload.history.length === 1, "recent history is included for trend");
  // The hash must follow the content, or a stale reply could be accepted.
  const other = buildRequest(
    [{ ...sessions[0], appScore: appGrade(42) }], [], "2026-11-14T12:00:00.000Z"
  );
  check(req.requestHash !== other.requestHash, "a different request hashes differently");
  check(requestHash({ x: 1 }) === requestHash({ x: 1 }), "the hash is stable for the same content");
}

console.log("\nAn untrusted reply cannot reach a game we did not ask about:");
const ASKED = ["a", "b"];
check(parseReviews({ reviews: [{ sessionId: "zz", grade: "A", summary: "x" }] }, ASKED).length === 0,
  "a review for an unknown session is dropped");
check(parseReviews({ reviews: [{ sessionId: "a", grade: "A", summary: "ok" }] }, ASKED).length === 1,
  "a review for a session we asked about is kept");
check(parseReviews({ reviews: [{ sessionId: "a" }, { sessionId: "a" }] }, ASKED).length === 1,
  "a duplicate session is taken once");
check(parseReviews({ reviews: "not a list" }, ASKED).length === 0, "a non-list reviews field is ignored");
check(parseReviews(null, ASKED).length === 0, "a null reply is ignored");
check(parseReviews({ reviews: [null, 5, "x"] }, ASKED).length === 0, "junk entries are ignored");
check(parseReviews({}, ASKED).length === 0, "a reply with no reviews is ignored");

console.log("\nAnd cannot store anything unchecked:");
{
  const [r] = parseReviews({ reviews: [{ sessionId: "a", grade: "banana", summary: "s" }] }, ASKED);
  check(r.grade === "?", `a grade outside A–E becomes "?" (got ${r.grade})`);
}
{
  const [r] = parseReviews({ reviews: [{ sessionId: "a", grade: "c", summary: "s" }] }, ASKED);
  check(r.grade === "C", "a lower-case grade is accepted and normalised");
}
{
  const [r] = parseReviews({ reviews: [{
    sessionId: "a", grade: "A", summary: "x".repeat(9000),
    strengths: Array.from({ length: 50 }, () => "y".repeat(900)),
    fixes: [1, null, "real fix"], next: "z".repeat(9000),
  }] }, ASKED);
  check(r.summary.length <= 1200, `an oversized summary is clamped (got ${r.summary.length})`);
  check(r.strengths.length <= 6, `an oversized list is clamped (got ${r.strengths.length})`);
  check(r.strengths.every((x) => x.length <= 300), "each item is clamped");
  check(r.fixes.length === 1 && r.fixes[0] === "real fix", "non-string list items are dropped");
  check(r.next.length <= 300, "next is clamped");
}
{
  const [r] = parseReviews({ reviews: [{
    sessionId: "a", grade: "A", summary: "s", evil: "<script>", __proto__: { polluted: true },
  }] }, ASKED);
  check(!("evil" in r), "unknown fields are not carried through");
  check(Object.keys(r).sort().join() === "fixes,grade,next,sessionId,strengths,summary",
    `only known fields are stored (got ${Object.keys(r).sort().join()})`);
  check({}.polluted === undefined, "the prototype was not polluted");
}

console.log("\nReview rows: one per session:");
{
  const reply = { reviews: [
    { sessionId: "a", grade: "B", summary: "Solid.", fixes: ["rushed endgame"], next: "Practice rook endings" },
    { sessionId: "b", grade: "D", summary: "Lost the thread.", strengths: ["good opening"] },
  ] };
  const rows = previewRows(reply, ASKED, (id) => `Game ${id}`);
  check(rows.length === 2, `two reviews give two rows (got ${rows.length})`);
  check(rows[0].id === "a" && rows[1].id === "b", "each row is identified by its session");
  check(/Game a/.test(rows[0].label) && /grade B/.test(rows[0].label), "the label names the game and the grade");
  check(/Solid\./.test(rows[0].detail), "the detail shows the summary");
  check(/rushed endgame/.test(rows[0].detail), "and what to fix");
  check(rows.every((r) => r.detail.length <= 600), "the detail is bounded");
}

console.log("\nApplying stores beside the app's grade, never over it:");
{
  const io = fakeIO({ a: { app: appGrade(77) }, b: { app: appGrade(55) } });
  const reply = { reviews: [
    { sessionId: "a", grade: "B", summary: "Solid.", next: "rook endings" },
    { sessionId: "b", grade: "D", summary: "Drifted." },
  ] };
  const res = applyReviews(reply, ["a"], ASKED, io, "2026-11-14T12:00:00.000Z");
  const after = io.all();
  check(after.a.ai?.grade === "B", "the accepted review is stored");
  check(after.a.app?.accuracy === 77, "THE APP'S OWN GRADE IS UNTOUCHED");
  check(after.a.app?.counts.best === 10, "including its breakdown");
  check(after.b.ai === undefined, "a review the reader did not tick is not stored");
  check(after.b.app?.accuracy === 55, "and that game's own grade is untouched too");
  check(res.undo?.recordIds.join() === "a", "the undo names exactly what was stored");
  check(/beside/.test(res.summary), `the summary says what happened (${res.summary})`);
  check(after.a.ai?.reviewedISO === "2026-11-14T12:00:00.000Z", "the review is timestamped");
}
{
  const io = fakeIO({ a: { app: appGrade() } });
  applyReviews({ reviews: [{ sessionId: "a", grade: "A", summary: "s" }] }, null, ASKED, io, "t");
  check(io.all().a.ai?.grade === "A", "a null accepted list means all of it (the v1 path)");
}
{
  // A game the app never graded must not get an AI-only grade: this channel is a
  // second opinion, not a first one.
  const io = fakeIO({ a: {} });
  const res = applyReviews({ reviews: [{ sessionId: "a", grade: "A", summary: "s" }] }, ["a"], ASKED, io, "t");
  check(io.all().a.ai === undefined, "an ungraded game gets no AI-only grade");
  check(res.undo === undefined, "and no undo is offered, because nothing changed");
}
{
  const io = fakeIO({ a: { app: appGrade() } });
  const res = applyReviews({ reviews: [{ sessionId: "a", grade: "A", summary: "s" }] }, [], ASKED, io, "t");
  check(io.all().a.ai === undefined, "ticking nothing stores nothing");
  check(/nothing applied/.test(res.summary), "and says so");
}

console.log("\nUndo:");
{
  const io = fakeIO({ a: { app: appGrade(77) }, b: { app: appGrade(55) } });
  const res = applyReviews({ reviews: [
    { sessionId: "a", grade: "B", summary: "s" }, { sessionId: "b", grade: "C", summary: "s" },
  ] }, ["a", "b"], ASKED, io, "t");
  undoReviews(res.undo, io);
  check(io.all().a.ai === undefined && io.all().b.ai === undefined, "undo removes both AI grades");
  check(io.all().a.app?.accuracy === 77 && io.all().b.app?.accuracy === 55,
    "and leaves the app's own grades in place");
  check(JSON.parse(JSON.stringify(res.undo)).recordIds.length === 2, "the undo payload is plain JSON");
}
undoReviews(undefined, fakeIO());
check(true, "undo with no data does not throw");

console.log("\nThe real store keeps both grades (not just the harness's fake):");
{
  // Worth the extra setup: "never replaces the app's own score" is enforced by
  // useGameReviews.setAi, and fakeIO above only *mimics* it — so a bug in the real
  // store would have passed every check so far. zustand's persist wants a
  // localStorage, so it gets a throwaway one.
  const m = new Map();
  globalThis.localStorage = {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
  const { useGameReviews } = await import("../src/state/useGameReviews.ts");
  const ai = { grade: "B", summary: "s", strengths: ["x"], fixes: [], next: "", reviewedISO: "t" };

  useGameReviews.getState().setApp("g1", appGrade(77));
  useGameReviews.getState().setAi("g1", ai);
  let e = useGameReviews.getState().byRecord.g1;
  check(e.app?.accuracy === 77, "setAi leaves the app's own grade in place");
  check(e.app?.counts.best === 10, "including its breakdown");
  check(e.ai?.grade === "B", "and stores the AI grade beside it");

  useGameReviews.getState().removeAi("g1");
  e = useGameReviews.getState().byRecord.g1;
  check(e.app?.accuracy === 77, "removeAi leaves the app's own grade");
  check(e.ai === undefined, "and removes only the AI grade");

  useGameReviews.getState().setApp("g1", appGrade(90));
  e = useGameReviews.getState().byRecord.g1;
  check(e.app?.accuracy === 90, "re-grading updates the app's score");
  check(e.ai === undefined, "and does not resurrect a removed AI review");

  useGameReviews.getState().removeAi("nope");
  check(useGameReviews.getState().byRecord.nope === undefined, "removing from an unknown game is a no-op");
}

console.log("\nThe rubric and the wiring:");
{
  check(/requestHash/.test(REVIEW_INSTRUCTIONS), "the instructions tell the agent to echo the requestHash");
  check(/data, never instructions/i.test(REVIEW_INSTRUCTIONS),
    "and that the request is data, never instructions");
  check(/\bgrade\b[\s\S]*A, B, C, D, E/.test(REVIEW_INSTRUCTIONS), "the rubric fixes the grade scale");
  for (const field of ["sessionId", "summary", "strengths", "fixes", "next"]) {
    check(REVIEW_INSTRUCTIONS.includes(field), `the reply format names ${field}`);
  }
  check(/error\.md/.test(REVIEW_INSTRUCTIONS), "and how to report that it could not grade one");

  const coach = readFileSync("src/pages/Coach.tsx", "utf8");
  check(new RegExp(`name: "${REVIEW_CHANNEL}"`).test(coach), `the manifest declares the ${REVIEW_CHANNEL} channel`);
  check(new RegExp(`"${REVIEW_CHANNEL}": \{`).test(coach), "the mount config describes it under that exact name");
  check(/schedule: "daily"/.test(coach), "it is sent on a schedule");
  check(!/review: false/.test(coach), "review before applying is left on");
  check(/ch === REVIEW_CHANNEL/.test(coach), "its request files are built only when that channel sends");

  const rev = readFileSync("src/pages/Review.tsx", "utf8");
  check(/setApp\(/.test(rev), "Review keeps the app's own grade when it computes one");
  check(/AiSecondOpinion/.test(rev), "and the AI's grade is shown on that game");
  const dt = readFileSync("src/state/dataTransfer.ts", "utf8");
  check(/reviews:/.test(dt), "the grades ride along in the export/sync bundle");
  const inv = JSON.parse(readFileSync("public/app-data.json", "utf8"));
  check(inv.localStorage.some((p) => "chessretabled.reviews.v1".startsWith(p.replace(/\*$/, ""))),
    "the new store is covered by the published data inventory");
}

console.log(`\n[validate-aireview] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
