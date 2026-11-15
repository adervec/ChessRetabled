// Every check this project has, in one place, so CI and the deploy cannot drift
// apart — the deploy used to run validate-lessons alone and ship whatever built.
//
// Run it with `npm run verify`, which builds first for two reasons: the build is
// also the type-check (tsc --noEmit), and validate-responsive greps the built CSS.
//
// ponytail: the validator list is a glob of scripts/validate-*.mjs rather than a
// hand-kept array, so a new validator is run by CI the moment it exists and there
// is no second list to forget. If one ever needs an argument or a different order,
// that is the point to replace the glob with an explicit table.
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const validators = readdirSync("scripts")
  .filter((f) => /^validate-.*\.mjs$/.test(f))
  .sort();

// A guard against running this from the wrong directory and "passing" on nothing.
if (validators.length < 10) {
  console.error(`[verify] only found ${validators.length} validators in scripts/ — wrong directory?`);
  process.exit(1);
}

const failed = [];
// No `shell: true`: on Windows it would re-split process.execPath at the space in
// "C:\Program Files\nodejs\node.exe". node and git are both .exe, which spawnSync
// resolves on its own; only .cmd/.bat shims (npm) would need a shell, and the
// build runs through the npm script instead.
const run = (cmd, args) => spawnSync(cmd, args, { stdio: "inherit" }).status;

for (const f of validators) {
  console.log(`\n=== ${f} ===`);
  if (run(process.execPath, [`scripts/${f}`]) !== 0) failed.push(f);
}

// Puzzles are derived, not hand-typed: regenerate and fail if the committed JSON
// moves, which catches both a stale file and a hand-edit.
console.log("\n=== puzzle drift ===");
const generated = run(process.execPath, ["scripts/build-puzzles.mjs"]);
const drifted = run("git", ["diff", "--exit-code", "--", "src/content/puzzles.generated.json"]);
if (generated !== 0 || drifted !== 0) {
  failed.push("puzzle drift (re-run scripts/build-puzzles.mjs and commit the result)");
}

const total = validators.length + 1;
console.log(`\n[verify] ${total} checks, ${failed.length} failed${failed.length ? ":" : ""}`);
for (const f of failed) console.log(`  x ${f}`);
process.exit(failed.length ? 1 : 0);
