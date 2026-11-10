// The daily challenge: one puzzle a day, the same one for everybody, decided by
// the date alone.
//
// This works offline and needs no server because every Logic Lab generator is
// already pure and seeded — `generate(seed, …)`, no Math.random anywhere. Hash
// the date into that seed and the puzzle is fixed for the day without anything
// being fetched or stored centrally.
//
// Pure and total on purpose: the whole module is driven headlessly by
// scripts/validate-daily.mjs.

import { makeRng, shuffle } from "../cards/core/rng.ts";
import { LOGIC_PUZZLES } from "./registry.ts";

/** Day 1 of the daily. Fixed forever — moving it would renumber every puzzle. */
export const DAILY_EPOCH = "2026-01-01";

const MS_PER_DAY = 86_400_000;

/** All puzzle ids, in registry order. */
export function dailyPool(): string[] {
  return LOGIC_PUZZLES.map((p) => p.id);
}

/**
 * The day key for a moment, in the *viewer's own* timezone, so the puzzle turns
 * over at their midnight rather than UTC's.
 */
export function dailyKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * A key as a day number. Keys are read as UTC midnight purely for arithmetic —
 * a calendar day is a fixed 24h apart that way, so stepping across a DST change
 * can't land on the wrong date.
 */
function keyToDays(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return 0;
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** The key `deltaDays` away from `key`. Handles month, year and leap bounds. */
export function shiftKey(key: string, deltaDays: number): string {
  const d = new Date((keyToDays(key) + deltaDays) * MS_PER_DAY);
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

/** Days since the epoch. Negative before it. */
export function dayIndex(key: string): number {
  return keyToDays(key) - keyToDays(DAILY_EPOCH);
}

/** The number shown to the player — #1 on the epoch. */
export function dailyNumber(key: string): number {
  return dayIndex(key) + 1;
}

/** FNV-1a over the key: a date in, a stable 32-bit seed out. */
export function dailySeed(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) || 1;
}

/**
 * Which puzzle today is.
 *
 * Not a plain hash — that would repeat puzzles within a week and skip others
 * for months. Each run of 25 days is its own shuffled permutation of the pool,
 * so every puzzle comes up exactly once before any of them comes up twice.
 */
export function dailyPuzzleId(key: string, pool: string[] = dailyPool()): string {
  const n = pool.length;
  if (n === 0) return "";
  const i = dayIndex(key);
  const block = Math.floor(i / n);
  const pos = ((i % n) + n) % n;
  return shuffle(pool, makeRng((block >>> 0) + 1))[pos];
}

export interface DailyResult {
  puzzleId: string;
  solvedISO: string;
  /** A hint was used — the day still counts, it's just marked. */
  assisted?: boolean;
}

/**
 * Consecutive days solved, ending today.
 *
 * Today being unsolved does not break the run until the day is actually over,
 * so an unsolved today counts back from yesterday instead of returning 0.
 */
export function streak(results: Record<string, DailyResult>, todayKey: string): number {
  let cursor = results[todayKey] ? todayKey : shiftKey(todayKey, -1);
  let n = 0;
  while (results[cursor]) {
    n++;
    cursor = shiftKey(cursor, -1);
  }
  return n;
}

/** Every day solved, ever. */
export function totalSolved(results: Record<string, DailyResult>): number {
  return Object.keys(results).length;
}

/** The last `days` keys, oldest first, ending on `todayKey`. */
export function recentKeys(todayKey: string, days = 7): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(shiftKey(todayKey, -i));
  return out;
}

/**
 * The shareable result — deliberately **spoiler-free**: it reports which days
 * were solved, never anything about the grid, so posting it can't ruin the
 * puzzle for whoever reads it.
 */
export function shareText(
  results: Record<string, DailyResult>,
  todayKey: string,
  pool: string[] = dailyPool(),
): string {
  const id = dailyPuzzleId(todayKey, pool);
  const meta = LOGIC_PUZZLES.find((p) => p.id === id);
  const squares = recentKeys(todayKey)
    .map((k) => {
      const r = results[k];
      if (!r) return "\u2b1c";
      return r.assisted ? "\ud83d\udfe8" : "\ud83d\udfe9";
    })
    .join("");
  const run = streak(results, todayKey);
  const head = `\u25a6Retabled Daily #${dailyNumber(todayKey)} \u00b7 ${meta?.icon ?? "\ud83d\udca1"} ${meta?.name ?? id}`;
  const tail = run > 0 ? `${squares}  \ud83d\udd25 ${run}` : squares;
  return `${head}\n${tail}`;
}
