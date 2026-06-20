// Google sign-in seam via Google Identity Services (GIS). The OAuth client id is
// public (not a secret). Sign-in yields a signed ID token (a JWT) plus the
// user's stable id/email, which the Firestore adapter uses as the document id
// and Bearer token.
//
// Groundwork note: a GIS ID token authenticates the *user to Google*. To make
// Firestore security rules trust it you normally exchange this Google credential
// for a Firebase ID token (Firebase Auth `signInWithCredential`). That exchange
// is the one backend-specific piece a deployment adds; this module provides the
// identity, and the adapter accepts whatever token it's given.

export interface GoogleIdentity {
  idToken: string;
  sub: string;
  email?: string;
  name?: string;
}

interface GsiIdClient {
  initialize(opts: { client_id: string; callback: (resp: { credential?: string }) => void }): void;
  prompt(): void;
}
declare global {
  interface Window {
    google?: { accounts?: { id?: GsiIdClient } };
  }
}

/** Decode a JWT payload (no signature verification — that's the server's job). */
export function decodeJwt(token: string): Record<string, unknown> {
  const part = token.split(".")[1];
  if (!part) throw new Error("Malformed JWT");
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const binary = atob(b64 + pad);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
}

let gsiPromise: Promise<void> | null = null;

/** Inject the GIS client script once. */
export function loadGsi(): Promise<void> {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("No document (not in a browser)"));
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gsiPromise = null;
      reject(new Error("Failed to load Google Identity Services"));
    };
    document.head.appendChild(s);
  });
  return gsiPromise;
}

/** Prompt Google sign-in and resolve the signed-in identity. */
export async function signInWithGoogle(clientId: string): Promise<GoogleIdentity> {
  if (!clientId.trim()) throw new Error("No Google OAuth client id configured.");
  await loadGsi();
  const idClient = window.google?.accounts?.id;
  if (!idClient) throw new Error("Google Identity Services unavailable.");
  return new Promise<GoogleIdentity>((resolve, reject) => {
    try {
      idClient.initialize({
        client_id: clientId,
        callback: (resp) => {
          if (!resp?.credential) return reject(new Error("Sign-in returned no credential."));
          try {
            const claims = decodeJwt(resp.credential);
            resolve({
              idToken: resp.credential,
              sub: String(claims.sub ?? ""),
              email: typeof claims.email === "string" ? claims.email : undefined,
              name: typeof claims.name === "string" ? claims.name : undefined,
            });
          } catch (e) {
            reject(e instanceof Error ? e : new Error("Could not read sign-in token."));
          }
        },
      });
      idClient.prompt();
    } catch (e) {
      reject(e instanceof Error ? e : new Error("Google sign-in failed."));
    }
  });
}
