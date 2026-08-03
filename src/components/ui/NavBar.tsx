import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Logo } from "../brand/Logo";
import { useProgress, useLevel } from "../../state/useProgress";
import { useSettings } from "../../state/useSettings";
import { useActiveGameStore } from "../../state/activeGame";
import { resolveLayout } from "../../state/orientation";
import type { CatalogCategory } from "../../catalog";
import "./NavBar.css";

// The mark takes the icon of whatever wing you're in, so the brand reads
// "🃏Retabled" in the card room. Neutral ▦ everywhere else — the app is not a
// chess app with extras bolted on.
const CATEGORY_ICON: Record<CatalogCategory, string> = {
  chess: "♟", board: "🎲", cards: "🃏", logic: "💡",
};
const NEUTRAL_ICON = "▦";

function brandIcon(pathname: string): string {
  if (/^\/(games|academy)/.test(pathname)) return CATEGORY_ICON.board;
  if (/^\/cards/.test(pathname)) return CATEGORY_ICON.cards;
  if (/^\/logic/.test(pathname)) return CATEGORY_ICON.logic;
  if (/^\/(play|puzzles|learn|practice|simul)/.test(pathname)) return CATEGORY_ICON.chess;
  return NEUTRAL_ICON;
}

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

/**
 * Per-game layout pin. Only shows while a game is open, and writes the choice
 * against that game's id — so Klondike can stay portrait while chess is
 * landscape, and neither changes because the phone was turned.
 */
function LayoutToggle() {
  const gameId = useActiveGameStore((s) => s.id);
  const perGame = useSettings((s) => s.gameOrientation);
  const global = useSettings((s) => s.orientation);
  const setGameOrientation = useSettings((s) => s.setGameOrientation);
  if (!gameId) return null;

  const now = resolveLayout({ gameId, perGame, global, deviceIsLandscape: false });
  const next = now === "landscape" ? "portrait" : "landscape";
  return (
    <button
      className="btn btn--sm nav__layout"
      title={`Layout for this game: ${now}. Tap to use ${next}.`}
      aria-label={`Layout for this game: ${now}. Switch to ${next}.`}
      onClick={() => setGameOrientation(gameId, next)}
    >
      <span aria-hidden>{now === "landscape" ? "🖥" : "📱"}</span>
    </button>
  );
}

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
        <Logo size={40} icon={brandIcon(loc.pathname)} />
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
        <LayoutToggle />
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
