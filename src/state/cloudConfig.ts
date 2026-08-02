import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setSyncAdapter, LocalSyncAdapter } from "./sync";
import {
  GoogleDriveSyncAdapter, DEFAULT_GOOGLE_CLIENT_ID, clearAccessToken, forgetDriveFile,
  type GoogleAccount,
} from "./cloud/googleDrive";
import { chooseAdapterKind, type SyncProvider } from "./cloud/policy";

// User-facing cloud-sync configuration. The privacy gate lives in cloud/policy;
// this store just holds the settings and, on every change, (re)registers the
// active SyncAdapter through that gate — so the rest of the app keeps calling
// syncNow() without knowing whether Drive is connected.
//
// The OAuth access token is NOT here: it lives in memory in cloud/googleDrive
// and is never persisted. Only the public client id + the connected account
// (name/email/avatar, for display) are stored.

export interface CloudConfigState {
  provider: SyncProvider;
  consented: boolean;
  clientId: string;
  account: GoogleAccount | null;

  update: (patch: Partial<Pick<CloudConfigState, "provider" | "consented" | "clientId" | "account">>) => void;
  setProvider: (p: SyncProvider) => void;
  setConsent: (b: boolean) => void;
  connected: (account: GoogleAccount) => void;
  disconnect: () => void;
}

const initial = {
  provider: "local" as SyncProvider,
  consented: false,
  clientId: DEFAULT_GOOGLE_CLIENT_ID,
  account: null as GoogleAccount | null,
};

export const useCloudConfig = create<CloudConfigState>()(
  persist(
    (set) => ({
      ...initial,
      update: (patch) => { set(patch); applyCloudConfig(); },
      setProvider: (provider) => { set({ provider }); applyCloudConfig(); },
      setConsent: (consented) => { set({ consented }); applyCloudConfig(); },
      connected: (account) => { set({ account }); applyCloudConfig(); },
      disconnect: () => {
        clearAccessToken();
        forgetDriveFile();
        set({ provider: "local", consented: false, account: null });
        applyCloudConfig();
      },
    }),
    {
      name: "chessretabled.cloud.v2",
      partialize: (s) => ({
        provider: s.provider,
        consented: s.consented,
        clientId: s.clientId,
        account: s.account,
      }),
    }
  )
);

/** Build the adapter the current config resolves to (through the privacy gate). */
export function buildAdapterFor(c: CloudConfigState) {
  if (chooseAdapterKind(c) === "drive") {
    return new GoogleDriveSyncAdapter({ clientId: c.clientId.trim() });
  }
  return new LocalSyncAdapter();
}

/** Register the active SyncAdapter based on the current config. Idempotent. */
export function applyCloudConfig(): void {
  setSyncAdapter(buildAdapterFor(useCloudConfig.getState()));
}
