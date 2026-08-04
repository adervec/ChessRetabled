import { useCallback, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Board } from "../components/board/Board";
import { GameBoard } from "../games/ui/GameBoard";
import { useArchive, type GameRecord } from "../state/useArchive";
import { useActiveGame } from "../state/activeGame";
import { relativeTime } from "../state/stats";
import { CATEGORY_LABEL, CATEGORY_ORDER, catalogEntry, type CatalogCategory } from "../catalog";
import { getGame } from "../games/registry";
import { fenToPlaced, START_FEN } from "../chess/types";
import type { BoardView, Token } from "../games/ui/boardView";
import type { GameMove } from "../games/core/types";
import { FAMOUS, type FamousGame } from "../content/famous";
import { reviewRecord, isReviewable, LABEL_META, tally, type GameReview } from "../review";
import { buildGameBrief, downloadBrief } from "../state/cowork";
import "./Review.css";

// The one place games are reviewed. Everything that can be replayed is replayed
// here — archived games, and the seeded library — rather than each mode growing
// its own history screen.

type Tab = "yours" | "library";

export function Review() {
  const records = useArchive((a) => a.records);
  const [tab, setTab] = useState<Tab>("yours");
  const [openId, setOpenId] = useState<string | null>(null);
  const [openFamous, setOpenFamous] = useState<string | null>(null);

  const open = openId ? records.find((r) => r.id === openId) ?? null : null;
  const famous = openFamous ? FAMOUS.find((f) => f.id === openFamous) ?? null : null;

  if (open) return <RecordReview record={open} onBack={() => setOpenId(null)} />;
  if (famous) return <FamousReview entry={famous} onBack={() => setOpenFamous(null)} />;

  return (
    <div className="page">
      <h1 className="toon-title">Review</h1>
      <p className="text-dim review__intro">
        Every finished game, replayed and marked move by move — and a library of
        games worth stealing ideas from.
      </p>

      <div className="review__tabs">
        <button className={"chip-btn" + (tab === "yours" ? " is-on" : "")} onClick={() => setTab("yours")}>
          🗂 Your games <span className="review__count">{records.length}</span>
        </button>
        <button className={"chip-btn" + (tab === "library" ? " is-on" : "")} onClick={() => setTab("library")}>
          🏛 Library <span className="review__count">{FAMOUS.length}</span>
        </button>
      </div>

      {tab === "yours" ? (
        <YourGames records={records} onOpen={setOpenId} />
      ) : (
        <Library onOpen={setOpenFamous} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ list --- */

function YourGames({ records, onOpen }: { records: GameRecord[]; onOpen: (id: string) => void }) {
  const remove = useArchive((a) => a.remove);
  const removeWhere = useArchive((a) => a.removeWhere);
  const clear = useArchive((a) => a.clear);
  const [cat, setCat] = useState<CatalogCategory | "all">("all");
  const [gameId, setGameId] = useState<string | "all">("all");
  const [confirm, setConfirm] = useState<{ label: string; run: () => void } | null>(null);

  const shown = useMemo(
    () =>
      records.filter((r) => {
        const e = catalogEntry(r.gameId);
        if (cat !== "all" && e?.category !== cat) return false;
        if (gameId !== "all" && r.gameId !== gameId) return false;
        return true;
      }),
    [records, cat, gameId]
  );

  const gamesInScope = useMemo(() => {
    const ids = new Map<string, string>();
    for (const r of records) {
      const e = catalogEntry(r.gameId);
      if (cat !== "all" && e?.category !== cat) continue;
      ids.set(r.gameId, r.gameName);
    }
    return [...ids].sort((a, b) => a[1].localeCompare(b[1]));
  }, [records, cat]);

  if (records.length === 0) {
    return (
      <div className="review__empty">
        <div className="review__empty-emoji">🗂</div>
        <h2>Nothing to review yet</h2>
        <p className="text-muted">
          Finish a game anywhere in the app and it turns up here, ready to be
          taken apart move by move.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="review__filters">
        <select
          className="review__select"
          value={cat}
          aria-label="Filter by category"
          onChange={(e) => {
            setCat(e.target.value as CatalogCategory | "all");
            setGameId("all");
          }}
        >
          <option value="all">All categories</option>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
          ))}
        </select>
        <select
          className="review__select"
          value={gameId}
          aria-label="Filter by game"
          onChange={(e) => setGameId(e.target.value)}
        >
          <option value="all">All games</option>
          {gamesInScope.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        <div className="review__bulk">
          {gameId !== "all" && (
            <button
              className="btn btn--sm btn--danger"
              onClick={() =>
                setConfirm({
                  label: `Delete all ${shown.length} ${gamesInScope.find((g) => g[0] === gameId)?.[1] ?? ""} games?`,
                  run: () => removeWhere((r) => r.gameId === gameId),
                })
              }
            >
              🗑 This game
            </button>
          )}
          {cat !== "all" && (
            <button
              className="btn btn--sm btn--danger"
              onClick={() =>
                setConfirm({
                  label: `Delete every ${CATEGORY_LABEL[cat as CatalogCategory]} record (${shown.length})?`,
                  run: () => removeWhere((r) => catalogEntry(r.gameId)?.category === cat),
                })
              }
            >
              🗑 This category
            </button>
          )}
          <button
            className="btn btn--sm btn--danger"
            onClick={() =>
              setConfirm({ label: `Delete your entire history (${records.length} games)?`, run: clear })
            }
          >
            🗑 Everything
          </button>
        </div>
      </div>

      {confirm && (
        <div className="review__confirm">
          <span>{confirm.label} This cannot be undone.</span>
          <button
            className="btn btn--sm btn--danger"
            onClick={() => {
              confirm.run();
              setConfirm(null);
            }}
          >
            Delete
          </button>
          <button className="btn btn--sm" onClick={() => setConfirm(null)}>Keep</button>
        </div>
      )}

      <div className="review__list">
        {shown.map((r) => {
          const e = catalogEntry(r.gameId);
          return (
            <div className="review__row" key={r.id}>
              <button className="review__rowmain" onClick={() => onOpen(r.id)}>
                <span className="review__ico">{e?.icon ?? "🎲"}</span>
                <span className="review__names">
                  <span className="review__game">
                    {r.gameName}
                    {r.assisted && <span className="review__assist" title="Hints were used">💡</span>}
                  </span>
                  <span className="review__opp text-muted">{r.opponent}</span>
                </span>
                <span className={"review__pill review__pill--" + r.outcome}>{r.outcome}</span>
                <span className="review__meta text-dim">
                  {r.moveCount} moves · {relativeTime(r.endedISO, Date.now())}
                </span>
                <span className="review__go">
                  {isReviewable(r) ? "Review ›" : "Summary ›"}
                </span>
              </button>
              <button
                className="review__del"
                aria-label={`Delete this ${r.gameName} game`}
                title="Delete this game"
                onClick={() => remove(r.id)}
              >
                ✕
              </button>
            </div>
          );
        })}
        {shown.length === 0 && <p className="text-muted">Nothing matches that filter.</p>}
      </div>
    </>
  );
}

function Library({ onOpen }: { onOpen: (id: string) => void }) {
  const byCat = useMemo(() => {
    const out = new Map<CatalogCategory, FamousGame[]>();
    for (const f of FAMOUS) {
      const c = catalogEntry(f.gameId)?.category ?? "board";
      const list = out.get(c) ?? [];
      list.push(f);
      out.set(c, list);
    }
    return out;
  }, []);

  return (
    <div className="review__library">
      {CATEGORY_ORDER.map((c) => {
        const items = byCat.get(c);
        if (!items?.length) return null;
        return (
          <section key={c}>
            <h2 className="review__h2">{CATEGORY_LABEL[c]}</h2>
            <div className="review__cards">
              {items.map((f) => (
                <button className="review__card" key={f.id} onClick={() => onOpen(f.id)}>
                  <span className="review__card-kind">
                    {f.kind === "game" ? `♟ ${f.san?.length ?? 0} plies` : "📜 Context"}
                  </span>
                  <h3>{f.title}</h3>
                  {f.players && <p className="review__card-players">{f.players}</p>}
                  <p className="review__card-ctx">{f.context.slice(0, 150)}…</p>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- detail --- */

function RecordReview({ record, onBack }: { record: GameRecord; onBack: () => void }) {
  useActiveGame(record.gameId);
  const [review, setReview] = useState<GameReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const signal = useRef({ cancelled: false });

  const run = useCallback(async () => {
    setBusy(true);
    signal.current = { cancelled: false };
    try {
      const r = await reviewRecord(record, {
        signal: signal.current,
        onProgress: (done, total) => setProgress([done, total]),
      });
      setReview(r);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [record]);

  return (
    <div className="page">
      <button className="btn btn--sm btn--ghost" onClick={onBack}>‹ Back to review</button>
      <h1 className="toon-title review__title">
        {catalogEntry(record.gameId)?.icon} {record.gameName}
      </h1>
      <p className="text-dim">
        vs {record.opponent} · {record.outcome}
        {record.reason ? ` (${record.reason})` : ""} · {relativeTime(record.endedISO, Date.now())}
        {record.assisted ? " · assisted 💡" : ""}
      </p>

      {!review && (
        <div className="review__cta">
          {isReviewable(record) ? (
            <button className="btn btn--primary" disabled={busy} onClick={run}>
              {busy ? "Analysing…" : "🔍 Analyse this game"}
            </button>
          ) : (
            <p className="text-muted">
              This one is stored as a result rather than a move list, so there is
              nothing to step through.
            </p>
          )}
          {progress && (
            <span className="text-muted">
              {progress[0]}/{progress[1]} positions
            </span>
          )}
        </div>
      )}

      {review && <ReviewBody record={record} review={review} />}
    </div>
  );
}

function ReviewBody({ record, review }: { record: GameRecord; review: GameReview }) {
  const [ply, setPly] = useState(review.moves.length);
  const counts = useMemo(() => tally(review.moves.filter((m) => m.by !== "opponent").map((m) => m.label)), [review]);

  return (
    <>
      <div className="review__summary">
        <div className="review__acc">
          <div className="review__acc-num">{review.accuracy}%</div>
          <div className="review__acc-lbl">your accuracy</div>
        </div>
        <div className="review__tally">
          {counts.map((t) => (
            <span className="review__tag" key={t.label} style={{ ["--tone" as string]: LABEL_META[t.label].tone }}>
              {LABEL_META[t.label].icon} {LABEL_META[t.label].name} <b>{t.count}</b>
            </span>
          ))}
        </div>
      </div>
      <p className="review__note text-muted">Method: {review.method}.</p>
      {review.unavailable && <p className="review__note text-muted">{review.unavailable}</p>}

      <ReplayBoard record={record} ply={ply} />

      <div className="review__scrub">
        <button className="btn btn--sm" onClick={() => setPly(0)} disabled={ply === 0}>⏮</button>
        <button className="btn btn--sm" onClick={() => setPly((p) => Math.max(0, p - 1))} disabled={ply === 0}>‹</button>
        <input
          type="range"
          min={0}
          max={review.moves.length}
          value={ply}
          aria-label="Move"
          onChange={(e) => setPly(Number(e.target.value))}
        />
        <button
          className="btn btn--sm"
          onClick={() => setPly((p) => Math.min(review.moves.length, p + 1))}
          disabled={ply >= review.moves.length}
        >›</button>
        <button className="btn btn--sm" onClick={() => setPly(review.moves.length)} disabled={ply >= review.moves.length}>⏭</button>
      </div>

      <CoworkPanel record={record} review={review} />

      <ol className="review__moves">
        {review.moves.map((m) => {
          const meta = LABEL_META[m.label];
          return (
            <li
              key={m.ply}
              className={"review__move" + (m.ply === ply ? " is-at" : "") + (m.by === "you" ? " is-yours" : "")}
              style={{ ["--tone" as string]: meta.tone }}
              onClick={() => setPly(m.ply)}
            >
              <span className="review__ply">{m.ply}</span>
              <span className="review__san">{m.text}</span>
              <span className="review__label" title={meta.blurb}>{meta.icon} {meta.name}</span>
              {m.best && <span className="review__best text-muted">best was {m.best}</span>}
              {m.chance !== undefined && <span className="review__chance text-muted">{m.chance}%</span>}
              {m.note && <span className="review__movenote text-muted">{m.note}</span>}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Position after `ply` half-moves, rendered with the game's own board. */
function ReplayBoard({ record, ply }: { record: GameRecord; ply: number }) {
  const cat = catalogEntry(record.gameId)?.category;

  const chessFen = useMemo(() => {
    if (cat !== "chess") return null;
    const c = new Chess(record.startFen || START_FEN);
    const san = (record.moves as string[]) ?? [];
    for (let i = 0; i < ply && i < san.length; i++) {
      try {
        c.move(san[i]);
      } catch {
        break;
      }
    }
    return c.fen();
  }, [cat, record, ply]);

  const boardView = useMemo((): BoardView | null => {
    if (cat !== "board") return null;
    const def = getGame(record.gameId);
    if (!def) return null;
    let s = def.initial();
    const log = (record.moves as GameMove[]) ?? [];
    for (let i = 0; i < ply && i < log.length; i++) {
      const legal = def.legalMoves(s);
      const m = legal.find((l) => l.id === log[i].id) ??
        legal.find((l) => l.to === log[i].to && l.from === log[i].from);
      if (!m) break;
      s = def.applyMove(s, m);
    }
    const cells = def.cells(s);
    const tokens: Token[] = cells.flatMap((c, i) =>
      c ? [{ id: `t${i}`, cell: i, owner: c.owner, crowned: c.crowned }] : []
    );
    return {
      def: def as BoardView["def"],
      cells,
      tokens,
      graveyard: [],
      targets: [],
      selected: null,
      removalTargets: [],
      lastMoveCells: [],
      isHumanTurn: false,
      onCellClick: () => {},
    };
  }, [cat, record, ply]);

  if (chessFen) {
    return (
      <div className="review__board">
        <Board placed={fenToPlaced(chessFen)} orientation={record.humanSide === "b" ? "black" : "white"} />
      </div>
    );
  }
  if (boardView) {
    return (
      <div className="review__board">
        <GameBoard game={boardView} />
      </div>
    );
  }
  return null;
}

function FamousReview({ entry, onBack }: { entry: FamousGame; onBack: () => void }) {
  useActiveGame(entry.gameId);
  const [ply, setPly] = useState(0);

  const fen = useMemo(() => {
    if (!entry.san) return null;
    const c = new Chess();
    for (let i = 0; i < ply && i < entry.san.length; i++) {
      try {
        c.move(entry.san[i]);
      } catch {
        break;
      }
    }
    return c.fen();
  }, [entry, ply]);

  return (
    <div className="page">
      <button className="btn btn--sm btn--ghost" onClick={onBack}>‹ Back to review</button>
      <h1 className="toon-title review__title">{entry.title}</h1>
      {entry.players && <p className="text-dim">{entry.players}</p>}
      <p className="review__context">{entry.context}</p>
      {entry.lookFor && (
        <p className="review__lookfor">
          <strong>What to watch for:</strong> {entry.lookFor}
        </p>
      )}

      {fen && entry.san && (
        <>
          <div className="review__board">
            <Board placed={fenToPlaced(fen)} />
          </div>
          <div className="review__scrub">
            <button className="btn btn--sm" onClick={() => setPly(0)} disabled={ply === 0}>⏮</button>
            <button className="btn btn--sm" onClick={() => setPly((p) => Math.max(0, p - 1))} disabled={ply === 0}>‹</button>
            <input
              type="range"
              min={0}
              max={entry.san.length}
              value={ply}
              aria-label="Move"
              onChange={(e) => setPly(Number(e.target.value))}
            />
            <button
              className="btn btn--sm"
              onClick={() => setPly((p) => Math.min(entry.san!.length, p + 1))}
              disabled={ply >= entry.san.length}
            >›</button>
            <button className="btn btn--sm" onClick={() => setPly(entry.san!.length)}>⏭</button>
          </div>
          <ol className="review__moves review__moves--plain">
            {entry.san.map((s, i) => (
              <li
                key={i}
                className={"review__move" + (i + 1 === ply ? " is-at" : "")}
                onClick={() => setPly(i + 1)}
              >
                <span className="review__ply">{i + 1}</span>
                <span className="review__san">{s}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- cowork --- */

function CoworkPanel({ record, review }: { record: GameRecord; review: GameReview }) {
  const [copied, setCopied] = useState(false);
  const brief = useMemo(() => buildGameBrief(record, review), [record, review]);

  return (
    <details className="review__cowork">
      <summary>🤝 Cowork sync — get richer commentary on this game</summary>
      <p className="text-dim">
        This builds a full brief of the game: the position, every move, its
        verdict, and where the analyser thinks it turned. Hand it to Claude,
        Cowork, or any assistant and ask for the coaching the numbers can't give
        you.
      </p>
      <div className="review__cowork-actions">
        <button
          className="btn btn--sm btn--primary"
          onClick={() => {
            navigator.clipboard?.writeText(brief).then(
              () => setCopied(true),
              () => setCopied(false)
            );
          }}
        >
          {copied ? "Copied ✓" : "📋 Copy brief"}
        </button>
        <button className="btn btn--sm" onClick={() => downloadBrief(record, brief)}>
          ⬇ Download .md
        </button>
        <a className="btn btn--sm" href="/coach">🧑‍🏫 Open Coach</a>
      </div>
      <pre className="review__brief selectable">{brief}</pre>
    </details>
  );
}
