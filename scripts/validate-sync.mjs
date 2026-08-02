// Headless verification for the cloud-sync infrastructure: the privacy gate, the
// Google Drive bundle serialize/parse round-trip, and the last-write-wins rule.
// Pure modules only — no fetch, GIS, localStorage, or zustand.
import { serializeBundle, parseBundle } from "../src/state/cloud/googleDrive.ts";
import {
  chooseAdapterKind, cloudUploadAllowed, remoteIsNewer, CLOUD_CONSENT_TEXT,
} from "../src/state/cloud/policy.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  ✗ ${msg}`); problems++; }
}

const bundle = () => ({
  app: "chessretabled",
  version: 1,
  exportedISO: "2026-06-19T12:00:00.000Z",
  progress: { xp: 420 },
  settings: { theme: "vegas" },
  archive: { records: [{ id: "g1", gameId: "chess", outcome: "win" }] },
});

console.log("Privacy gate:");
{
  const base = { provider: "local", consented: false, clientId: "" };
  check(chooseAdapterKind(base) === "local", "default config → local (private by default)");
  check(!cloudUploadAllowed(base), "default config → upload NOT allowed");

  check(chooseAdapterKind({ provider: "drive", consented: false, clientId: "abc.apps.googleusercontent.com" }) === "local",
    "client id set but NOT consented → local (consent is mandatory)");
  check(chooseAdapterKind({ provider: "drive", consented: true, clientId: "" }) === "local",
    "consented but no client id → local");
  check(chooseAdapterKind({ provider: "drive", consented: true, clientId: "   " }) === "local",
    "whitespace-only client id → local");
  check(chooseAdapterKind({ provider: "local", consented: true, clientId: "abc" }) === "local",
    "provider still local → local even if consented + configured");

  const ok = { provider: "drive", consented: true, clientId: "abc.apps.googleusercontent.com" };
  check(chooseAdapterKind(ok) === "drive", "opted-in + consented + client id → drive");
  check(cloudUploadAllowed(ok), "fully configured + consented → upload allowed");

  check(typeof CLOUD_CONSENT_TEXT === "string" && /google drive/i.test(CLOUD_CONSENT_TEXT),
    "consent text exists and names Google Drive");
}

console.log("\nBundle serialize/parse:");
{
  const b = bundle();
  const text = serializeBundle(b);
  check(typeof text === "string", "serialize → string");
  check(JSON.stringify(parseBundle(text)) === JSON.stringify(b), "parse(serialize(bundle)) round-trips exactly");
  check(parseBundle(null) === null, "null → null (no remote file yet)");
  check(parseBundle("") === null, "empty body → null");
  check(parseBundle("{}") !== null, "empty object is a valid (if empty) bundle");
  check(parseBundle("{not json") === null, "malformed JSON → null (no throw)");
  check(parseBundle("42") === null, "non-object JSON → null");
}

console.log("\nLast-write-wins:");
{
  const t1 = "2026-06-19T10:00:00.000Z";
  const t2 = "2026-06-19T11:00:00.000Z";
  check(remoteIsNewer(t1, t2) === true, "newer remote → pull");
  check(remoteIsNewer(t2, t1) === false, "older remote → push (keep local)");
  check(remoteIsNewer(t1, t1) === false, "equal timestamps → push (no needless pull)");
  check(remoteIsNewer(t1, null) === false, "no remote → push");
  check(remoteIsNewer(t1, undefined) === false, "undefined remote → push");
}

console.log(`\n[validate-sync] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
