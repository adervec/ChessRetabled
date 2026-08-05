import { useRef, useState } from "react";
import { useSettings, THEMES, ANIM_SPEEDS, ORIENTATIONS } from "../../state/useSettings";
import { playSfx } from "../../state/sfx";
import { downloadExport, importJson } from "../../state/dataTransfer";
import { syncNow } from "../../state/sync";
import { useCloudConfig } from "../../state/cloudConfig";
import { chooseAdapterKind, CLOUD_CONSENT_TEXT } from "../../state/cloud/policy";
import { ensureAccessToken, fetchGoogleAccount, currentClientId } from "../../state/cloud/googleDrive";
import "./SettingsPanel.css";

export function SettingsPanel() {
  const {
    theme, animSpeed, boardTilt, orientation, sound, volume,
    setTheme, setAnimSpeed, setBoardTilt, setOrientation, setSound, setVolume,
  } = useSettings();
  const cloud = useCloudConfig();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // The id actually in play: the user's own if they pasted one, otherwise the
  // built-in one on an origin it's registered for.
  const clientId = currentClientId(cloud.clientId);
  const builtIn = !cloud.clientId.trim() && clientId !== "";
  const cloudActive = chooseAdapterKind({ ...cloud, clientId }) === "drive";

  async function onConnect() {
    setMsg("Opening Google Drive authorization…");
    try {
      const token = await ensureAccessToken(clientId, true);
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
        <h3>Layout</h3>
        <div className="settings__row">
          {ORIENTATIONS.map((o) => (
            <button
              key={o.id}
              className={"chip-btn" + (orientation === o.id ? " is-on" : "")}
              onClick={() => setOrientation(o.id)}
            >
              {o.icon} {o.name}
            </button>
          ))}
        </div>
        <p className="settings__hint">
          On a small screen, portrait stacks the board above its panel and
          landscape puts them side by side. Pick one to stop the layout changing
          when you turn the device; <strong>Auto</strong> follows it.
        </p>
      </div>

      <div className="settings__group">
        <h3>Sound</h3>
        <div className="settings__row">
          <button
            className={"chip-btn" + (sound ? " is-on" : "")}
            onClick={() => setSound(true)}
          >
            🔊 On
          </button>
          <button
            className={"chip-btn" + (!sound ? " is-on" : "")}
            onClick={() => setSound(false)}
          >
            🔇 Off
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            disabled={!sound}
            aria-label="Sound volume"
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            onMouseUp={() => playSfx("move")}
          />
        </div>
        <p className="settings__hint">
          Short synthesised cues — a knock when a piece lands, a thud on captures,
          a little fanfare at the end. Nothing is downloaded; it's all generated
          in the browser.
        </p>
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

            <details className="settings__field">
              <summary>
                Google OAuth client ID{" "}
                {builtIn ? "(not needed here)" : cloud.clientId.trim() ? "(yours)" : "(required)"}
              </summary>
              <input
                id="cfg-client"
                className="settings__input"
                value={cloud.clientId}
                placeholder="….apps.googleusercontent.com"
                onChange={(e) => cloud.update({ clientId: e.target.value })}
              />
              <p className="settings__hint">
                {builtIn
                  ? "This site is already registered with Google, so Drive sync works as-is. Paste your own client ID only if you'd rather sync under a project you control."
                  : "This deployment isn't a registered origin for the built-in client, so Drive needs your own: Google Cloud Console → OAuth consent screen → Credentials → OAuth client ID (Web), with this site's URL as an authorized JavaScript origin."}
              </p>
            </details>

            <div className="settings__account">
              {cloud.account ? (
                <>
                  <div className="settings__profile">
                    {cloud.account.picture
                      ? <img className="settings__pfp" src={cloud.account.picture} alt="" referrerPolicy="no-referrer" loading="lazy" />
                      : <span className="settings__pfp settings__pfp--ph">👤</span>}
                    <div className="settings__profiletext">
                      <span className="settings__profilename">{cloud.account.name || "Google account"}</span>
                      {cloud.account.email && <span className="settings__profilemail">{cloud.account.email}</span>}
                    </div>
                    <span className="settings__badge settings__badge--on">✓ Synced</span>
                  </div>
                  <div className="settings__row" style={{ gap: 8 }}>
                    <button className="btn btn--sm" onClick={onConnect}>Reconnect</button>
                    <button className="btn btn--sm btn--ghost" onClick={cloud.disconnect}>Disconnect</button>
                  </div>
                </>
              ) : (
                <button
                  className="btn btn--sm btn--mint"
                  onClick={onConnect}
                  disabled={!cloud.consented || !clientId}
                >
                  Connect Google Drive
                </button>
              )}
            </div>

            <p className="settings__hint">
              Syncs to a private per-app folder in your own Google Drive (the
              <code> drive.appdata </code> scope — hidden from your normal files,
              and it can't see anything else in your Drive). Nothing uploads until
              you tick consent and connect, and you can disconnect at any time.
            </p>
          </div>
        )}

        {msg && <p className="settings__msg">{msg}</p>}
      </div>
    </section>
  );
}
