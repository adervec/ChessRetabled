// Guards the one fragile thing about the mobile layer: styles/responsive.css has
// to end up AFTER the per-page sheets in the bundle, because most of its rules
// win on source order rather than specificity. Move the import in main.tsx above
// `App` and mobile silently reverts to the desktop layout — this catches that.
//
// Needs a build first:  npm run build && node scripts/validate-responsive.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist/assets";
let css;
try {
  const files = readdirSync(DIST).filter((f) => f.endsWith(".css"));
  if (files.length === 0) throw new Error("no .css in " + DIST);
  css = files.map((f) => readFileSync(join(DIST, f), "utf8")).join("\n");
} catch (e) {
  console.error(`[validate-responsive] ${e.message} — run \`npm run build\` first.`);
  process.exit(1);
}

// [label, regex, ordering]
//   true    — a mobile rule: must land after the per-page sheets
//   false   — a page sheet: defines the line the mobile rules must clear
//   "any"   — must exist, but takes no part in the ordering (global.css)
//   "absent"— must NOT exist
const RULES = [
  ["page sheet: .game 2-col", /\.game\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*336px/, false],
  ["page sheet: 900px stack", /@media\s*\(max-width:\s*900px\)/, false],
  ["touch-action: manipulation", /touch-action:\s*manipulation/, true],
  ["hover:none lift reset", /@media\s*\(hover:\s*none\)/, true],
  ["coarse-pointer tap targets", /@media\s*\(pointer:\s*coarse\)/, true],
  ["phone card scale", /--card-scale:\s*0?\.85/, true],
  ["landscape layout (setting-driven)", /\[data-orient=["']?landscape["']?\]\s*\.game/, true],
  ["portrait board cap (setting-driven)", /\[data-orient=["']?portrait["']?\]\s*\.board3d-scene/, true],
  // A board capped on width alone either spills off a short screen or stays
  // small on a big one — both were reported. Every cap must carry a height term.
  ["boards fit both axes", /--board-max:\s*min\([^;]*100dvh/, true],
  ["landscape arrangement needs width", /\(max-width:\s*900px\)\s*and\s*\(min-width:\s*560px\)/, true],
  // touch-action: manipulation still hands drags to the browser, so a drag on
  // the board scrolled the page instead of moving a piece.
  ["board surface refuses pan/zoom", /touch-action:\s*none/, true],
  // The app scrolls its own main area; the document does not scroll at all.
  // Letting it scroll on a phone hands the browser chrome a say in the layout,
  // which is how the nav ended up half off the top of the screen.
  ["document scrolling is pinned", /html\s*\{[^}]*overflow:\s*hidden/, "any"],
  ["shell is exactly one viewport tall", /\.app-shell\s*\{[^}]*height:\s*100dvh/, "any"],
  ["main is the scrolling surface", /\.grow\s*\{[^}]*overflow-y:\s*auto/, "any"],
  ["scroll does not chain to the document", /overscroll-behavior:\s*(none|contain)/, "any"],
  // Every scrollbar is inside the app now, so every scrollbar is themed.
  ["scrollbars use theme tokens", /scrollbar-color:\s*var\(--/, "any"],
  ["webkit scrollbar thumb is themed", /::-webkit-scrollbar-thumb\s*\{[^}]*var\(--/, "any"],
  // The nav is a flex row of the shell now — sticky would mean it can scroll.
  ["nav no longer relies on sticky", /\.nav\s*\{[^}]*position:\s*sticky/, "absent"],
  // The accelerometer must not reach the layout: only App.tsx may read device
  // orientation, and it writes data-orient. A bare orientation media query here
  // would flip the layout behind the user's setting.
  ["no orientation media query", /@media[^{]*orientation:\s*(landscape|portrait)/, "absent"],
  ["safe-area insets", /env\(safe-area-inset-bottom\)/, true],
  ["--cw derives from --card-scale", /--cw:\s*calc\(var\(--card-w,\s*76px\)\s*\*\s*var\(--card-scale,\s*1\)\)/, false],
  ["cards sized by --cw", /\.pcard\s*\{[^}]*width:\s*var\(--cw/, false],
  // Every rule reserving card-sized space must use --cw. A raw var(--card-w)
  // outside the --cw definition means that slot keeps its desktop footprint
  // while the card inside it shrinks — cards float in over-wide columns.
  ["no unscaled card-width consumers", /(?<!--cw:\s{0,4}calc\()var\(--card-w(?!,\s*76px\)\s*\*)/, "absent"],
];

let problems = 0;
const found = new Map();
for (const [label, re, mobile] of RULES) {
  const at = css.match(re)?.index ?? -1;
  if (mobile === "any") {
    if (at < 0) {
      console.error(`  MISSING  ${label}`);
      problems++;
    }
    continue;
  }
  if (mobile === "absent") {
    if (at >= 0) {
      console.error(`  PRESENT  ${label} — found at ${at}, but it must not exist`);
      problems++;
    }
    continue;
  }
  if (at < 0) {
    console.error(`  MISSING  ${label}`);
    problems++;
  }
  found.set(label, { at, mobile });
}

const pageMax = Math.max(...[...found.values()].filter((v) => !v.mobile && v.at >= 0).map((v) => v.at), -1);
for (const [label, v] of found) {
  if (v.mobile && v.at >= 0 && v.at < pageMax) {
    console.error(`  ORDER    ${label} at ${v.at} comes before a page sheet at ${pageMax}`);
    problems++;
  }
}

console.log(`\n[validate-responsive] rules=${RULES.length} problems=${problems}`);
if (problems > 0) {
  console.error("responsive.css must be imported last in src/main.tsx.");
  process.exit(1);
}
