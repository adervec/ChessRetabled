import { useRef, useState } from "react";
import { useSettings, THEMES, ANIM_SPEEDS } from "../../state/useSettings";
import { downloadExport, importJson } from "../../state/dataTransfer";
import { syncNow } from "../../state/sync";
import { useCloudConfig } from "../../state/cloudConfig";
import { chooseAdapterKind, CLOUD_CONSENT_TEXT } from "../../state/cloud/policy";
import { ensureAccessToken, fetchGoogleAccount } from "../../state/cloud/googleDrive";
import "./SettingsPanel.css";

export function SettingsPanel() {
  const { theme, animSpeed, boardTilt, setTheme, setAnimSpeed, setBoardTilt } =
    useSettings();
  const cloud = useCloudConfig();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cloudActive = chooseAdapterKind(cloud) === "drive";

  async function onConnect() {
    setMsg("Opening Google Drive authorization…");
    try {
      const token = await ensureAccessToken(cloud.clientId, true);
      const account = await fetchGoogleAccount(token);
      cloud.connected(account);
      setMsg(`Connected as ${account.email || account.name || "your Google account"}`);
    } catch (e) {
      setMsg(`Connect failed: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    f.text().then((txt) => {
      const r = importJson(txt);
      if (r.ok) {
        setMsg("Imported ✓ — reloading…");
        setTimeout(() => window.location.reload(), 700);
      } else {
        setMsg(`Import failed: ${r.error}`);
      }
    });
  }

  async function onSync() {
    setMsg("Syncing…");
    const s = await syncNow();
    setMsg(
      s.state === "ok"
        ? `Synced ✓ at ${s.lastSyncedISO ? new Date(s.lastSyncedISO).toLocaleTimeString() : "now"}`
        : `Sync ${s.state}${s.message ? ": " + s.message : ""}`
    );
  }

  return (
    <section className="settings">
      <h2 className="settings__title">⚙ Settings</h2>

      <div className="settings__group">
        <h3>Theme</h3>
        <div className="settings__row">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={"theme-chip" + (t.id === theme ? " is-on" : "")}
              onClick={() => setTheme(t.id)}
            >
              <span className="theme-chip__swatches">
                {t.swatch.map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </span>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="settings__group">
        <h3>Move animation</h3>
        <div className="settings__row">
          {ANIM_SPEEDS.map((s) => (
            <button
              key={s.id}
              className={"chip-btn" + (s.id === animSpeed ? " is-on" : "")}
              onClick={() => setAnimSpeed(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <p className="settings__hint">
          Pieces glide between squares instead of teleporting. The computer waits at
          least one animation before replying.
        </p>
      </div>

      <div className="settings__group">
        <h3>Board style</h3>
        <div className="settings__row">
          <button
            className={"chip-btn" + (boardTilt ? " is-on" : "")}
            onClick={() => setBoardTilt(true)}
          >
            2.5D tilt
          </button>
          <button
            className={"chip-btn" + (!boardTilt ? " is-on" : "")}
            onClick={() => setBoardTilt(false)}
          >
            Flat
          </button>
        </div>
      </div>

      <div className="settings__group">
        <h3>Data &amp; sync</h3>
        <div className="settings__row">
          <button className="btn btn--sm btn--sky" onClick={downloadExport}>
            ⬇ Export JSON
          </button>
          <button className="btn btn--sm" onClick={() => fileRef.current?.click()}>
            ⬆ Import JSON
          </button>
          <button className="btn btn--sm btn--mint" onClick={onSync}>
            ☁ Sync now
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={onImport}
          />
        </div>
        <p className="settings__hint">
          Export bundles your progress, settings, and full game history. “Sync now”
          uses whichever destination you’ve set below — on-device by default.
        </p>

        <div className="settings__row" style={{ marginTop: 12 }}>
          <button
            className={"chip-btn" + (cloud.provider === "local" ? " is-on" : "")}
            onClick={() => cloud.setProvider("local")}
          >
            🔒 On-device only
          </button>
          <button
            className={"chip-btn" + (cloud.provider === "drive" ? " is-on" : "")}
            onClick={() => cloud.setProvider("drive")}
          >
            ☁ Google Drive
          </button>
          <span className={"settings__badge settings__badge--" + (cloudActive ? "on" : "off")}>
            {cloudActive ? "● Drive active" : "○ local mirror"}
          </span>
        </div>

        {cloud.provider === "drive" && (
          <div className="settings__cloudbox">
            <label className="settings__consent">
              <input
                type="checkbox"
                checked={cloud.consented}
                onChange={(e) => cloud.setConsent(e.target.checked)}
              />
              <span>{CLOUD_CONSENT_TEXT}</span>
            </label>

            <div className="settings__field">
              <label htmlFor="cfg-client">Google OAuth client ID</label>
              <input
                id="cfg-client"
                className="settings__input"
                value={cloud.clientId}
                placeholder="….apps.googleusercontent.com"
                onChange={(e) => cloud.update({ clientId: e.target.value })}
              />
            </div>

            <div className="settings__account">
              {cloud.account ? (
                <>
                  <span className="settings__badge settings__badge--on">
                    ✓ {cloud.account.email || cloud.account.name || "Connected"}
                  </span>
                  <button className="btn btn--sm" onClick={onConnect}>Reconnect</button>
                </>
              ) : (
                <button
                  className="btn btn--sm btn--mint"
                  onClick={onConnect}
                  disabled={!cloud.consented || !cloud.clientId.trim()}
                >
                  Connect Google Drive
                </button>
              )}
              <button className="btn btn--sm btn--ghost" onClick={cloud.disconnect}>
                Disconnect
              </button>
            </div>

            <p className="settings__hint">
              Syncs to a private per-app folder in your own Google Drive (the
              <code> drive.appdata </code> scope — hidden from your normal files).
              Needs a Google OAuth client ID (an identifier, not a secret): create
              one in the Google Cloud Console → OAuth consent screen → Credentials
              → OAuth client ID (Web), and add this site’s URL as an authorized
              JavaScript origin. Nothing uploads until you tick consent and connect.
            </p>
          </div>
        )}

        {msg && <p className="settings__msg">{msg}</p>}
      </div>
    </section>
  );
}
