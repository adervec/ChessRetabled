// House font standard: the page loads the shared font.js, the body font follows --app-font,
// and Settings offers the picker. Static check.  Run: node scripts/validate-font.mjs
import { readFileSync } from "node:fs";
const checks = [
  ["index.html", /<script src="https:\/\/adervec\.github\.io\/font\.js"><\/script>/],
  ["src/styles/tokens.css", /--font-body:\s*var\(--app-font,/],
  ["src/components/ui/SettingsPanel.tsx", /createElement\("app-font-picker"\)/],
];
const problems = checks.filter(([file, re]) => !re.test(readFileSync(file, "utf8"))).map(([file]) => file);
console.log(`[validate-font] checks=${checks.length} problems=${problems.length}${problems.length ? " " + problems.join(", ") : ""}`);
if (problems.length) process.exit(1);
