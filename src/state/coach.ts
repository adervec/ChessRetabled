// The coaching brief: a self-contained markdown report of everything the app
// knows about the player, written to be handed to an AI coach (Claude, Cowork,
// or any assistant) — or sent directly from the Coach page's built-in chat.
// Pure + time-injectable, like stats.ts; smoke-checked by validate-stats.mjs.

import type { DashboardData } from "./stats.ts";
import type { Archetype } from "./archetype.ts";
import { CATEGORY_LABEL } from "../catalog.ts";

/** Snapshot of the chess-progress store the page passes in (kept UI-free). */
export interface CoachProgress {
  level: number;
  xp: number;
  puzzleRating: number;
  puzzlesSolved: number;
  dayStreak: number;
  botRecord: { won: number; drawn: number; lost: number };
}

const pctStr = (x: number | null) => (x == null ? "n/a" : `${Math.round(x * 100)}%`);

export function buildCoachBrief(
  d: DashboardData,
  arch: Archetype,
  prog: CoachProgress,
  nowISO: string
): string {
  const lines: string[] = [];
  const push = (s: string) => lines.push(s);

  push(`# ChessRetabled coaching brief`);
  push(`Generated ${nowISO.slice(0, 10)}. Local data only — no account involved.`);
  push(``);
  push(`## Player`);
  push(`- Archetype: **${arch.name}** ${arch.icon} — ${arch.blurb}`);
  if (arch.traits.length) push(`- Traits: ${arch.traits.join(" · ")}`);
  push(`- App level ${prog.level} (${prog.xp} XP) · chess puzzle rating ${prog.puzzleRating} (${prog.puzzlesSolved} solved) · day streak ${prog.dayStreak}`);
  push(`- Chess bot record (W–D–L): ${prog.botRecord.won}–${prog.botRecord.drawn}–${prog.botRecord.lost}`);
  push(``);
  push(`## Headline stats`);
  push(`- Games logged: ${d.totalPlayed} (${d.last7} in the last 7 days, ${d.last30} in the last 30, ${d.activeDays} active days)`);
  push(`- Win rate over decisive versus games: ${pctStr(d.overallWinRate)} (${d.totalWins} wins / ${d.decisive} decisive)`);
  push(`- Variety: ${d.triedCount} of ${d.catalogCount} games tried`);
  push(`- Hint-assisted games: ${d.assistedCount} (any game where a "show hint" was used is flagged as assisted)`);
  push(``);
  push(`## By category`);
  for (const c of d.perCategory) {
    push(`- ${CATEGORY_LABEL[c.category]}: ${c.tried}/${c.total} tried · ${c.played} played · ${c.won} won`);
  }
  push(``);

  const played = d.perGame.filter((g) => g.played > 0).slice(0, 10);
  if (played.length) {
    push(`## Most played`);
    push(`| Game | Played | W–D–L | Win % | Assisted |`);
    push(`|---|---|---|---|---|`);
    for (const g of played) {
      push(`| ${g.entry.name} | ${g.played} | ${g.won}–${g.drawn}–${g.lost} | ${pctStr(g.winRate)} | ${g.assisted} |`);
    }
    push(``);
  }

  push(`## Activity, last 14 days`);
  push(d.byDay.map((b) => `${b.date.slice(5)}:${b.count}`).join(" · "));
  push(``);

  if (d.recent.length) {
    push(`## Recent games`);
    for (const r of d.recent) {
      push(`- ${r.endedISO.slice(0, 10)} · ${r.outcome} · ${r.gameName} vs ${r.opponent}${r.reason ? ` (${r.reason})` : ""}${r.assisted ? " · hint-assisted" : ""}`);
    }
    push(``);
  }

  if (d.notPlayed.length) {
    push(`## Not yet tried`);
    push(d.notPlayed.map((e) => e.name).join(", "));
    push(``);
  }

  push(`## What I want from you, coach`);
  push(`1. Read the stats above and give me an honest read on my strengths and weaknesses as a player.`);
  push(`2. Point out patterns I might not see (over-reliance on hints, difficulty plateaus, categories I avoid).`);
  push(`3. Give me a concrete two-week training plan using this app's modes: chess bots (rated 250–2850), tactics puzzles, lessons, endgame drills, and the board games, card games, and logic puzzles catalogued above — name specific games and difficulty settings.`);
  push(`4. If I've shared an earlier brief with you before, compare them and tell me where I've actually progressed.`);

  return lines.join("\n");
}
