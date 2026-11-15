// "Erase everything on this device" — the data-safety side of the house standard.
//
// The dangerous part is *scope*, not deletion: every app by this maker is served
// from adervec.github.io, so they all share one localStorage. `localStorage.clear()`
// here would silently wipe Tachyread's library and GymTracker's log. So this removes
// our own keys only, and for the two registries the apps genuinely share it strips
// out our rows and writes the rest back rather than deleting the key.
//
// localStorage is only ever touched inside these functions (never at module scope),
// so the module imports cleanly in the Node harness.

/** Everything the app persists is namespaced, which is what makes this safe. */
const OWN_PREFIX = "chessretabled.";

/** Our keys that predate the namespace. Add here if another one ever escapes it. */
const OWN_KEYS = ["cr-coach-reply"];

/**
 * Cross-app keys written by this app but owned by all of them: the portal's
 * installed-app registry and its XP ledger. Pruned, never removed.
 */
export const SHARED_KEYS = ["portal-installed", "portal-activity"];

/** How we identify our own rows inside those shared keys. */
export const APP_NAME = "ChessRetabled";

/** True for a key this app may delete outright. */
export function isOwnKey(key: string): boolean {
  return key.startsWith(OWN_PREFIX) || OWN_KEYS.includes(key);
}

/**
 * A shared registry value with this app's rows taken out, or null to leave the
 * key exactly as it is (nothing of ours in it, or we cannot parse it — in which
 * case it is another app's business and we do not touch it).
 */
export function pruneShared(key: string, raw: string): string | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  // { "AppName": installedAtMs, ... }
  if (key === "portal-installed") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const reg = value as Record<string, unknown>;
    if (!(APP_NAME in reg)) return null;
    delete reg[APP_NAME];
    return JSON.stringify(reg);
  }
  // [ [unixSeconds, "AppName", category, xp], ... ]
  if (key === "portal-activity") {
    if (!Array.isArray(value)) return null;
    const kept = value.filter((row) => !Array.isArray(row) || row[1] !== APP_NAME);
    return kept.length === value.length ? null : JSON.stringify(kept);
  }
  return null;
}

/** Just the bits of Storage used here, so the harness can drive a fake. */
export interface KeyStore {
  readonly length: number;
  key(i: number): string | null;
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export interface EraseReport {
  /** Keys deleted outright. */
  removed: string[];
  /** Shared keys that survived with our rows taken out. */
  pruned: string[];
}

/**
 * Wipe this app's data from this device. Does **not** touch the Drive copy —
 * which is the whole reason the UI says so before asking for confirmation.
 */
export function eraseLocalData(store: KeyStore = localStorage): EraseReport {
  // Snapshot the keys first: removing while walking key(i) shifts the indices.
  const all: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k !== null) all.push(k);
  }

  const removed = all.filter(isOwnKey);
  for (const k of removed) store.removeItem(k);

  const pruned: string[] = [];
  for (const k of SHARED_KEYS) {
    const raw = store.getItem(k);
    if (raw === null) continue;
    const next = pruneShared(k, raw);
    if (next === null) continue;
    store.setItem(k, next);
    pruned.push(k);
  }

  return { removed, pruned };
}
