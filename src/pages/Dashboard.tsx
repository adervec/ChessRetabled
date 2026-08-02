import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useArchive } from "../state/useArchive";
import { useProgress } from "../state/useProgress";
import { buildDashboard, pct, relativeTime, type GameStats } from "../state/stats";
import { deriveArchetype } from "../state/archetype";
import { CATEGORY_LABEL, type CatalogCategory } from "../catalog";
import { WhatNow } from "../components/ui/WhatNow";
import "./Dashboard.css";

const CAT_ICON: Record<CatalogCategory, string> = {
  chess: "♟", board: "🎲", cards: "🃏", logic: "💡",
};

function record(g: GameStats): string {
  if (g.entry.kind === "solo") return `${g.won} cleared`;
  return `${g.won}–${g.drawn}–${g.lost}`;
}

export function Dashboard() {
  const records = useArchive((a) => a.records);
  const streak = useProgress((s) => s.streak.count);
  const now = Date.now();
  const d = useMemo(() => buildDashboard(records, now), [records, now]);

  const maxDay = Math.max(1, ...d.byDay.map((b) => b.count));
  const played = d.perGame.filter((g) => g.played > 0);
  const arch = useMemo(() => deriveArchetype(d), [d]);

  return (
    <div className="page">
      <h1 className="toon-title">Dashboard</h1>
      <p className="dash__intro text-dim">
        Everything you play, at a glance — what you reach for, what you’re winning,
        and what’s still waiting in the box.
      </p>

      <WhatNow compact />

      {d.totalPlayed === 0 ? (
        <div className="dash__empty">
          <div className="dash__empty-emoji">🎲</div>
          <h2>No games logged yet</h2>
          <p className="text-muted">
            Finish a game of chess, a board game, a hand of cards, or a logic
            puzzle and it’ll show up here with your stats.
          </p>
          <div className="dash__empty-links">
            <Link className="btn btn--mint" to="/play">Play chess</Link>
            <Link className="btn" to="/games">Board games</Link>
            <Link className="btn" to="/cards">Card room</Link>
            <Link className="btn" to="/logic">Logic Lab</Link>
          </div>
        </div>
      ) : (
        <>
          <section className="dash__arch">
            <span className="dash__arch-ico" aria-hidden>{arch.icon}</span>
            <div className="dash__arch-body">
              <div className="dash__arch-label">Your player archetype</div>
              <h2 className="dash__arch-name">{arch.name}</h2>
              <p className="dash__arch-blurb text-dim">{arch.blurb}</p>
              <div className="dash__arch-traits">
                {arch.traits.map((t) => (
                  <span className="tag" key={t}>{t}</span>
                ))}
              </div>
            </div>
            <Link className="btn btn--sm btn--violet dash__arch-cta" to="/coach">
              🎓 Get coaching
            </Link>
          </section>

          <div className="profile__grid" style={{ marginTop: 16 }}>
            <div className="statcard">
              <div className="statcard__label">🎮 Games played</div>
              <div className="statcard__value" style={{ color: "var(--gold)" }}>{d.totalPlayed}</div>
              <div className="statcard__sub">{d.last7} in the last 7 days</div>
            </div>
            <div className="statcard">
              <div className="statcard__label">🗂 Variety</div>
              <div className="statcard__value" style={{ color: "var(--sky)" }}>{d.triedCount}/{d.catalogCount}</div>
              <div className="statcard__sub">{d.notPlayed.length} still untried</div>
            </div>
            <div className="statcard">
              <div className="statcard__label">🏆 Win rate</div>
              <div className="statcard__value" style={{ color: "var(--mint)" }}>{pct(d.overallWinRate)}</div>
              <div className="statcard__sub">
                {d.totalWins} wins · {d.decisive} decisive
                {d.assistedCount > 0 ? ` · ${d.assistedCount} assisted 💡` : ""}
              </div>
            </div>
            <div className="statcard">
              <div className="statcard__label">🔥 Day streak</div>
              <div className="statcard__value" style={{ color: "var(--coral)" }}>{streak}</div>
              <div className="statcard__sub">{d.activeDays} active days logged</div>
            </div>
            <div className="statcard">
              <div className="statcard__label">⭐ Favourite</div>
              <div className="statcard__value" style={{ color: "var(--violet)", fontSize: "1.5rem" }}>
                {d.mostPlayed ? `${d.mostPlayed.entry.icon} ${d.mostPlayed.entry.name}` : "—"}
              </div>
              <div className="statcard__sub">{d.mostPlayed ? `${d.mostPlayed.played} games` : "play something!"}</div>
            </div>
            <div className="statcard">
              <div className="statcard__label">📅 This month</div>
              <div className="statcard__value" style={{ color: "var(--gold)" }}>{d.last30}</div>
              <div className="statcard__sub">
                busiest: {d.busiestCategory ? CATEGORY_LABEL[d.busiestCategory] : "—"}
              </div>
            </div>
          </div>

          <section className="dash__section">
            <h2 className="dash__h2">Activity · last 14 days</h2>
            <div className="dash__spark">
              {d.byDay.map((b) => (
                <div className="dash__spark-col" key={b.date} title={`${b.date}: ${b.count}`}>
                  <div className="dash__spark-bar" style={{ height: `${(b.count / maxDay) * 100}%` }} />
                </div>
              ))}
            </div>
          </section>

          <section className="dash__section">
            <h2 className="dash__h2">By category</h2>
            <div className="dash__cats">
              {d.perCategory.map((c) => (
                <div className="dash__cat" key={c.category}>
                  <div className="dash__cat-head">
                    <span className="dash__cat-ico">{CAT_ICON[c.category]}</span>
                    <span className="dash__cat-name">{CATEGORY_LABEL[c.category]}</span>
                  </div>
                  <div className="dash__cat-bar">
                    <span style={{ width: `${(c.tried / c.total) * 100}%` }} />
                  </div>
                  <div className="dash__cat-sub text-dim">
                    {c.tried}/{c.total} tried · {c.played} played
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dash__section">
            <h2 className="dash__h2">What you play</h2>
            <div className="dash__table">
              <div className="dash__row dash__row--head">
                <span className="dash__c-game">Game</span>
                <span className="dash__c-num">Played</span>
                <span className="dash__c-num">Record</span>
                <span className="dash__c-num">Win %</span>
                <span className="dash__c-num">7d</span>
                <span className="dash__c-when">Last played</span>
              </div>
              {played.map((g) => (
                <Link className="dash__row" key={g.entry.id} to={g.entry.path}>
                  <span className="dash__c-game">
                    <span className="dash__g-ico">{g.entry.icon}</span>
                    {g.entry.name}
                    <span className="dash__g-cat">{CATEGORY_LABEL[g.entry.category]}</span>
                  </span>
                  <span className="dash__c-num">{g.played}</span>
                  <span className="dash__c-num">{record(g)}</span>
                  <span className="dash__c-num">{g.entry.kind === "versus" ? pct(g.winRate) : "—"}</span>
                  <span className="dash__c-num">{g.last7 || "·"}</span>
                  <span className="dash__c-when">{g.lastPlayedISO ? relativeTime(g.lastPlayedISO, now) : "—"}</span>
                </Link>
              ))}
            </div>
          </section>

          {d.notPlayed.length > 0 && (
            <section className="dash__section">
              <h2 className="dash__h2">Yet to try <span className="dash__count">{d.notPlayed.length}</span></h2>
              <div className="dash__chips">
                {d.notPlayed.map((e) => (
                  <Link className="dash__chip" key={e.id} to={e.path} title={`${CATEGORY_LABEL[e.category]} · play now`}>
                    <span className="dash__chip-ico">{e.icon}</span>
                    {e.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {d.recent.length > 0 && (
            <section className="dash__section">
              <h2 className="dash__h2">Recent games</h2>
              <ul className="dash__recent">
                {d.recent.map((r) => (
                  <li key={r.id} className="dash__recent-row">
                    <span className={"dash__pill dash__pill--" + r.outcome}>{r.outcome}</span>
                    <span className="dash__recent-name">
                      {r.gameName}
                      {r.assisted && (
                        <span className="dash__assist" title="Hints were used in this game">💡</span>
                      )}
                    </span>
                    <span className="text-dim dash__recent-reason">{r.reason ?? `vs ${r.opponent}`}</span>
                    <span className="text-muted dash__recent-when">{relativeTime(r.endedISO, now)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
