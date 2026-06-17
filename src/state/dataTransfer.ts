import { useProgress } from "./useProgress";
import { useSettings } from "./useSettings";
import { useArchive } from "./useArchive";

// One-stop JSON export/import of all persisted app data. The same bundle shape
// is what the cloud-sync layer pushes/pulls (state/sync.ts), so a future cloud
// backend reuses this exactly.

export const BUNDLE_APP = "chessretabled";
export const BUNDLE_VERSION = 1;

export interface DataBundle {
  app: string;
  version: number;
  exportedISO: string;
  progress: Record<string, unknown>;
  settings: Record<string, unknown>;
  archive: Record<string, unknown>;
}

/** Strip action functions so only serialisable data is captured. */
function dataOnly(state: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state)) {
    if (typeof v !== "function") out[k] = v;
  }
  return out;
}

export function buildBundle(): DataBundle {
  return {
    app: BUNDLE_APP,
    version: BUNDLE_VERSION,
    exportedISO: new Date().toISOString(),
    progress: dataOnly(useProgress.getState() as unknown as Record<string, unknown>),
    settings: dataOnly(useSettings.getState() as unknown as Record<string, unknown>),
    archive: dataOnly(useArchive.getState() as unknown as Record<string, unknown>),
  };
}

export function exportJson(): string {
  return JSON.stringify(buildBundle(), null, 2);
}

export interface ImportResult {
  ok: boolean;
  error?: string;
}

/** Merge a bundle into the live stores (zustand setState keeps the actions). */
export function applyBundle(bundle: DataBundle): ImportResult {
  if (!bundle || bundle.app !== BUNDLE_APP) {
    return { ok: false, error: "Not a ChessRetabled data file." };
  }
  if (typeof bundle.version !== "number" || bundle.version > BUNDLE_VERSION) {
    return { ok: false, error: `Unsupported data version (${bundle.version}).` };
  }
  if (bundle.progress) useProgress.setState(bundle.progress as never);
  if (bundle.settings) useSettings.setState(bundle.settings as never);
  if (bundle.archive) useArchive.setState(bundle.archive as never);
  return { ok: true };
}

export function importJson(json: string): ImportResult {
  let parsed: DataBundle;
  try {
    parsed = JSON.parse(json) as DataBundle;
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }
  return applyBundle(parsed);
}

/** Trigger a browser download of the current data as a .json file. */
export function downloadExport(): void {
  const blob = new Blob([exportJson()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `chessretabled-data-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
