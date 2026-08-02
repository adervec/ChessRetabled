// Player archetype — a personality read on *how* someone plays, derived purely
// from the dashboard aggregates (same idea as Tachyread's reader archetype).
// Pure + total: every archive maps to exactly one archetype, so the UI can
// always render it and the harness (scripts/validate-stats.mjs) can prove it
// never throws. First matching rule wins; the order below is the tuning knob.

import type { DashboardData } from "./stats.ts";
import { CATEGORY_LABEL } from "../catalog.ts";

export interface Archetype {
  id: string;
  name: string;
  icon: string;
  /** One-sentence personality read, shown under the name. */
  blurb: string;
  /** Short evidence chips ("31 games", "72% win rate", …). */
  traits: string[];
}

export function deriveArchetype(d: DashboardData): Archetype {
  const traits: string[] = [];
  if (d.totalPlayed > 0) traits.push(`${d.totalPlayed} games`);
  if (d.triedCount > 0) traits.push(`${d.triedCount}/${d.catalogCount} games tried`);
  if (d.overallWinRate != null) traits.push(`${Math.round(d.overallWinRate * 100)}% win rate`);
  if (d.busiestCategory) traits.push(`favours ${CATEGORY_LABEL[d.busiestCategory]}`);
  if (d.assistedCount > 0) traits.push(`${d.assistedCount} hint-assisted`);

  const t = (a: Omit<Archetype, "traits">): Archetype => ({ ...a, traits });

  if (d.totalPlayed === 0) {
    return t({
      id: "unwritten",
      name: "The Unwritten",
      icon: "📖",
      blurb: "A blank scoresheet. Every archetype starts here — play anything and your story begins.",
    });
  }

  const concentration = d.mostPlayed ? d.mostPlayed.played / d.totalPlayed : 0;
  const variety = d.triedCount / Math.max(1, d.catalogCount);
  const assistRate = d.assistedCount / d.totalPlayed;

  if (d.totalPlayed >= 15 && concentration >= 0.6 && d.mostPlayed) {
    return t({
      id: "specialist",
      name: "The Specialist",
      icon: "🎯",
      blurb: `One game, mastered deep: ${d.mostPlayed.entry.name} is ${Math.round(concentration * 100)}% of everything you play.`,
    });
  }

  if (variety >= 0.6 || d.triedCount >= 20) {
    return t({
      id: "explorer",
      name: "The Explorer",
      icon: "🧭",
      blurb: "You've opened more doors of the club than almost anyone — breadth first, mastery on the way.",
    });
  }

  if (assistRate >= 0.3 && d.totalPlayed >= 5) {
    return t({
      id: "apprentice",
      name: "The Apprentice",
      icon: "🧑‍🎓",
      blurb: "You lean on hints and learn from them — every assisted game is a lesson taken, not a shortcut.",
    });
  }

  if (d.decisive >= 10 && d.overallWinRate != null && d.overallWinRate >= 0.65) {
    return t({
      id: "conqueror",
      name: "The Conqueror",
      icon: "🏆",
      blurb: "You win far more than you lose. Time to raise the difficulty and find a real fight.",
    });
  }

  if (d.decisive >= 10 && d.overallWinRate != null && d.overallWinRate <= 0.35) {
    return t({
      id: "challenger",
      name: "The Challenger",
      icon: "🥊",
      blurb: "You pick fights above your weight and keep coming back — the fastest way to get stronger.",
    });
  }

  if (d.last7 >= 15) {
    return t({
      id: "marathoner",
      name: "The Marathoner",
      icon: "🔥",
      blurb: "Heavy volume this week — you don't visit the club, you live in it.",
    });
  }

  if (d.busiestCategory === "logic") {
    return t({
      id: "puzzler",
      name: "The Puzzler",
      icon: "💡",
      blurb: "You'd rather out-think a grid than an opponent — deduction is your home turf.",
    });
  }
  if (d.busiestCategory === "cards") {
    return t({
      id: "cardsharp",
      name: "The Card Sharp",
      icon: "🃏",
      blurb: "Hidden information and reading the odds — the card room is where you do your thinking.",
    });
  }
  if (d.busiestCategory === "board") {
    return t({
      id: "strategist",
      name: "The Strategist",
      icon: "🎲",
      blurb: "Perfect information, long plans — the board games cabinet is your arena of choice.",
    });
  }
  if (d.busiestCategory === "chess") {
    return t({
      id: "classicist",
      name: "The Classicist",
      icon: "♟",
      blurb: "When in doubt, chess. The oldest game in the club is still the one you reach for.",
    });
  }

  return t({
    id: "dabbler",
    name: "The Dabbler",
    icon: "🌱",
    blurb: "A few games here and there — the club is yours to grow into.",
  });
}

/** Every id deriveArchetype can return — the harness checks membership. */
export const ARCHETYPE_IDS = [
  "unwritten", "specialist", "explorer", "apprentice", "conqueror",
  "challenger", "marathoner", "puzzler", "cardsharp", "strategist",
  "classicist", "dabbler",
] as const;
