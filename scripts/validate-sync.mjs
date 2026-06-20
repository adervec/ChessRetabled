// Headless verification for the cloud-sync infrastructure: the privacy gate,
// the Firestore document encode/decode round-trip, the JWT decoder, and the
// last-write-wins rule. Pure modules only — no fetch, localStorage, or zustand.
import { encodeBundle, decodeFirestoreDoc } from "../src/state/cloud/firestore.ts";
import { decodeJwt } from "../src/state/cloud/googleAuth.ts";
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
  progress: { xp: 420, records: [{ id: "a" }] },
  settings: { theme: "vegas" },
  archive: { records: [{ id: "g1", gameId: "chess", outcome: "win" }] },
});

console.log("Privacy gate:");
{
  const base = { provider: "local", consented: false, projectId: "", apiKey: "" };
  check(chooseAdapterKind(base) === "local", "default config → local (private by default)");
  check(!cloudUploadAllowed(base), "default config → upload NOT allowed");

  check(chooseAdapterKind({ ...base, provider: "firestore" }) === "local",
    "firestore selected but not consented + unconfigured → local");
  check(chooseAdapterKind({ provider: "firestore", consented: true, projectId: "p", apiKey: "" }) === "local",
    "consented but no API key → local");
  check(chooseAdapterKind({ provider: "firestore", consented: true, projectId: "", apiKey: "k" }) === "local",
    "consented but no project id → local");
  check(chooseAdapterKind({ provider: "firestore", consented: false, projectId: "p", apiKey: "k" }) === "local",
    "configured but NOT consented → local (consent is mandatory)");
  check(chooseAdapterKind({ provider: "firestore", consented: true, projectId: "  ", apiKey: "  " }) === "local",
    "whitespace-only config → local");

  const ok = { provider: "firestore", consented: true, projectId: "my-proj", apiKey: "AIzaXYZ" };
  check(chooseAdapterKind(ok) === "firestore", "opted-in + consented + configured → firestore");
  check(cloudUploadAllowed(ok), "fully configured + consented → upload allowed");

  check(typeof CLOUD_CONSENT_TEXT === "string" && /google/i.test(CLOUD_CONSENT_TEXT),
    "consent text exists and names Google");
}

console.log("\nFirestore encode/decode:");
{
  const b = bundle();
  const enc = encodeBundle(b);
  check(enc.fields.app.stringValue === "chessretabled", "app stored as stringValue");
  check(enc.fields.version.integerValue === "1", "version stored as integerValue string");
  check(enc.fields.exportedISO.stringValue === b.exportedISO, "exportedISO mirrored for cheap comparison");
  check(typeof enc.fields.bundle.stringValue === "string", "whole bundle stored as one JSON string field");

  const round = decodeFirestoreDoc(enc); // a GET doc has the same .fields shape
  check(JSON.stringify(round) === JSON.stringify(b), "decode(encode(bundle)) round-trips exactly");

  check(decodeFirestoreDoc(null) === null, "null doc → null");
  check(decodeFirestoreDoc({}) === null, "doc without fields → null (no remote yet)");
  check(decodeFirestoreDoc({ fields: {} }) === null, "fields without bundle → null");
  check(decodeFirestoreDoc({ fields: { bundle: { stringValue: "{not json" } } }) === null, "malformed JSON → null (no throw)");
}

console.log("\nJWT decode:");
{
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const make = (payload) => `${b64url({ alg: "none" })}.${b64url(payload)}.sig`;
  const claims = decodeJwt(make({ sub: "108423", email: "player@example.com", name: "Renée Müller" }));
  check(claims.sub === "108423", "JWT sub extracted");
  check(claims.email === "player@example.com", "JWT email extracted");
  check(claims.name === "Renée Müller", "JWT UTF-8 payload decoded correctly");
  let threw = false;
  try { decodeJwt("not-a-jwt"); } catch { threw = true; }
  check(threw, "malformed token throws");
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
