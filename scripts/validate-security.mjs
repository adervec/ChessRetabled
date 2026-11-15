// Security + supply chain (house standards 22 and the supply column).
//
// A CSP fails in two opposite ways and only one of them is loud: too loose and it
// protects nothing, too tight and a feature dies silently in a console nobody is
// watching. So this checks both directions — the lockdown directives are present
// AND everything the app genuinely needs is still permitted. Every allowance is
// tied to the thing that would break without it.
//
// Run: node scripts/validate-security.mjs
import { readFileSync, existsSync } from "node:fs";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  x ${msg}`); problems++; }
}

const html = readFileSync("index.html", "utf8");
const csp = /http-equiv="Content-Security-Policy"\s*\n?\s*content="([^"]+)"/.exec(html)?.[1]
  ?? /content="([^"]*default-src[^"]*)"/.exec(html)?.[1]
  ?? "";

console.log("The page has a Content-Security-Policy:");
check(csp.length > 0, "index.html declares a Content-Security-Policy meta tag");
/** One directive's value, whitespace-collapsed. */
const dir = (name) => {
  const m = new RegExp(`(?:^|;)\\s*${name}\\s+([^;]+)`).exec(csp);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
};
check(/(?:^|;)\s*default-src\s+'none'/.test(csp), "default-src is 'none', so anything not listed is denied");
for (const d of ["script-src", "style-src", "img-src", "font-src", "connect-src", "worker-src", "manifest-src"]) {
  check(dir(d) !== null, `${d} is declared (default-src 'none' would otherwise block it entirely)`);
}

console.log("\nIt is actually locked down:");
for (const [name, want] of [["base-uri", "'none'"], ["form-action", "'none'"], ["object-src", "'none'"]]) {
  check(dir(name) === want, `${name} is ${want} (got ${dir(name)})`);
}
// 'unsafe-eval' is a substring of 'wasm-unsafe-eval', so match on the boundary.
check(!/(?:^|[\s;])'unsafe-eval'/.test(csp), "'unsafe-eval' is never allowed");
check(!/'unsafe-hashes'/.test(csp), "'unsafe-hashes' is not used");
check(!/\bdata:(?=[^;]*)/.test(dir("script-src") ?? ""), "script-src does not allow data: URIs");
check(!/'unsafe-inline'/.test(dir("script-src") ?? ""),
  "script-src has no 'unsafe-inline' — the built page carries no inline script, so it is not needed");
check(!/\*\s*$|\s\*\s|'none'.*https/.test(dir("script-src") ?? ""), "script-src is not a wildcard");

console.log("\nAnd it still permits what the app needs:");
// Each of these is paired with what breaks if it is missing, because that is the
// failure this half of the file exists to catch.
const needs = [
  ["script-src", "https://adervec.github.io", "the house font.js and cowork.js would not load at all"],
  ["script-src", "'wasm-unsafe-eval'", "Stockfish compiles a WASM NNUE build; without this, Play falls back to the weak engine"],
  ["script-src", "'self'", "the app's own bundle"],
  ["script-src", "https://accounts.google.com", "the Google Identity script for Drive sign-in"],
  ["worker-src", "'self'", "the Stockfish worker"],
  ["font-src", "https://adervec.github.io", "the Atkinson Hyperlegible files — the house font would silently fall back"],
  ["style-src", "'unsafe-inline'", "React style props, the per-card --card-w, and font.js's injected @font-face"],
  ["img-src", "https://*.googleusercontent.com", "the signed-in profile picture, which the house standard requires be visible"],
  ["img-src", "data:", "inline SVG/data images"],
  ["connect-src", "'self'", "whatsnew.json and the engine files"],
  ["connect-src", "https://www.googleapis.com", "Drive appdata sync"],
  ["connect-src", "https://api.anthropic.com", "the optional Coach chat"],
  ["manifest-src", "'self'", "the PWA manifest, i.e. installability"],
];
for (const [d, token, why] of needs) {
  check((dir(d) ?? "").includes(token), `${d} allows ${token} — otherwise ${why}`);
}

console.log("\nNo host is allowed that the request ratchet does not declare:");
{
  // The coupling: validate-requests.mjs owns the list of hosts this app may reach,
  // with a reason each. A CSP that opens a host nobody declared there is a hole
  // that review would not notice.
  const req = readFileSync("scripts/validate-requests.mjs", "utf8");
  const declared = [...req.matchAll(/^\s*"([a-z0-9.*-]+)":\s*"/gm)].map((m) => m[1]);
  check(declared.length >= 5, `read the declared host list (${declared.length} hosts)`);
  // CSP-only hosts: reached at runtime from data, so they never appear in dist/
  // and validate-requests cannot see them. Declared here instead, with a reason.
  // Only one: a wildcard host the request ratchet's regex cannot see, whose URL
  // exists only at runtime in Google's userinfo response. Everything else the CSP
  // names has to be declared over there, with a reason.
  const cspOnly = {
    "*.googleusercontent.com": "the profile picture URL comes from Google's userinfo response",
  };
  const cspHosts = [...csp.matchAll(/https:\/\/([a-z0-9.*-]+)/g)].map((m) => m[1]);
  for (const host of [...new Set(cspHosts)]) {
    const ok = declared.includes(host) || host in cspOnly;
    check(ok, `${host} in the CSP is declared in validate-requests.mjs (or listed as CSP-only here)`);
  }
  for (const h of ["fonts.googleapis.com", "cdn.jsdelivr.net", "unpkg.com"]) {
    check(!cspHosts.includes(h), `${h} is not permitted by the CSP`);
  }
}

console.log("\nThe CSP survives the build:");
if (existsSync("dist/index.html")) {
  const built = readFileSync("dist/index.html", "utf8");
  check(/Content-Security-Policy/.test(built), "the built page carries the CSP");
  check(/default-src 'none'/.test(built), "and its default-src survived intact");
} else {
  console.log("  (no dist/ — run after npm run build; npm run verify does)");
}

console.log("\nUnguessable values come from crypto, not Math.random:");
{
  // Math.random is for gameplay (the seeded puzzle/card RNG); it must not be the
  // source of anything that needs to be unguessable, such as an OAuth state.
  const sources = ["src/state/cloud/googleDrive.ts", "src/state/cloudConfig.ts"];
  for (const f of sources) {
    if (!existsSync(f)) continue;
    const code = readFileSync(f, "utf8")
      .split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    check(!/Math\.random/.test(code), `${f} does not use Math.random for anything security-bearing`);
  }
}

console.log("\nSupply chain:");
{
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  const deploy = readFileSync(".github/workflows/deploy.yml", "utf8");
  for (const [name, text] of [["ci.yml", ci], ["deploy.yml", deploy]]) {
    check(/^permissions:/m.test(text), `${name} has a top-level permissions: block`);
    check(/npm audit/.test(text), `${name} audits dependencies`);
    check(/--audit-level=high/.test(text), `${name} audits at --audit-level=high`);
  }
  check(/contents: read/.test(ci), "ci.yml asks only for contents: read");
  // On the command line, not just somewhere in the file: the comment above the
  // step explains --omit=dev, and matching that would pass a workflow that
  // dropped the flag. (Three grep-based checks in this repo have been fooled by
  // their own explanatory comments — always anchor to the code.)
  check(/npm audit[^\n]*--audit-level=high[^\n]*--omit=dev/.test(ci),
    "the audit command itself is scoped to shipped dependencies (--omit=dev)");
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  check(Object.keys(pkg.dependencies ?? {}).length <= 8,
    `the shipped dependency list stays small (${Object.keys(pkg.dependencies ?? {}).length})`);
}

console.log("\nNo secrets in the tree:");
{
  // The Google OAuth *client id* is a public identifier and is committed on
  // purpose (documented in CLAUDE.md). A client *secret* or an API key is not.
  const files = ["src/state/cloud/googleDrive.ts", "src/state/cloud/policy.ts", "index.html"];
  for (const f of files) {
    if (!existsSync(f)) continue;
    const t = readFileSync(f, "utf8");
    check(!/client_secret|GOCSPX-/.test(t), `${f} contains no OAuth client secret`);
    check(!/sk-ant-[A-Za-z0-9]/.test(t), `${f} contains no Anthropic API key`);
  }
}

console.log(`\n[validate-security] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
