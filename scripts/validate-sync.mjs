// Headless verification for the cloud-sync infrastructure: the privacy gate, the
// Google Drive bundle serialize/parse round-trip, and the last-write-wins rule.
// Pure modules only — no fetch, GIS, localStorage, or zustand.
import {
  serializeBundle, parseBundle,
  driveOriginAllowed, effectiveClientId, BUILTIN_GOOGLE_CLIENT_ID, OAUTH_ORIGINS,
} from "../src/state/cloud/googleDrive.ts";
import {
  chooseAdapterKind, cloudUploadAllowed, remoteIsNewer, CLOUD_CONSENT_TEXT,
} from "../src/state/cloud/policy.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { 
console.log(`  ✗ ${msg}`); problems++; }
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

console.log("\nBuilt-in OAuth client + origin gate:");
/* ---- the built-in OAuth client id, and where it may be used --------------
   Shared with Tachyread/GymTracker: same origin, and Google authorises a client
   per origin rather than per path. The app-side gate has to agree with that, or
   a fork gets a confusing failure from Google instead of a clear one from us. */

check(BUILTIN_GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com"), "the built-in client id looks like a client id");
check(OAUTH_ORIGINS.includes("https://adervec.github.io"), "the deployment origin is on the allow list");

check(driveOriginAllowed("https://adervec.github.io", "adervec.github.io"), "the registered origin may use the built-in id");
check(driveOriginAllowed("http://localhost:5173", "localhost"), "localhost may use it, on any port");
check(driveOriginAllowed("http://127.0.0.1:4173", "127.0.0.1"), "127.0.0.1 may use it");
check(!driveOriginAllowed("https://evil.example", "evil.example"), "a random origin may not");
check(!driveOriginAllowed("https://adervec.github.io.evil.example", "adervec.github.io.evil.example"), "a lookalike host may not");
check(!driveOriginAllowed("http://adervec.github.io", "adervec.github.io"), "http on the real host is not the registered origin");

check(
  effectiveClientId("", "https://adervec.github.io", "adervec.github.io") === BUILTIN_GOOGLE_CLIENT_ID,
  "no id supplied on the registered origin falls back to the built-in one"
);
check(
  effectiveClientId("", "https://fork.example", "fork.example") === "",
  "a fork elsewhere gets nothing rather than an id Google will reject"
);
check(
  effectiveClientId("mine.apps.googleusercontent.com", "https://fork.example", "fork.example") === "mine.apps.googleusercontent.com",
  "a fork's own id is used"
);
check(
  effectiveClientId("  mine.apps.googleusercontent.com  ", "https://adervec.github.io", "adervec.github.io") === "mine.apps.googleusercontent.com",
  "a user-supplied id wins over the built-in one, whitespace and all"
);

/* ---- easy sign-in must not become automatic sign-in ---------------------- */
const withBuiltIn = { provider: "drive", clientId: BUILTIN_GOOGLE_CLIENT_ID };
check(chooseAdapterKind({ ...withBuiltIn, consented: false }) === "local", "a built-in id does not remove the consent requirement");
check(chooseAdapterKind({ ...withBuiltIn, consented: true }) === "drive", "opted in and consented, Drive is used");
check(
  chooseAdapterKind({ provider: "local", consented: true, clientId: BUILTIN_GOOGLE_CLIENT_ID }) === "local",
  "a built-in id does not opt you into Drive"
);
check(
  chooseAdapterKind({ provider: "drive", consented: true, clientId: "" }) === "local",
  "no usable client id means the local mirror, whatever else is set"
);

console.log(`\n[validate-sync] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
