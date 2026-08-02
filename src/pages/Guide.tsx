import { useMemo, useState, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Markdown } from "../components/ui/Markdown";
import { loadGuide, guideLibrary, GUIDE_ENTRIES, hasGuide, type GameGuide } from "../content/guides";
import { CATALOG_BY_ID } from "../catalog";
import "./Guide.css";

// The guide library at /guide, and a single deep-linkable, standalone-readable
// guide at /guide/:id. Both read from src/content/guides — one markdown file
// per game, so every guide is also a plain file you can read on its own.

export function Guide() {
  const groups = useMemo(() => guideLibrary(), []);
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();

  return (
    <div className="page guide-lib">
      <header className="guide-lib__head">
        <h1 className="toon-title">Game Guides</h1>
        <p className="guide-lib__sub text-dim">
          A deep, standalone guide to every game in the club — rules, how it works
          here, and strategy from first move to endgame. {GUIDE_ENTRIES.length} guides.
        </p>
        <input
          className="guide-lib__search"
          placeholder="Search guides…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </header>

      {groups.map((g) => {
        const entries = needle
          ? g.entries.filter((e) => e.name.toLowerCase().includes(needle))
          : g.entries;
        if (entries.length === 0) return null;
        return (
          <section key={g.category} className="guide-lib__section">
            <h2 className="guide-lib__cat">{g.label}</h2>
            <div className="guide-lib__grid">
              {entries.map((e) => (
                <Link key={e.id} to={`/guide/${e.id}`} className="guide-card">
                  <span className="guide-card__icon">{e.icon}</span>
                  <span className="guide-card__name">{e.name}</span>
                  <span className="guide-card__go">Read guide →</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function GuideEntry() {
  const { id = "" } = useParams();
  const known = hasGuide(id);
  const [guide, setGuide] = useState<GameGuide | null>(null);

  // Load the guide's markdown chunk on demand; scroll to top on switch.
  useEffect(() => {
    if (!known) return;
    let alive = true;
    setGuide(null);
    window.scrollTo({ top: 0 });
    void loadGuide(id).then((g) => {
      if (alive) setGuide(g ?? null);
    });
    return () => {
      alive = false;
    };
  }, [id, known]);

  if (!known) return <Navigate to="/guide" replace />;

  const entry = CATALOG_BY_ID[id];
  const idx = GUIDE_ENTRIES.findIndex((e) => e.id === id);
  const prev = idx > 0 ? GUIDE_ENTRIES[idx - 1] : undefined;
  const next = idx >= 0 && idx < GUIDE_ENTRIES.length - 1 ? GUIDE_ENTRIES[idx + 1] : undefined;

  return (
    <div className="page guide-read">
      <div className="guide-read__bar">
        <Link to="/guide" className="btn btn--sm btn--ghost">← All guides</Link>
        {entry && <Link to={entry.path} className="btn btn--sm btn--mint">▶ Play {entry.name}</Link>}
      </div>

      <article className="guide-read__body">
        {guide ? <Markdown source={guide.markdown} /> : <p className="text-dim">Loading guide…</p>}
      </article>

      <nav className="guide-read__nav">
        {prev ? (
          <Link to={`/guide/${prev.id}`} className="guide-read__nb">
            <span className="guide-read__nbdir">← Previous</span>
            <span className="guide-read__nbname">{prev.icon} {prev.name}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/guide/${next.id}`} className="guide-read__nb guide-read__nb--next">
            <span className="guide-read__nbdir">Next →</span>
            <span className="guide-read__nbname">{next.icon} {next.name}</span>
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}
