import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Logo } from "../brand/Logo";
import { useProgress, useLevel } from "../../state/useProgress";
import "./NavBar.css";

const LINKS = [
  { to: "/play", label: "Play", ico: "♟" },
  { to: "/games", label: "Games", ico: "🎲" },
  { to: "/simul", label: "Simul", ico: "♞" },
  { to: "/puzzles", label: "Puzzles", ico: "🧩" },
  { to: "/learn", label: "Learn", ico: "🎓" },
  { to: "/academy", label: "Academy", ico: "📚" },
  { to: "/practice", label: "Practice", ico: "🎯" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const rating = useProgress((s) => s.puzzle.rating);
  const streak = useProgress((s) => s.streak.count);
  const { level } = useLevel();

  return (
    <nav className="nav">
      <NavLink to="/" className="nav__brand" onClick={() => setOpen(false)}>
        <Logo size={40} />
      </NavLink>

      <div className={"nav__links" + (open ? " is-open" : "")}>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              "nav__link" + (isActive ? " is-active" : "")
            }
            onClick={() => setOpen(false)}
          >
            <span className="ico" aria-hidden>
              {l.ico}
            </span>
            <span className="label">{l.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="nav__stats">
        <NavLink to="/profile" className="nav__stat" title="Puzzle rating">
          <span className="ico" aria-hidden>
            ⚡
          </span>
          {rating}
        </NavLink>
        <div className="nav__stat" title="Day streak">
          <span className="ico" aria-hidden>
            🔥
          </span>
          {streak}
          <span className="label" style={{ color: "var(--text-muted)" }}>
            day
          </span>
        </div>
        <NavLink
          to="/profile"
          className="nav__stat"
          title="Level"
          style={{ background: "var(--violet)", color: "#fff" }}
        >
          <span className="ico" aria-hidden>
            ★
          </span>
          Lv {level}
        </NavLink>
        <button
          className="btn btn--icon btn--ghost nav__burger"
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
    </nav>
  );
}
