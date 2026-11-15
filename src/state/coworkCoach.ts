// The coach cowork channel's logic, kept out of the .tsx so the harness can
// drive it (scripts/validate-cowork.mjs).
//
// cowork.js v2 reviews a reply before applying it: the panel asks `preview` for
// rows to tick, hands the ticked ids to `apply`, and keeps whatever `apply`
// returns as `undo` so the run history can reverse it. Everything here is pure
// except through the `AdviceIO` seam, which is where localStorage and React live.

/** Where the shown advice is kept. The app supplies this; the logic stays pure. */
export interface AdviceIO {
  get(): string;
  set(text: string): void;
}

export interface PreviewRow {
  id: string;
  label: string;
  detail: string;
}

/** The one row id a coach reply can offer. */
export const ADVICE_ROW = "reply";

/** How much of the advice the review panel shows before the user accepts it. */
export const DETAIL_CHARS = 400;

/**
 * The advice text out of whatever an agent wrote.
 *
 * Three shapes are accepted because three are plausible from a human-edited
 * reply.json: a bare string, `{ reply }` (what INSTRUCTIONS.md asks for), and
 * `{ payload: { reply } }`. Anything else is shown as formatted JSON rather than
 * silently dropped — the reader can then see what the agent actually sent.
 */
export function replyText(reply: unknown): string {
  if (typeof reply === "string") return reply;
  const r = reply as { reply?: unknown; payload?: { reply?: unknown } } | null;
  if (typeof r?.reply === "string") return r.reply;
  if (typeof r?.payload?.reply === "string") return r.payload.reply;
  return JSON.stringify(reply, null, 2) ?? "";
}

/**
 * One row, because a coach reply is one piece of advice. A reply that changed
 * stored data (review notes on games, say) would return a row per change.
 */
export function previewRows(reply: unknown): PreviewRow[] {
  const text = replyText(reply);
  return [
    {
      id: ADVICE_ROW,
      label: "Show this advice on the Coach page (replaces the current one)",
      detail: text.length > DETAIL_CHARS ? text.slice(0, DETAIL_CHARS) + "…" : text,
    },
  ];
}

export interface ApplyResult {
  summary: string;
  /** JSON only — cowork.js stores it in the run history to offer an undo. */
  undo?: { prev: string };
}

/**
 * Apply a reviewed reply.
 *
 * `accepted` is null/undefined when the panel had no rows to tick (the v1 path,
 * or an older cowork.js), which means "all of it". An explicit list that leaves
 * the row out means the reader declined, so nothing is written and no undo is
 * offered — there is nothing to reverse.
 */
export function applyAdvice(
  reply: unknown,
  accepted: string[] | null | undefined,
  io: AdviceIO
): ApplyResult {
  if (accepted && !accepted.includes(ADVICE_ROW)) {
    return { summary: "nothing applied — the advice was not accepted" };
  }
  const prev = io.get();
  const text = replyText(reply);
  io.set(text);
  return { summary: `new coaching advice shown (${text.length} characters)`, undo: { prev } };
}

/** Reverse one apply. An empty `prev` is the correct restore for a first reply. */
export function undoAdvice(data: { prev?: string } | null | undefined, io: AdviceIO): void {
  io.set(data?.prev ?? "");
}
