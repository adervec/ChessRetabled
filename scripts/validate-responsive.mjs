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

// [label, regex, mustComeAfterThePageSheets]
const RULES = [
  ["page sheet: .game 2-col", /\.game\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*336px/, false],
  ["page sheet: 900px stack", /@media\s*\(max-width:\s*900px\)/, false],
  ["touch-action: manipulation", /touch-action:\s*manipulation/, true],
  ["hover:none lift reset", /@media\s*\(hover:\s*none\)/, true],
  ["coarse-pointer tap targets", /@media\s*\(pointer:\s*coarse\)/, true],
  ["phone card scale", /--card-scale:\s*0?\.76/, true],
  ["landscape-phone override", /@media\s*\(orientation:\s*landscape\)\s*and\s*\(max-height:\s*560px\)/, true],
  ["safe-area insets", /env\(safe-area-inset-bottom\)/, true],
  ["cards honour --card-scale", /width:\s*calc\(var\(--card-w,\s*76px\)\s*\*\s*var\(--card-scale,\s*1\)\)/, false],
];

let problems = 0;
const found = new Map();
for (const [label, re, mobile] of RULES) {
  const at = css.match(re)?.index ?? -1;
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
