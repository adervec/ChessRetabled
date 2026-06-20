import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setSyncAdapter, LocalSyncAdapter } from "./sync";
import { FirestoreSyncAdapter } from "./cloud/firestore";
import { chooseAdapterKind, type SyncProvider } from "./cloud/policy";

// User-facing cloud-sync configuration. The privacy gate lives in cloud/policy;
// this store just holds the settings and, on every change, (re)registers the
// active SyncAdapter through that gate — so the rest of the app keeps calling
// syncNow() without knowing or caring whether a real backend is connected.
//
// The Bearer idToken is intentionally NOT persisted (it is short-lived and
// sensitive); on reload the user re-signs-in to refresh it.

export interface CloudConfigState {
  provider: SyncProvider;
  consented: boolean;
  projectId: string;
  apiKey: string;
  collection: string;
  clientId: string;
  // signed-in identity (idToken not persisted)
  userId: string;
  email: string;
  idToken: string;

  update: (patch: Partial<Omit<CloudConfigState, "update" | "setProvider" | "setConsent" | "signedIn" | "signOut" | "disconnect">>) => void;
  setProvider: (p: SyncProvider) => void;
  setConsent: (b: boolean) => void;
  signedIn: (id: { sub: string; email?: string; idToken: string }) => void;
  signOut: () => void;
  disconnect: () => void;
}

const initial = {
  provider: "local" as SyncProvider,
  consented: false,
  projectId: "",
  apiKey: "",
  collection: "chessretabled",
  clientId: "",
  userId: "",
  email: "",
  idToken: "",
};

export const useCloudConfig = create<CloudConfigState>()(
  persist(
    (set) => ({
      ...initial,
      update: (patch) => { set(patch); applyCloudConfig(); },
      setProvider: (provider) => { set({ provider }); applyCloudConfig(); },
      setConsent: (consented) => { set({ consented }); applyCloudConfig(); },
      signedIn: ({ sub, email, idToken }) => { set({ userId: sub, email: email ?? "", idToken }); applyCloudConfig(); },
      signOut: () => { set({ idToken: "", email: "", userId: "" }); applyCloudConfig(); },
      disconnect: () => { set({ provider: "local", consented: false, idToken: "" }); applyCloudConfig(); },
    }),
    {
      name: "chessretabled.cloud.v1",
      // Persist config but never the short-lived Bearer token.
      partialize: (s) => ({
        provider: s.provider,
        consented: s.consented,
        projectId: s.projectId,
        apiKey: s.apiKey,
        collection: s.collection,
        clientId: s.clientId,
        userId: s.userId,
        email: s.email,
      }),
    }
  )
);

/** Build the adapter the current config resolves to (through the privacy gate). */
export function buildAdapterFor(c: CloudConfigState) {
  if (chooseAdapterKind(c) === "firestore") {
    return new FirestoreSyncAdapter({
      projectId: c.projectId.trim(),
      apiKey: c.apiKey.trim(),
      collection: c.collection.trim() || "chessretabled",
      docId: c.userId.trim() || "shared",
      idToken: c.idToken || undefined,
    });
  }
  return new LocalSyncAdapter();
}

/** Register the active SyncAdapter based on the current config. Idempotent. */
export function applyCloudConfig(): void {
  setSyncAdapter(buildAdapterFor(useCloudConfig.getState()));
}
