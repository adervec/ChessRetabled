import type { DataBundle } from "../dataTransfer.ts";
import type { SyncAdapter, SyncStatus } from "../sync.ts";

// A real cloud SyncAdapter backed by the Google Cloud Firestore REST API. This
// is transport-only infrastructure: point it at your own Firebase/Firestore
// project (project id + web API key) and, optionally, a Bearer token from
// Google sign-in, and it round-trips the same DataBundle the local mirror does.
//
// The whole bundle is stored as one JSON string field in a single document
// (collection/docId). Firestore string fields cap at ~1 MB; the archive is
// capped at 1000 records, which stays well under that for normal use.
//
// NOTE: type-only imports above are erased at runtime, so this module is free of
// browser/zustand globals at import time and the pure encode/decode helpers can
// be exercised headlessly. fetch/localStorage are touched only inside methods.

export interface FirestoreConfig {
  projectId: string;
  apiKey: string;
  collection: string;
  /** Document id — typically the signed-in user's stable id. */
  docId: string;
  /** Optional Bearer token (a Firebase/Google ID token) for authenticated rules. */
  idToken?: string;
}

// Shared with state/sync.ts by value (kept in sync deliberately, not imported,
// so this module stays runtime-dependency-free for headless testing).
const STATUS_KEY = "chessretabled.syncstatus.v1";

/** Encode a bundle as a Firestore document PATCH body. */
export function encodeBundle(bundle: DataBundle): { fields: Record<string, unknown> } {
  return {
    fields: {
      app: { stringValue: bundle.app },
      version: { integerValue: String(bundle.version) },
      exportedISO: { stringValue: bundle.exportedISO },
      bundle: { stringValue: JSON.stringify(bundle) },
    },
  };
}

/** Decode a Firestore document JSON back into a DataBundle (null if absent/empty). */
export function decodeFirestoreDoc(doc: unknown): DataBundle | null {
  const fields = (doc as { fields?: Record<string, { stringValue?: string }> })?.fields;
  const raw = fields?.bundle?.stringValue;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DataBundle;
  } catch {
    return null;
  }
}

async function errorText(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return body?.error?.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export class FirestoreSyncAdapter implements SyncAdapter {
  readonly id = "google-firestore";
  readonly label = "Google Cloud (Firestore)";
  private readonly cfg: FirestoreConfig;

  constructor(cfg: FirestoreConfig) {
    this.cfg = cfg;
  }

  private docUrl(): string {
    const { projectId, collection, docId, apiKey } = this.cfg;
    const path =
      `projects/${encodeURIComponent(projectId)}/databases/(default)/documents/` +
      `${encodeURIComponent(collection)}/${encodeURIComponent(docId)}`;
    return `https://firestore.googleapis.com/v1/${path}?key=${encodeURIComponent(apiKey)}`;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.cfg.idToken) h["Authorization"] = `Bearer ${this.cfg.idToken}`;
    return h;
  }

  async pull(): Promise<DataBundle | null> {
    const res = await fetch(this.docUrl(), { headers: this.headers() });
    if (res.status === 404) return null; // no document yet
    if (!res.ok) throw new Error(`Firestore pull failed (${res.status}): ${await errorText(res)}`);
    return decodeFirestoreDoc(await res.json());
  }

  async push(bundle: DataBundle): Promise<void> {
    const res = await fetch(this.docUrl(), {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify(encodeBundle(bundle)),
    });
    if (!res.ok) throw new Error(`Firestore push failed (${res.status}): ${await errorText(res)}`);
  }

  status(): SyncStatus {
    try {
      const raw = localStorage.getItem(STATUS_KEY);
      if (raw) return JSON.parse(raw) as SyncStatus;
    } catch {
      /* ignore */
    }
    return { state: "idle", lastSyncedISO: null };
  }
}
