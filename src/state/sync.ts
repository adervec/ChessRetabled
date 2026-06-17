import { buildBundle, applyBundle, type DataBundle } from "./dataTransfer";

// Cloud-sync groundwork. There is no backend yet — but the seam is real: define
// a SyncAdapter, ship a LocalSyncAdapter that mirrors to a separate localStorage
// key (standing in for "the cloud"), and route everything through getSyncAdapter().
// A future cloud adapter (e.g. a REST/Firebase/Supabase backend) implements the
// same interface and drops in with no caller changes.

export type SyncState = "idle" | "syncing" | "ok" | "error" | "offline";

export interface SyncStatus {
  state: SyncState;
  lastSyncedISO: string | null;
  message?: string;
}

export interface SyncAdapter {
  readonly id: string;
  readonly label: string;
  /** Fetch the remote bundle, or null if there is nothing stored remotely. */
  pull(): Promise<DataBundle | null>;
  /** Replace the remote bundle with `bundle`. */
  push(bundle: DataBundle): Promise<void>;
  status(): SyncStatus;
}

const REMOTE_KEY = "chessretabled.cloudmirror.v1";
const STATUS_KEY = "chessretabled.syncstatus.v1";

/** Stand-in adapter: persists the "remote" copy in a separate localStorage key. */
class LocalSyncAdapter implements SyncAdapter {
  readonly id = "local-mirror";
  readonly label = "Local mirror (no cloud yet)";

  async pull(): Promise<DataBundle | null> {
    const raw = localStorage.getItem(REMOTE_KEY);
    return raw ? (JSON.parse(raw) as DataBundle) : null;
  }

  async push(bundle: DataBundle): Promise<void> {
    localStorage.setItem(REMOTE_KEY, JSON.stringify(bundle));
  }

  status(): SyncStatus {
    const raw = localStorage.getItem(STATUS_KEY);
    return raw ? (JSON.parse(raw) as SyncStatus) : { state: "idle", lastSyncedISO: null };
  }
}

let adapter: SyncAdapter = new LocalSyncAdapter();

/** Swap in a real cloud adapter here once a backend exists. */
export function setSyncAdapter(a: SyncAdapter): void {
  adapter = a;
}
export function getSyncAdapter(): SyncAdapter {
  return adapter;
}

function setStatus(s: SyncStatus): void {
  localStorage.setItem(STATUS_KEY, JSON.stringify(s));
}

/**
 * Push local data up, then merge anything newer found remotely. With the local
 * mirror this is a round-trip no-op, but it exercises the full code path a real
 * backend would use (last-write-wins by `exportedISO`).
 */
export async function syncNow(): Promise<SyncStatus> {
  setStatus({ state: "syncing", lastSyncedISO: getSyncAdapter().status().lastSyncedISO });
  try {
    const local = buildBundle();
    const remote = await getSyncAdapter().pull();
    if (remote && remote.exportedISO > local.exportedISO) {
      applyBundle(remote);
    } else {
      await getSyncAdapter().push(local);
    }
    const status: SyncStatus = { state: "ok", lastSyncedISO: new Date().toISOString() };
    setStatus(status);
    return status;
  } catch (e) {
    const status: SyncStatus = {
      state: "error",
      lastSyncedISO: getSyncAdapter().status().lastSyncedISO,
      message: e instanceof Error ? e.message : "sync failed",
    };
    setStatus(status);
    return status;
  }
}
