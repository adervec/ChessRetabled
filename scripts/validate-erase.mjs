// "Erase everything" — the one feature whose bug would be *other apps'* data.
//
// Every app by this maker is served from adervec.github.io, so they all share one
// localStorage. The eraser therefore has two obligations, and this checks both:
// it must find every key this app writes (or data survives an erase), and it must
// leave every key it does not own alone (or an erase here wipes Tachyread).
//
// Run: node scripts/validate-erase.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  isOwnKey, pruneShared, eraseLocalData, SHARED_KEYS, APP_NAME,
} from "../src/state/eraseLocal.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  x ${msg}`); problems++; }
}

/** A localStorage stand-in: Storage's own length/key(i) walk, Map-backed. */
function fakeStore(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    snapshot: () => Object.fromEntries(m),
  };
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

console.log("Every storage key in the source is accounted for:");
// The failure this prevents: someone adds a persisted store, names its key
// something the prefix does not match, and "Erase everything" quietly leaves it
// behind. Scan the source for key-shaped literals rather than keeping a list.
const found = new Map(); // key literal -> where it came from
for (const file of walk("src")) {
  const src = readFileSync(file, "utf8");
  const add = (re) => {
    for (const m of src.matchAll(re)) if (!found.has(m[1])) found.set(m[1], file);
  };
  add(/const\s+\w*[Kk][Ee][Yy]\w*\s*=\s*"([^"]+)"/g);        // const FOO_KEY = "…"
  add(/\bname:\s*"(chessretabled[^"]*)"/g);                   // zustand persist name
  add(/localStorage\.(?:getItem|setItem|removeItem)\(\s*"([^"]+)"/g);
  add(/const\s+\w+\s*=\s*"(portal-[^"]+)"/g);                 // the shared registries
}
check(found.size >= 6, `the scan found key literals at all (found ${found.size})`);
for (const [key, file] of found) {
  check(
    isOwnKey(key) || SHARED_KEYS.includes(key),
    `${key} (${file}) is neither owned nor declared shared — "Erase everything" would skip it`
  );
}
// Spot-check that the stores we know about really are matched.
for (const k of [
  "chessretabled.settings.v1", "chessretabled.archive.v1", "chessretabled.progress.v1",
  "chessretabled.daily.v1", "chessretabled.sessions.v1", "chessretabled.cloud.v2",
  "chessretabled.syncstatus.v1", "chessretabled.cloudmirror.v1",
  "chessretabled.driveFileId.v1", "cr-coach-reply",
]) check(isOwnKey(k), `${k} is recognised as ours`);
check(isOwnKey("chessretabled.somethingnew.v3"), "a future namespaced store is covered for free");

console.log("\nOther apps on this origin are left alone:");
for (const k of [
  "maker-font",          // the house font choice, shared by every app
  "tachyread.library.v1",
  "gymtracker.log.v1",
  "portal-installed",
  "portal-activity",
  "some-other-app",
]) check(!isOwnKey(k), `${k} is not treated as ours`);
{
  // Code lines only — eraseLocal.ts's own header warns about this call by name.
  const callers = walk("src").filter((f) =>
    readFileSync(f, "utf8")
      .split("\n")
      .some((l) => /localStorage\.clear\s*\(/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l))
  );
  check(
    callers.length === 0,
    `nothing in src calls localStorage.clear() — it would wipe every app on this origin (${callers.join(", ")})`
  );
}

console.log("\nShared registries are pruned, not deleted:");
{
  const reg = JSON.stringify({ [APP_NAME]: 111, Tachyread: 222 });
  const out = pruneShared("portal-installed", reg);
  check(out !== null, "our entry in portal-installed is found");
  const parsed = JSON.parse(out ?? "{}");
  check(!(APP_NAME in parsed), "our entry is removed");
  check(parsed.Tachyread === 222, "another app's entry survives untouched");
}
check(
  pruneShared("portal-installed", JSON.stringify({ Tachyread: 1 })) === null,
  "a registry without us is left exactly as it is"
);
{
  const rows = [
    [1, APP_NAME, "chess", 3],
    [2, "Tachyread", "reading", 5],
    [3, APP_NAME, "logic", 1],
    [4, "GymTracker", "fitness", 2],
  ];
  const out = pruneShared("portal-activity", JSON.stringify(rows));
  check(out !== null, "our rows in portal-activity are found");
  const kept = JSON.parse(out ?? "[]");
  check(kept.length === 2, `only our rows are dropped (kept ${kept.length} of 4)`);
  check(!kept.some((r) => r[1] === APP_NAME), "no row of ours survives");
  check(kept.some((r) => r[1] === "Tachyread") && kept.some((r) => r[1] === "GymTracker"),
    "both other apps' rows survive");
}
check(
  pruneShared("portal-activity", JSON.stringify([[1, "Tachyread", "reading", 5]])) === null,
  "a ledger without us is left exactly as it is"
);
check(pruneShared("portal-activity", "not json at all") === null,
  "unparseable shared data is left alone rather than reset");
check(pruneShared("portal-installed", "[1,2,3]") === null,
  "a registry of the wrong shape is left alone");
check(pruneShared("something-else", JSON.stringify({ [APP_NAME]: 1 })) === null,
  "a key that is not a declared shared registry is never rewritten");

console.log("\nErasing, end to end:");
{
  const store = fakeStore({
    "chessretabled.settings.v1": '{"theme":"dusk"}',
    "chessretabled.archive.v1": '{"records":[1,2,3]}',
    "chessretabled.daily.v1": '{"results":{}}',
    "cr-coach-reply": "hello",
    "maker-font": "atkinson",
    "tachyread.library.v1": '{"books":[]}',
    "portal-installed": JSON.stringify({ [APP_NAME]: 111, Tachyread: 222 }),
    "portal-activity": JSON.stringify([[1, APP_NAME, "chess", 3], [2, "Tachyread", "reading", 5]]),
  });
  const report = eraseLocalData(store);
  const left = store.snapshot();

  check(report.removed.length === 4, `four of our keys were removed (got ${report.removed.length})`);
  for (const k of ["chessretabled.settings.v1", "chessretabled.archive.v1", "chessretabled.daily.v1", "cr-coach-reply"])
    check(!(k in left), `${k} is gone`);
  check(left["maker-font"] === "atkinson", "the shared font choice survives");
  check(left["tachyread.library.v1"] === '{"books":[]}', "another app's data survives byte for byte");
  check("portal-installed" in left && "portal-activity" in left, "the shared registries still exist");
  check(JSON.parse(left["portal-installed"]).Tachyread === 222, "the registry kept the other app");
  check(JSON.parse(left["portal-activity"]).length === 1, "the ledger kept only the other app's row");
  check(report.pruned.length === 2, "both shared registries are reported as pruned");
  check(Object.keys(left).length === 4, `nothing else was touched (${Object.keys(left).length} keys left)`);
}
{
  // An erase on a device that never synced or installed must not invent keys.
  const store = fakeStore({ "tachyread.library.v1": "x" });
  const report = eraseLocalData(store);
  check(report.removed.length === 0 && report.pruned.length === 0, "an empty erase does nothing");
  check(Object.keys(store.snapshot()).length === 1, "and leaves the foreign key in place");
}

console.log("\nThe published data inventory matches the eraser:");
{
  // Standard 23: public/app-data.json tells the hub where this app keeps the
  // reader's data, so its backup/restore/erase can find it. The failure that
  // matters is *disagreement* — an inventory that misses a key loses data on
  // restore, one that claims a key we don't own makes the hub touch another app's.
  // So it is checked against eraseLocal.ts rather than on its own.
  const raw = readFileSync("public/app-data.json", "utf8");
  let inv = {};
  try { inv = JSON.parse(raw); check(true, "app-data.json is valid JSON"); }
  catch (e) { check(false, `app-data.json is valid JSON (${e.message})`); }

  check(Number.isInteger(inv.schema) && inv.schema >= 1, `schema is a whole number (got ${inv.schema})`);
  for (const k of ["localStorage", "indexedDB", "drive"]) {
    check(Array.isArray(inv[k]), `${k} is an array (empty if unused)`);
  }
  check(typeof inv.export === "string" && inv.export.length > 0, "export says where the reader's own export lives");

  const covered = (name) =>
    (inv.localStorage ?? []).some((p) => p === name || (p.endsWith("*") && name.startsWith(p.slice(0, -1))));

  // Every key the eraser claims as ours must be declared.
  for (const [key] of found) {
    if (!isOwnKey(key)) continue;
    check(covered(key), `${key} (ours, per eraseLocal) is declared in app-data.json`);
  }
  for (const k of ["chessretabled.settings.v1", "chessretabled.archive.v1", "cr-coach-reply"]) {
    check(covered(k), `${k} is covered by the declared patterns`);
  }
  // And nothing declared may be a key the eraser would refuse to touch.
  for (const pattern of inv.localStorage ?? []) {
    const sample = pattern.endsWith("*") ? pattern.slice(0, -1) + "probe" : pattern;
    check(isOwnKey(sample), `the declared pattern "${pattern}" describes keys this app owns`);
  }
  // House keys belong to the house (font.js, the portal, cowork.js).
  for (const pattern of inv.localStorage ?? []) {
    check(!/^(maker-|portal-|app-|cowork-)/.test(pattern), `"${pattern}" is not a house-owned key`);
  }
  for (const k of SHARED_KEYS) {
    check(!covered(k), `the shared registry ${k} is not declared as ours`);
  }

  // The Drive file name is the real one, not a guess.
  const drive = readFileSync("src/state/cloud/googleDrive.ts", "utf8");
  const realName = /STATE_FILENAME\s*=\s*"([^"]+)"/.exec(drive)?.[1];
  check(Boolean(realName), "googleDrive.ts names the state file");
  check((inv.drive ?? []).includes(realName), `drive lists the real file name (${realName})`);

  // caches: only Cache Storage holding user data — ours holds the app shell.
  const sw = readFileSync("public/sw.js", "utf8");
  const cacheName = /const CACHE = "([^"]+)"/.exec(sw)?.[1];
  check(!(inv.caches ?? []).includes(cacheName),
    `the app-shell cache (${cacheName}) is not declared as reader data`);

  // The portal's install registry is font.js's job now; our copy should be gone.
  const main = readFileSync("src/main.tsx", "utf8")
    .split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  check(!/portal-installed/.test(main), "src/main.tsx no longer writes portal-installed (font.js does it)");
}

console.log("\nThe control is actually wired into Settings:");
{
  const panel = readFileSync("src/components/ui/SettingsPanel.tsx", "utf8");
  check(/eraseLocalData/.test(panel), "Settings calls eraseLocalData");
  check(/confirmErase/.test(panel), "it asks for confirmation first");
  check(/cannot be undone/i.test(panel), "the confirmation says it cannot be undone");
  check(/Drive\b[\s\S]{0,120}not touched/i.test(panel), "it states the Drive copy is not touched");
  check(/window\.location\.reload/.test(panel), "it reloads, so in-memory stores cannot write themselves back");
}

console.log(`\n[validate-erase] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
