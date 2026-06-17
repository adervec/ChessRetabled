import { useSettings, THEMES, ANIM_SPEEDS } from "../../state/useSettings";
import "./SettingsPanel.css";

export function SettingsPanel() {
  const { theme, animSpeed, boardTilt, setTheme, setAnimSpeed, setBoardTilt } =
    useSettings();

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
    </section>
  );
}
