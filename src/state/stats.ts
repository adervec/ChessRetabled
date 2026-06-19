// Pure analytics over the game archive, cross-referenced against the full
// catalogue. Kept UI-free and time-injectable so it stays testable; the
// Dashboard page just renders what this returns.

import type { GameRecord } from "./useArchive";
import { CATALOG, CATEGORY_ORDER, type CatalogEntry, type CatalogCategory } from "../catalog.ts";

const DAY = 86400000;

export interface GameStats {
  entry: CatalogEntry;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  abandoned: number;
  /** Win rate over decisive games (versus only); null when not applicable. */
  winRate: number | null;
  lastPlayedISO: string | null;
  last7: number;
  last30: number;
}

export interface CategoryStats {
  category: CatalogCategory;
  total: number;
  tried: number;
  played: number;
  won: number;
}

export interface DashboardData {
  totalPlayed: number;
  triedCount: number;
  catalogCount: number;
  decisive: number;
  totalWins: number;
  overallWinRate: number | null;
  last7: number;
  last30: number;
  activeDays: number;
  busiestCategory: CatalogCategory | null;
  perGame: GameStats[];
  perCategory: CategoryStats[];
  notPlayed: CatalogEntry[];
  mostPlayed: GameStats | null;
  recent: GameRecord[];
  byDay: { date: string; count: number }[];
}

const dayKey = (iso: string) => iso.slice(0, 10);

function emptyStats(entry: CatalogEntry): GameStats {
  return {
    entry, played: 0, won: 0, lost: 0, drawn: 0, abandoned: 0,
    winRate: null, lastPlayedISO: null, last7: 0, last30: 0,
  };
}

export function buildDashboard(records: GameRecord[], now: number = Date.now()): DashboardData {
  const byId = new Map<string, GameStats>(CATALOG.map((e) => [e.id, emptyStats(e)]));

  // Records may reference ids no longer in the catalogue (e.g. removed games):
  // fold them into a synthetic "other" bucket so totals stay honest.
  const orphan = (r: GameRecord): GameStats => {
    let g = byId.get(r.gameId);
    if (!g) {
      g = emptyStats({ id: r.gameId, name: r.gameName, icon: "🎴", category: "board", kind: "versus", path: "/" });
      byId.set(r.gameId, g);
    }
    return g;
  };

  const activeDaySet = new Set<string>();
  for (const r of records) {
    const g = orphan(r);
    g.played++;
    if (r.outcome === "win") g.won++;
    else if (r.outcome === "loss") g.lost++;
    else if (r.outcome === "draw") g.drawn++;
    else g.abandoned++;
    if (!g.lastPlayedISO || r.endedISO > g.lastPlayedISO) g.lastPlayedISO = r.endedISO;
    const age = now - new Date(r.endedISO).getTime();
    if (age <= 7 * DAY) g.last7++;
    if (age <= 30 * DAY) g.last30++;
    activeDaySet.add(dayKey(r.endedISO));
  }

  for (const g of byId.values()) {
    const decisive = g.won + g.lost;
    g.winRate = g.entry.kind === "versus" && decisive > 0 ? g.won / decisive : null;
  }

  const perGame = [...byId.values()].sort((a, b) =>
    b.played - a.played || (b.lastPlayedISO ?? "").localeCompare(a.lastPlayedISO ?? ""),
  );

  const perCategory: CategoryStats[] = CATEGORY_ORDER.map((category) => {
    const inCat = CATALOG.filter((e) => e.category === category);
    const stats = inCat.map((e) => byId.get(e.id)!);
    return {
      category,
      total: inCat.length,
      tried: stats.filter((s) => s.played > 0).length,
      played: stats.reduce((n, s) => n + s.played, 0),
      won: stats.reduce((n, s) => n + s.won, 0),
    };
  });

  const totalPlayed = records.length;
  // Win rate is over *versus* games only — a solitaire "clear" isn't a win over
  // an opponent, so it shouldn't inflate the headline rate.
  const totalWins = perGame.reduce((n, g) => n + (g.entry.kind === "versus" ? g.won : 0), 0);
  const decisive = perGame.reduce((n, g) => n + (g.entry.kind === "versus" ? g.won + g.lost : 0), 0);
  const triedCount = CATALOG.filter((e) => (byId.get(e.id)?.played ?? 0) > 0).length;

  const notPlayed = CATALOG.filter((e) => (byId.get(e.id)?.played ?? 0) === 0);
  const mostPlayed = perGame.find((g) => g.played > 0) ?? null;
  const recent = [...records]
    .sort((a, b) => b.endedISO.localeCompare(a.endedISO))
    .slice(0, 8);

  const byDay: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * DAY);
    const key = d.toISOString().slice(0, 10);
    byDay.push({ date: key, count: records.filter((r) => dayKey(r.endedISO) === key).length });
  }

  const busiest = perCategory.filter((c) => c.played > 0).sort((a, b) => b.played - a.played)[0];

  return {
    totalPlayed,
    triedCount,
    catalogCount: CATALOG.length,
    decisive,
    totalWins,
    overallWinRate: decisive > 0 ? totalWins / decisive : null,
    last7: records.filter((r) => now - new Date(r.endedISO).getTime() <= 7 * DAY).length,
    last30: records.filter((r) => now - new Date(r.endedISO).getTime() <= 30 * DAY).length,
    activeDays: activeDaySet.size,
    busiestCategory: busiest?.category ?? null,
    perGame,
    perCategory,
    notPlayed,
    mostPlayed,
    recent,
    byDay,
  };
}

export function pct(x: number | null): string {
  return x == null ? "—" : `${Math.round(x * 100)}%`;
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
