import type { DataBundle } from "../dataTransfer.ts";
import type { SyncAdapter, SyncStatus } from "../sync.ts";

// Google Drive sync via the GIS OAuth2 token model. Only the drive.appdata scope
// is requested: a private, per-app hidden folder (light consent, never touches
// the user's visible Drive). The whole DataBundle is kept as one JSON file. The
// access token lives in memory only and is never persisted.
//
// Type-only imports above are erased at runtime, so the pure helpers
// (serializeBundle/parseBundle) can be exercised headlessly; window/fetch/
// localStorage are touched only inside functions/methods.

export const GOOGLE_GIS_SRC = "https://accounts.google.com/gsi/client";
export const DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.appdata openid " +
  "https://www.googleapis.com/auth/userinfo.profile " +
  "https://www.googleapis.com/auth/userinfo.email";
export const STATE_FILENAME = "chessretabled-state.json";

// Public OAuth client id (an identifier, not a secret — safe to commit). Empty
// here ⇒ the UI shows one-time setup steps + a field to paste your own. Create
// one: Google Cloud Console → OAuth consent screen → Credentials → OAuth client
// id (Web application) → add your JavaScript origins (e.g. your GitHub Pages URL
// and http://localhost:5173).
export const DEFAULT_GOOGLE_CLIENT_ID = "";

export interface GoogleAccount {
  name: string;
  email: string;
  picture: string;
}

// ---- pure helpers (headless-testable) ----
export function serializeBundle(bundle: DataBundle): string {
  return JSON.stringify(bundle);
}

export function parseBundle(text: string | null | undefined): DataBundle | null {
  if (!text) return null;
  try {
    const b = JSON.parse(text) as unknown;
    return b && typeof b === "object" ? (b as DataBundle) : null;
  } catch {
    return null;
  }
}

// ---- GIS token model ----
interface TokenResp { access_token?: string; expires_in?: number; error?: string }
interface GisTokenClient {
  callback: (r: TokenResp) => void;
  error_callback?: (e: unknown) => void;
  requestAccessToken(opts?: { prompt?: string }): void;
}
interface GisOauth2 {
  initTokenClient(cfg: { client_id: string; scope: string; callback: (r: TokenResp) => void }): GisTokenClient;
}
declare global {
  interface Window { google?: { accounts?: { oauth2?: GisOauth2 } } }
}

let scriptPromise: Promise<void> | null = null;
let token: { value: string; exp: number } | null = null; // IN MEMORY ONLY
let tokenClient: GisTokenClient | null = null;
let tokenClientId = "";

function loadGsi(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("Not in a browser"));
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement("script");
    s.src = GOOGLE_GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("Failed to load Google Identity Services")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

function errMsg(e: unknown): string {
  if (!e) return "";
  if (typeof e === "string") return e;
  if (typeof e === "object") {
    const o = e as Record<string, unknown>;
    return String(o.type ?? o.message ?? "");
  }
  return String(e);
}

/**
 * Resolve a Drive access token. prompt:'' is silent when a grant + Google
 * session already exist (so a returning user isn't re-prompted), and shows the
 * consent popup only when needed — so call the interactive path from a click.
 */
export async function ensureAccessToken(clientId: string, force = false): Promise<string> {
  if (!clientId.trim()) throw new Error("No Google OAuth client id configured.");
  if (!force && token && token.exp > Date.now() + 60000) return token.value;
  await loadGsi();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("Google sign-in unavailable.");
  if (!tokenClient || tokenClientId !== clientId) {
    tokenClient = oauth2.initTokenClient({ client_id: clientId, scope: DRIVE_SCOPE, callback: () => {} });
    tokenClientId = clientId;
  }
  return new Promise<string>((resolve, reject) => {
    tokenClient!.callback = (resp) => {
      if (resp && resp.access_token) {
        token = { value: resp.access_token, exp: Date.now() + (resp.expires_in ?? 3600) * 1000 };
        resolve(resp.access_token);
      } else {
        reject(new Error(resp?.error ? String(resp.error) : "Authorization failed"));
      }
    };
    tokenClient!.error_callback = (err) => reject(new Error(errMsg(err) || "Authorization error"));
    try {
      tokenClient!.requestAccessToken({ prompt: "" });
    } catch (e) {
      reject(e instanceof Error ? e : new Error("Authorization error"));
    }
  });
}

export function clearAccessToken(): void {
  token = null;
}

export async function fetchGoogleAccount(accessToken: string): Promise<GoogleAccount> {
  const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (!r.ok) throw new Error("Could not load Google account (" + r.status + ")");
  const j = (await r.json()) as { name?: string; given_name?: string; email?: string; picture?: string };
  return { name: j.name || j.given_name || "", email: j.email || "", picture: j.picture || "" };
}

// ---- the adapter (appDataFolder; one chessretabled-state.json) ----
const FILEID_KEY = "chessretabled.driveFileId.v1";
// Shared with state/sync.ts by value (kept aligned deliberately, not imported,
// so this module stays runtime-dependency-free for headless testing).
const STATUS_KEY = "chessretabled.syncstatus.v1";
let cachedFileId: string | null = null;

export function forgetDriveFile(): void {
  cachedFileId = null;
  try { localStorage.removeItem(FILEID_KEY); } catch { /* ignore */ }
}

export interface DriveConfig { clientId: string }

export class GoogleDriveSyncAdapter implements SyncAdapter {
  readonly id = "google-drive";
  readonly label = "Google Drive";
  private readonly clientId: string;

  constructor(cfg: DriveConfig) {
    this.clientId = cfg.clientId;
  }

  private async authHeader(): Promise<Record<string, string>> {
    return { Authorization: "Bearer " + (await ensureAccessToken(this.clientId)) };
  }

  private getFileId(): string | null {
    if (cachedFileId) return cachedFileId;
    try {
      const v = localStorage.getItem(FILEID_KEY);
      if (v) cachedFileId = v;
    } catch { /* ignore */ }
    return cachedFileId;
  }

  private setFileId(id: string): void {
    cachedFileId = id;
    try { localStorage.setItem(FILEID_KEY, id); } catch { /* ignore */ }
  }

  private async findOrCreateFile(): Promise<string> {
    const cached = this.getFileId();
    if (cached) return cached;
    const hdr = await this.authHeader();
    const q = encodeURIComponent("name='" + STATE_FILENAME + "' and trashed=false");
    const sr = await fetch(
      "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=" + q,
      { headers: hdr },
    );
    if (sr.ok) {
      const j = (await sr.json()) as { files?: { id: string }[] };
      if (j.files && j.files.length) { this.setFileId(j.files[0].id); return j.files[0].id; }
    }
    const boundary = "chessretabledsync8821";
    const meta = { name: STATE_FILENAME, parents: ["appDataFolder"] };
    const body =
      "--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(meta) +
      "\r\n--" + boundary + "\r\nContent-Type: application/json\r\n\r\n{}\r\n--" + boundary + "--";
    const cr = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method: "POST",
      headers: { ...hdr, "Content-Type": "multipart/related; boundary=" + boundary },
      body,
    });
    if (!cr.ok) throw new Error("Drive file create failed (" + cr.status + ")");
    const cj = (await cr.json()) as { id: string };
    this.setFileId(cj.id);
    return cj.id;
  }

  async pull(): Promise<DataBundle | null> {
    const fid = await this.findOrCreateFile();
    const r = await fetch("https://www.googleapis.com/drive/v3/files/" + fid + "?alt=media", {
      headers: await this.authHeader(),
    });
    if (r.status === 404) { forgetDriveFile(); return null; } // file vanished; recreate next push
    if (!r.ok) throw new Error("Drive read failed (" + r.status + ")");
    return parseBundle(await r.text());
  }

  async push(bundle: DataBundle): Promise<void> {
    const fid = await this.findOrCreateFile();
    const r = await fetch("https://www.googleapis.com/upload/drive/v3/files/" + fid + "?uploadType=media", {
      method: "PATCH",
      headers: { ...(await this.authHeader()), "Content-Type": "application/json" },
      body: serializeBundle(bundle),
    });
    if (!r.ok) throw new Error("Drive write failed (" + r.status + ")");
  }

  status(): SyncStatus {
    try {
      const raw = localStorage.getItem(STATUS_KEY);
      if (raw) return JSON.parse(raw) as SyncStatus;
    } catch { /* ignore */ }
    return { state: "idle", lastSyncedISO: null };
  }
}
