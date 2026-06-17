import { useRef, useState } from "react";
import { useSettings, THEMES, ANIM_SPEEDS } from "../../state/useSettings";
import { downloadExport, importJson } from "../../state/dataTransfer";
import { syncNow } from "../../state/sync";
import "./SettingsPanel.css";

export function SettingsPanel() {
  const { theme, animSpeed, boardTilt, setTheme, setAnimSpeed, setBoardTilt } =
    useSettings();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
          Export bundles your progress, settings, and full game history. Cloud sync
          is wired through a local mirror for now — a real backend drops into the
          same seam.
        </p>
        {msg && <p className="settings__msg">{msg}</p>}
      </div>
    </section>
  );
}
