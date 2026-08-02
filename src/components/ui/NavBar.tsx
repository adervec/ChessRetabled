import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Logo } from "../brand/Logo";
import { useProgress, useLevel } from "../../state/useProgress";
import "./NavBar.css";

const LINKS = [
  { to: "/play", label: "Play", ico: "♟" },
  { to: "/games", label: "Games", ico: "🎲" },
  { to: "/cards", label: "Cards", ico: "🃏" },
  { to: "/logic", label: "Logic", ico: "💡" },
  { to: "/simul", label: "Simul", ico: "♞" },
  { to: "/puzzles", label: "Puzzles", ico: "🧩" },
  { to: "/learn", label: "Learn", ico: "🎓" },
  { to: "/academy", label: "Academy", ico: "📚" },
  { to: "/practice", label: "Practice", ico: "🎯" },
  { to: "/dashboard", label: "Dashboard", ico: "📊" },
  { to: "/coach", label: "Coach", ico: "🧑‍🏫" },
  { to: "/guide", label: "Guides", ico: "📖" },
];

// Only these stay in the bar itself; all 12 live in the ☰ menu. Twelve labelled
// pills need ~1750px of bar — they used to overflow and shove the menu button
// off-screen on any normal display.
const PRIMARY = LINKS.slice(0, 4);

export function NavBar() {
  const [open, setOpen] = useState(false);
  const rating = useProgress((s) => s.puzzle.rating);
  const streak = useProgress((s) => s.streak.count);
  const { level } = useLevel();
  const loc = useLocation();

  useEffect(() => setOpen(false), [loc.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className="nav">
      <NavLink to="/" className="nav__brand">
        <Logo size={40} />
      </NavLink>

      <div className="nav__links">
        {PRIMARY.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => "nav__link" + (isActive ? " is-active" : "")}
          >
            <span className="ico" aria-hidden>{l.ico}</span>
            <span className="label">{l.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="nav__stats">
        <NavLink to="/profile" className="nav__stat" title="Puzzle rating">
          <span className="ico" aria-hidden>⚡</span>
          {rating}
        </NavLink>
        <div className="nav__stat" title="Day streak">
          <span className="ico" aria-hidden>🔥</span>
          {streak}
          <span className="label" style={{ color: "var(--text-muted)" }}>day</span>
        </div>
        <NavLink
          to="/profile"
          className="nav__stat"
          title="Level"
          style={{ background: "var(--violet)", color: "#fff" }}
        >
          <span className="ico" aria-hidden>★</span>
          Lv {level}
        </NavLink>
        <button
          className="btn btn--sm nav__burger"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden>{open ? "✕" : "☰"}</span>
          <span className="label">Menu</span>
        </button>
      </div>

      {open && (
        <button className="nav__scrim" aria-label="Close menu" onClick={() => setOpen(false)} />
      )}

      <div id="nav-menu" className={"nav__menu" + (open ? " is-open" : "")} hidden={!open}>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => "nav__menuitem" + (isActive ? " is-active" : "")}
          >
            <span className="ico" aria-hidden>{l.ico}</span>
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
