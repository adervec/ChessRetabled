// The privacy gate for cloud sync. Pure + dependency-free so it can be unit
// tested headlessly and reasoned about in isolation: cloud sync is OFF by
// default and NOTHING leaves the device until the user has (a) explicitly
// chosen Google Drive, (b) given explicit consent, and (c) supplied an OAuth
// client id. Data lives in the user's own Drive (a hidden per-app folder).

export type SyncProvider = "local" | "drive";

export interface SyncGateInput {
  provider: SyncProvider;
  consented: boolean;
  clientId: string;
}

/**
 * Decide which adapter to actually use. Returns "drive" only when the user opted
 * into it, consented, and supplied an OAuth client id — otherwise "local" (the
 * on-device mirror that never makes a network request). This is the single
 * chokepoint every caller routes through, so the default is always private.
 */
export function chooseAdapterKind(c: SyncGateInput): SyncProvider {
  if (c.provider === "drive" && c.consented === true && c.clientId.trim() !== "") {
    return "drive";
  }
  return "local";
}

/** True when uploading to the cloud is permitted for this config. */
export function cloudUploadAllowed(c: SyncGateInput): boolean {
  return chooseAdapterKind(c) === "drive";
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
  "Sync uploads your progress, settings, and full game history to a private " +
  "per-app folder in your own Google Drive (the app data folder — it stays " +
  "hidden from your normal Drive files) so you can restore it on other " +
  "devices. Data is sent to Google's servers and is no longer only on this " +
  "device. It stays off until you connect, and you can disconnect at any time.";
