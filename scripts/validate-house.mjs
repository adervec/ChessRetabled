// Four house standards about the app's shell: what's new, the one house theme list
// (and the board skins that are still ours), and the session ledger the hub reads.
//
// Both are mostly data (a JSON file, five meta tags, a two-entry table), and data
// is exactly what rots silently — a malformed whatsnew.json shows the reader
// nothing, and a theme id that no longer exists opens the app unstyled.
//
// Run: node scripts/validate-house.mjs
import { readFileSync, existsSync } from "node:fs";
import { skinForScheme, deviceScheme, deviceSkin, SCHEME_SKIN, adoptHouseTheme, LEGACY_THEME_HOUSE } from "../src/state/theme.ts";
import { upgradeSettings } from "../src/state/useSettings.ts";
import { kindForGame, sessionMinutes, logSession } from "../src/state/ledger.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  x ${msg}`); problems++; }
}

const html = readFileSync("index.html", "utf8");

console.log("What's new:");
check(existsSync("public/whatsnew.json"), "public/whatsnew.json exists");
let entries = [];
try {
  entries = JSON.parse(readFileSync("public/whatsnew.json", "utf8"));
  check(true, "it is valid JSON");
} catch (e) {
  check(false, `it is valid JSON (${e.message})`);
}
check(Array.isArray(entries) && entries.length > 0, "it is a non-empty array");
for (const [i, e] of entries.entries()) {
  const where = `entry ${i}`;
  check(e && typeof e === "object" && !Array.isArray(e), `${where} is an object`);
  check(/^\d{4}-\d{2}-\d{2}$/.test(e?.date ?? ""), `${where} has a YYYY-MM-DD date (got ${e?.date})`);
  // A real calendar date, not 2026-02-31. Parsed as local noon so no timezone
  // can shift it a day (the local-day standard applies to the checker too).
  if (/^\d{4}-\d{2}-\d{2}$/.test(e?.date ?? "")) {
    const [y, m, d] = e.date.split("-").map(Number);
    const back = new Date(y, m - 1, d, 12);
    check(
      back.getFullYear() === y && back.getMonth() === m - 1 && back.getDate() === d,
      `${where}: ${e.date} is a real calendar date`
    );
    check(y >= 2024 && y <= 2100, `${where}: ${e.date} has a plausible year`);
  }
  check(Array.isArray(e?.items) && e.items.length > 0, `${where} has a non-empty items array`);
  for (const [j, it] of (e?.items ?? []).entries()) {
    check(typeof it === "string" && it.trim().length > 10, `${where} item ${j} is a real sentence`);
    // Written for the player, not the developer. The standard is explicit about
    // this, and a changelog pasted from commit messages is the way it gets broken.
    const lower = String(it).toLowerCase();
    const jargon = ["refactor", "localstorage", "validator", "validate-", "typescript",
      "commit", ".ts", "regression", "ci "].filter((w) => lower.includes(w));
    check(jargon.length === 0, `${where} item ${j} is reader-facing, not dev-speak (${jargon.join(", ")})`);
  }
}
{
  const dates = entries.map((e) => e?.date ?? "");
  const sorted = [...dates].sort().reverse();
  check(dates.join() === sorted.join(), `newest first (got ${dates.join(" > ")})`);
  check(new Set(dates).size === dates.length, "one entry per date");
}

console.log("\nThe app describes itself to font.js:");
for (const [name, why] of [
  ["app-name", "the About panel's title"],
  ["app-whatsnew", "the what's-new notice"],
  ["app-license", "the About panel's licence line"],
  ["app-source", "the About panel's source link"],
  ["app-data-note", "where the reader's data lives"],
]) {
  check(new RegExp(`<meta\\s+\\n?\\s*name="${name}"`).test(html) || new RegExp(`name="${name}"`).test(html),
    `<meta name="${name}"> is declared — ${why}`);
}
{
  const m = /name="app-whatsnew"\s+content="([^"]+)"/.exec(html);
  check(Boolean(m), "app-whatsnew has a content URL");
  if (m) {
    // %BASE_URL% is substituted by Vite at build time; the file sits in public/.
    const rel = m[1].replace("%BASE_URL%", "");
    check(existsSync(`public/${rel}`), `app-whatsnew points at public/${rel}, which exists`);
  }
  // The service worker is cache-first for anything that isn't a navigation, and
  // whatsnew.json is not content-hashed — so without an exemption the reader
  // would keep the first copy they ever fetched and never see a new notice.
  const sw = readFileSync("public/sw.js", "utf8");
  check(/whatsnew/.test(sw), "sw.js knows about whatsnew.json");
  check(/FRESH\s*=\s*\/.*whatsnew/.test(sw) && /FRESH\.test/.test(sw),
    "sw.js serves whatsnew.json network-first, so the notice can't be cached forever");

  const lic = /name="app-license"\s+content="([^"]+)"/.exec(html);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  check(lic?.[1] === pkg.license, `the declared licence matches package.json (${lic?.[1]} vs ${pkg.license})`);
}

console.log("\nThe signed-in picture is visible on every screen:");
{
  // The standard is "like YouTube's corner avatar" — in the top bar, not only in
  // Settings. font.js owns the element; what can break on our side is the wiring.
  const nav = readFileSync("src/components/ui/NavBar.tsx", "utf8");
  const app = readFileSync("src/App.tsx", "utf8");
  check(/createElement\("app-account"\)/.test(nav),
    "the nav bar renders <app-account>, and the nav bar is on every screen");
  check(/setAccount/.test(app), "App.tsx reports the account to font.js");
  check(/\}, \[account\]\)/.test(app),
    "it mirrors the persisted account, so sign-in, disconnect and the boot reconnect all flow through one effect");
  check(/app-account-click/.test(app), "clicking the picture is handled");
  check(/navigate\("\/profile"\)/.test(app), "and it opens /profile, where the sync settings actually live");
  check(/path="\/profile"/.test(app), "that route exists");
}

// The skin ids, read out of the SKINS table alone — the file also holds an
// orientation and an animation-speed table in the same shape.
function skinIds(settings) {
  const from = settings.indexOf("export const SKINS");
  const to = settings.indexOf("];", from);
  if (from < 0 || to < 0) return [];
  return [...settings.slice(from, to).matchAll(/\{ id: "([a-z]+)"/g)].map((m) => m[1]);
}

console.log("\nOne theme list, and it is the house's (standard 24):");
{
  const settings = readFileSync("src/state/useSettings.ts", "utf8");
  const panel = readFileSync("src/components/ui/SettingsPanel.tsx", "utf8");
  const css = readFileSync("src/styles/tokens.css", "utf8");

  // The list and the palettes live in font.js and nowhere else. Offering our own
  // six again is exactly what this standard removed, so the picker has to be the
  // shared element and the old chip grid must not come back for the THEME.
  check(/createElement\("app-theme-picker"\)/.test(panel), "settings offer the shared <app-theme-picker>");
  check(!/data-theme/.test(css), "tokens.css has no per-theme block left (the palette is font.js's)");
  check(!/data-theme/.test(readFileSync("src/App.tsx", "utf8")), "and nothing writes data-theme any more");

  // ...and the palette is actually used, not just offered. Each of these is a
  // house variable the chrome reads; a fallback keeps the app styled if font.js
  // is blocked, which is why they are matched with one.
  for (const v of ["bg", "surface", "surface2", "line", "text", "dim", "accent", "on-accent", "good", "bad"]) {
    check(new RegExp(`--h-${v}:\\s*var\\(--t-${v},\\s*#`).test(css),
      `--t-${v} is mapped onto the app, with a fallback`);
  }
  check(/color-scheme:\s*var\(--t-scheme/.test(css), "native controls follow --t-scheme");
  for (const v of ["--bg-1", "--surface", "--text", "--accent", "--ink"]) {
    const re = new RegExp(`\\n\\s*\\${v}:[^;]*var\\(--h-`);
    check(re.test(css), `${v} is derived from the house palette, not a hardcoded hex`);
  }

  // A reader must never be left on a theme that no longer exists.
  const skins = skinIds(settings);
  check(skins.length === 6, `found the board skin ids (${skins.join(", ")})`);
  for (const id of skins) {
    check(id in LEGACY_THEME_HOUSE, `the old theme "${id}" maps to a house theme (${LEGACY_THEME_HOUSE[id]})`);
  }
  // An unknown id is safe by construction: font.js's setTheme stores only a known
  // id and otherwise clears the choice back to System. So this checks coverage,
  // not spelling — spelling cannot leave anyone stranded.
  check(Object.values(LEGACY_THEME_HOUSE).every((v) => /^[a-z]+$/.test(v)), "every target is an id, not a label");
}
{
  // The migration itself: it runs once, and a choice the reader already made wins.
  const realAppFont = globalThis.appFont;
  let asked = null;
  globalThis.appFont = { theme: () => "system", setTheme: (id) => { asked = id; } };
  adoptHouseTheme("volcano");
  check(asked === LEGACY_THEME_HOUSE.volcano, `a Volcano reader is moved to ${LEGACY_THEME_HOUSE.volcano}`);

  asked = null;
  globalThis.appFont = { theme: () => "ocean", setTheme: (id) => { asked = id; } };
  adoptHouseTheme("volcano");
  check(asked === null, "a reader who already picked a house theme is left alone (standard 14)");

  asked = null;
  globalThis.appFont = {};
  let threw = false;
  try { adoptHouseTheme("dusk"); } catch (e) { threw = true; }
  check(!threw, "an older font.js with no setTheme is ignored, not a crash");
  globalThis.appFont = undefined;
  threw = false;
  try { adoptHouseTheme("dusk"); } catch (e) { threw = true; }
  check(!threw, "no font.js at all is ignored too");
  globalThis.appFont = realAppFont;
}

console.log("\nThe board skins are ours, and complete:");
{
  const css = readFileSync("src/styles/tokens.css", "utf8");
  const settings = readFileSync("src/state/useSettings.ts", "utf8");
  const skins = skinIds(settings);
  // Twelve props per skin. A skin missing one inherits Dusk's, which is how you
  // get a pastel board with a midnight frame — visible, but only if you look.
  const PROPS = ["--paper", "--text-on-light", "--sq-light", "--sq-light-shade", "--sq-dark",
    "--sq-dark-shade", "--board-frame", "--board-frame-edge", "--sq-highlight", "--sq-check",
    "--felt", "--felt-2"];
  const blockOf = (id) => {
    // Dusk is the default and lives on a bare :root; the rest are [data-skin].
    const start = id === "dusk" ? css.indexOf("--paper:") : css.indexOf(`:root[data-skin="${id}"]`);
    if (start < 0) return null;
    const from = id === "dusk" ? css.lastIndexOf(":root {", start) : start;
    return css.slice(from, css.indexOf("}", from));
  };
  for (const id of skins) {
    const block = blockOf(id);
    check(Boolean(block), `${id} has a block in tokens.css`);
    if (!block) continue;
    for (const prop of PROPS) {
      check(new RegExp(`\\n\\s*\\${prop}:\\s*#`).test(block), `${id} sets ${prop}`);
    }
  }
  check(/--sq-target/.test(css), "the shared transparent move-target is still there");
}
{
  // The two starting skins must really be a dark and a light board. The frame is
  // what reads as the board's weight, so that is what gets measured — recolour a
  // skin the wrong way and this fails rather than the app opening mismatched.
  const css = readFileSync("src/styles/tokens.css", "utf8");
  const frameOf = (id) => {
    const start = id === "dusk" ? css.indexOf("--paper:") : css.indexOf(`:root[data-skin="${id}"]`);
    if (start < 0) return null;
    const block = css.slice(start, css.indexOf("}", start));
    return /--board-frame:\s*#([0-9a-fA-F]{6})/.exec(block)?.[1] ?? null;
  };
  const lightness = (hex) => {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  for (const [scheme, wantLight] of [["dark", false], ["light", true]]) {
    const id = SCHEME_SKIN[scheme];
    const hex = frameOf(id);
    check(Boolean(hex), `${id} has a --board-frame in tokens.css`);
    if (hex) {
      const l = lightness(hex);
      check(wantLight ? l > 0.5 : l < 0.5,
        `${id} (#${hex}, lightness ${l.toFixed(2)}) is actually a ${wantLight ? "light" : "dark"} board`);
    }
  }
  check(skinForScheme("dark") !== skinForScheme("light"), "light and dark do not start from the same board");
  check(/boardSkin: deviceSkin\(\)/.test(readFileSync("src/state/useSettings.ts", "utf8")),
    "the store's initial skin is deviceSkin(), not a hardcoded id");
  check(/persist\(/.test(readFileSync("src/state/useSettings.ts", "utf8")),
    "the store persists, so a saved choice rehydrates over that default");
}
{
  // Preference order for the device scheme: the house answer, the media query, dark.
  const realAppFont = globalThis.appFont;
  const realMM = globalThis.matchMedia;
  const fakeMM = (want) => (q) => ({ matches: q.includes("light") ? want === "light" : want === "dark" });

  globalThis.appFont = { systemTheme: () => "light" };
  globalThis.matchMedia = fakeMM("dark");
  check(deviceScheme() === "light", "font.js's systemTheme() wins over the media query");
  check(deviceSkin() === SCHEME_SKIN.light, `and gives the light board (${SCHEME_SKIN.light})`);

  globalThis.appFont = undefined;
  globalThis.matchMedia = fakeMM("light");
  check(deviceScheme() === "light", "without font.js, prefers-color-scheme is used");

  globalThis.matchMedia = fakeMM("dark");
  check(deviceScheme() === "dark", "a dark device gives dark");
  check(deviceSkin() === SCHEME_SKIN.dark, `and the dark board (${SCHEME_SKIN.dark})`);

  globalThis.appFont = { systemTheme: () => "banana" };
  check(deviceScheme() === "dark", "a nonsense systemTheme() falls through instead of being trusted");

  globalThis.appFont = undefined;
  globalThis.matchMedia = undefined;
  check(deviceScheme() === "dark", "with no DOM at all it still answers (dark)");

  globalThis.appFont = realAppFont;
  globalThis.matchMedia = realMM;
}

console.log("\nAn old saved blob still restores (standard 23):");
{
  const realAppFont = globalThis.appFont;
  globalThis.appFont = { theme: () => "system", setTheme: () => {} };

  const v1 = upgradeSettings({ theme: "croanada", volume: 0.3, sound: false });
  check(v1.boardSkin === "croanada", "a v1 `theme` becomes the board skin, so the board looks unchanged");
  check(!("theme" in v1), "and the dead key is gone rather than shadowing it");
  check(v1.volume === 0.3 && v1.sound === false, "every other setting survives untouched");

  const both = upgradeSettings({ theme: "vegas", boardSkin: "penguin" });
  check(both.boardSkin === "penguin", "a newer boardSkin wins over a stale `theme` in the same file");

  const v2 = upgradeSettings({ boardSkin: "volcano", volume: 1 });
  check(v2.boardSkin === "volcano" && v2.volume === 1, "a current blob passes through");
  check(Object.keys(upgradeSettings(null)).length === 0, "null gives an empty object, not a crash");
  check(Object.keys(upgradeSettings(undefined)).length === 0, "so does undefined");

  const input = { theme: "dusk" };
  upgradeSettings(input);
  check(input.theme === "dusk", "the caller's object is not mutated (the bundle is still intact)");

  globalThis.appFont = realAppFont;
}
{
  // Both rehydration paths must use it: persist on boot, and an imported or
  // Drive-synced bundle. Missing the second is how a restore silently resets.
  const settings = readFileSync("src/state/useSettings.ts", "utf8");
  const transfer = readFileSync("src/state/dataTransfer.ts", "utf8");
  check(/version:\s*2/.test(settings), "the settings store is at version 2");
  check(/migrate:[^\n]*upgradeSettings\(/.test(settings), "persist migrates through upgradeSettings");
  check(/upgradeSettings\(bundle\.settings\)/.test(transfer), "and so does an imported bundle");
}

console.log("\nThe session ledger (standard 25):");
{
  check(kindForGame("chess") === "chess", "a chess game is a chess session");
  check(kindForGame("checkers") === "chess", "so is a board game — somebody played an opponent");
  check(kindForGame("hearts") === "chess", "and a card game");
  check(kindForGame("sudoku") === "focus", "a Logic Lab puzzle is solo deduction, so focus");
  check(kindForGame("nurikabe") === "focus", "every logic id, not just the first");
  check(kindForGame("not-a-game") === "chess", "an unknown id still gets a kind from the closed set");

  // Minutes come from two instants the archive already stores, so a sitting that
  // crosses midnight or a clock change is still its own length.
  check(sessionMinutes("2026-11-14T10:00:00.000Z", "2026-11-14T10:24:00.000Z") === 24, "24 minutes is 24");
  check(sessionMinutes("2026-11-14T10:00:00.000Z", "2026-11-14T10:00:05.000Z") === 1, "a five-second game floors at 1, not 0");
  check(sessionMinutes("2026-11-14T10:00:00.000Z", "2026-11-14T09:00:00.000Z") === 1, "a backwards clock gives 1, not a negative");
  check(sessionMinutes("not a date", "2026-11-14T10:00:00.000Z") === 1, "an unparseable instant gives 1 rather than NaN");
  check(sessionMinutes("2026-11-14T00:00:00.000Z", "2026-11-16T00:00:00.000Z") === 600,
    "a tab left open for two days is capped, not reported as 2880 minutes");

  // font.js owns the storage, the de-duplication and the cap. What matters here is
  // that we call it with what it wants, and stay silent when it has not loaded.
  const realFont = globalThis.appFont;
  const sent = [];
  globalThis.appFont = { logSession: (s) => { sent.push(s); return true; } };
  logSession("chess", "g_1", 12);
  check(sent.length === 1, "one call, one row");
  check(sent[0].kind === "chess" && sent[0].id === "g_1" && sent[0].minutes === 12,
    "kind, id and minutes are passed through");

  globalThis.appFont = {};
  let threw = false;
  try { logSession("chess", "g_2", 3); } catch (e) { threw = true; }
  check(!threw, "an older font.js with no logSession is ignored, not a crash");
  globalThis.appFont = undefined;
  threw = false;
  try { logSession("chess", "g_3", 3); } catch (e) { threw = true; }
  check(!threw, "no font.js at all is ignored too");
  globalThis.appFont = realFont;
}

// The hand-written row must not come back: it fired on every XP gain, which is an
// event, not a session — the standards check warns on exactly that shape.
console.log("\nNo hand-written ledger row:");
{
  const code = ["src/state/useProgress.ts", "src/state/useArchive.ts", "src/state/ledger.ts"]
    .map((f) => readFileSync(f, "utf8")).join("\n")
    .split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  check(!/setItem\(\s*["'`]portal-activity/.test(code), "nothing writes portal-activity directly");
  check(/logSession\(/.test(readFileSync("src/state/useArchive.ts", "utf8")),
    "a finished game is logged from the archive's one funnel");
  check(/logSession\(\s*"study"/.test(readFileSync("src/state/useProgress.ts", "utf8")),
    "a finished lesson is logged as a study session");
}


console.log(`\n[validate-house] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
