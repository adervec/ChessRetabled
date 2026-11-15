// A calendar day is the user's **local** day. Everything that buckets by day —
// streaks, the daily challenge, the 14-day sparkline, "played today" — has to
// agree on that, or a player at UTC-3 watches the day roll over at 21:00 and
// loses a streak they were about to extend.
//
// The two traps, both of which read as UTC and both of which this module exists
// to replace:
//   new Date().toISOString().slice(0, 10)   // the UTC day, not today
//   new Date("2026-11-10")                  // UTC midnight = the 9th, west of UTC
//
// Instants stay stored as UTC (`endedISO` is `new Date().toISOString()`, which is
// correct — an instant is not a day). Only the day *derived* from an instant is
// local, which is why the fix lives here and not at the ~60 recording sites.

/**
 * The local calendar day of an instant, as `YYYY-MM-DD`.
 *
 * Accepts a Date, an epoch ms, or an ISO instant string. A string that is
 * already a day key is returned unchanged rather than round-tripped through
 * `new Date()`, which would read it as UTC midnight and move it a day west.
 */
export function dayKey(when: Date | number | string = Date.now()): string {
  if (typeof when === "string" && /^\d{4}-\d{2}-\d{2}$/.test(when)) return when;
  const d = when instanceof Date ? when : new Date(when);
  // A corrupt or hand-edited record must not take the dashboard down with it.
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * A stored day key read back as that day's **local** midnight.
 * `new Date(key)` on its own would be UTC midnight — a different day west of UTC.
 */
export function dayStart(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

/** Whole days from day key `a` to day key `b` (negative if `b` is earlier). */
export function dayDiff(a: string, b: string): number {
  return Math.round((dayStart(b).getTime() - dayStart(a).getTime()) / 86_400_000);
}
