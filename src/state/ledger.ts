// One row per finished session, for the maker hub's habits and character sheet
// (house standard 25). font.js owns the storage, the de-duplication by id, the
// 2000-row cap and the per-device Drive file; this is only the call.
//
// It used to be a hand-written `portal-activity` row inside `addXp`, which fired
// on every XP gain — several times a game. A session is the unit, not an event.
import { LOGIC_PUZZLES } from "../logic/registry.ts";

/** The house's closed set; only the ones this app can honestly claim. */
type SessionKind = "chess" | "focus" | "study";

interface HouseLedger {
  logSession?: (s: { kind: string; minutes?: number; amount?: number; id?: string; at?: number }) => boolean;
}

const LOGIC_IDS = new Set(LOGIC_PUZZLES.map((p) => p.id));

/**
 * Which house kind a finished game counts as. A Logic Lab puzzle is solo
 * deduction, so it is `focus`; everything else here is somebody playing a game
 * against an opponent, which is what `chess` means to the hub.
 */
export function kindForGame(gameId: string): SessionKind {
  return LOGIC_IDS.has(gameId) ? "focus" : "chess";
}

/** Minutes between two ISO instants, floored at 1 and capped at a long sitting. */
export function sessionMinutes(startedISO: string, endedISO: string): number {
  const ms = Date.parse(endedISO) - Date.parse(startedISO);
  if (!Number.isFinite(ms) || ms <= 0) return 1;
  return Math.min(600, Math.max(1, Math.round(ms / 60_000)));
}

/**
 * Tell the hub a session finished. Silent when font.js has not loaded (tests,
 * the Node harness) — the session itself is already safe in our own store.
 */
export function logSession(kind: SessionKind, id: string, minutes?: number): void {
  const house = (globalThis as { appFont?: HouseLedger }).appFont;
  if (typeof house?.logSession !== "function") return;
  house.logSession({ kind, id, minutes });
}
