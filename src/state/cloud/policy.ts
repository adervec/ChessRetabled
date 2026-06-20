// The privacy gate for cloud sync. Pure + dependency-free so it can be unit
// tested headlessly and reasoned about in isolation: cloud sync is OFF by
// default and NOTHING leaves the device until the user has (a) explicitly
// chosen a cloud provider, (b) given explicit consent, and (c) configured it.

export type SyncProvider = "local" | "firestore";

export interface SyncGateInput {
  provider: SyncProvider;
  consented: boolean;
  projectId: string;
  apiKey: string;
}

/**
 * Decide which adapter to actually use. Returns "firestore" only when the user
 * opted into it, consented, and supplied the minimum config — otherwise "local"
 * (the on-device mirror that never makes a network request). This is the single
 * chokepoint every caller routes through, so the default is always private.
 */
export function chooseAdapterKind(c: SyncGateInput): SyncProvider {
  if (
    c.provider === "firestore" &&
    c.consented === true &&
    c.projectId.trim() !== "" &&
    c.apiKey.trim() !== ""
  ) {
    return "firestore";
  }
  return "local";
}

/** True when uploading to the cloud is permitted for this config. */
export function cloudUploadAllowed(c: SyncGateInput): boolean {
  return chooseAdapterKind(c) === "firestore";
}

/**
 * Last-write-wins decision for sync: pull the remote copy only when it is newer
 * than local. ISO-8601 timestamps compare lexicographically = chronologically.
 */
export function remoteIsNewer(localISO: string, remoteISO: string | null | undefined): boolean {
  if (!remoteISO) return false;
  return remoteISO > localISO;
}

/** Shown next to the consent checkbox so the user knows exactly what is sent. */
export const CLOUD_CONSENT_TEXT =
  "Sync uploads your progress, settings, and full game history to your own " +
  "Google Cloud (Firestore) project so you can restore it on other devices. " +
  "Data is sent to Google's servers and is no longer only on this device. " +
  "It stays off until you turn it on, and you can disconnect at any time.";
