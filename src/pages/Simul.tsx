import { useCallback, useMemo, useState } from "react";
import { GAMES } from "../games/registry";
import { ChessSlot, GenericSlot, type SlotStatus } from "../games/simul/Slots";
import { SIMUL_LEVELS, type SimulLevel, type SlotSpec } from "../games/simul/types";
import "./Simul.css";

const TYPES = [
  { id: "chess", name: "Chess", icon: "♟" },
  ...GAMES.map((g) => ({ id: g.id, name: g.name, icon: g.icon })),
];

export function Simul() {
  const [slots, setSlots] = useState<SlotSpec[] | null>(null);
  const [level, setLevel] = useState<SimulLevel>("medium");

  if (slots) {
    return <SimulBoard slots={slots} level={level} onExit={() => setSlots(null)} />;
  }
  return <SimulSetup level={level} setLevel={setLevel} onStart={setSlots} />;
}

function SimulSetup({
  level,
  setLevel,
  onStart,
}: {
  level: SimulLevel;
  setLevel: (l: SimulLevel) => void;
  onStart: (slots: SlotSpec[]) => void;
}) {
  const [counts, setCounts] = useState<Record<string, number>>({ chess: 2, checkers: 1 });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const set = (id: string, n: number) =>
    setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(8, n)) }));

  const build = () => {
    const slots: SlotSpec[] = [];
    for (const t of TYPES) {
      const n = counts[t.id] ?? 0;
      for (let i = 0; i < n; i++) slots.push({ id: `${t.id}-${i}`, type: t.id });
    }
    if (slots.length >= 2) onStart(slots);
  };

  const preset = (c: Record<string, number>) => setCounts(c);

  return (
    <div className="page">
      <header className="arcade__head">
        <h1 className="arcade__title">Simultaneous Exhibition</h1>
        <p className="arcade__sub">
          Face many boards at once and move at each in turn — the early-20th-century
          simul, now with mixed games. Pick any combination of chess and the arcade
          games.
        </p>
      </header>

      <div className="simul-setup__presets">
        <button className="chip-btn" onClick={() => preset({ chess: 6 })}>♟ Classic · 6 chess</button>
        <button className="chip-btn" onClick={() => preset({ chess: 2, checkers: 1, reversi: 1, "connect-four": 1, gomoku: 1 })}>
          🎲 Grand mix · 6
        </button>
        <button className="chip-btn" onClick={() => preset(Object.fromEntries(TYPES.map((t) => [t.id, 1])))}>
          🌈 One of each
        </button>
      </div>

      <div className="simul-setup__grid">
        {TYPES.map((t) => (
          <div className="simul-type" key={t.id}>
            <span className="simul-type__icon">{t.icon}</span>
            <span className="simul-type__name">{t.name}</span>
            <div className="simul-type__stepper">
              <button onClick={() => set(t.id, (counts[t.id] ?? 0) - 1)} aria-label="fewer">−</button>
              <span>{counts[t.id] ?? 0}</span>
              <button onClick={() => set(t.id, (counts[t.id] ?? 0) + 1)} aria-label="more">+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="simul-setup__foot">
        <div className="simul-setup__level">
          <span>Opponent strength</span>
          <div className="settings__row">
            {SIMUL_LEVELS.map((l) => (
              <button
                key={l.id}
                className={"chip-btn" + (l.id === level ? " is-on" : "")}
                onClick={() => setLevel(l.id)}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn--lg btn--mint" disabled={total < 2 || total > 12} onClick={build}>
          ▶ Start {total} boards
        </button>
        {total > 12 && <p className="simul-setup__warn">Max 12 boards at once.</p>}
      </div>
    </div>
  );
}

function SimulBoard({ slots, level, onExit }: { slots: SlotSpec[]; level: SimulLevel; onExit: () => void }) {
  const [statuses, setStatuses] = useState<Record<string, SlotStatus>>({});
  const [focusId, setFocusId] = useState<string | null>(null);

  const onStatus = useCallback((id: string, s: SlotStatus) => {
    setStatuses((prev) => {
      const p = prev[id];
      if (p && p.over === s.over && p.outcome === s.outcome && p.yourTurn === s.yourTurn) return prev;
      return { ...prev, [id]: s };
    });
  }, []);

  const onFocus = useCallback((id: string) => setFocusId(id), []);

  const tally = useMemo(() => {
    let won = 0, lost = 0, drawn = 0, decided = 0, yours = 0;
    for (const sp of slots) {
      const s = statuses[sp.id];
      if (!s) continue;
      if (s.over) {
        decided++;
        if (s.outcome === "win") won++;
        else if (s.outcome === "loss") lost++;
        else if (s.outcome === "draw") drawn++;
      } else if (s.yourTurn) yours++;
    }
    return { won, lost, drawn, decided, yours };
  }, [slots, statuses]);

  const nextBoard = () => {
    const startIdx = focusId ? slots.findIndex((s) => s.id === focusId) : -1;
    for (let k = 1; k <= slots.length; k++) {
      const sp = slots[(startIdx + k) % slots.length];
      const s = statuses[sp.id];
      if (s && s.yourTurn && !s.over) {
        setFocusId(sp.id);
        return;
      }
    }
  };

  const size = slots.length <= 2 ? 380 : slots.length <= 4 ? 320 : 270;
  const allDone = tally.decided === slots.length;

  return (
    <div className="page">
      <div className="simul-topbar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>← End simul</button>
        <div className="simul-score">
          <span className="badge-win">{tally.won}W</span>
          <span className="badge-draw">{tally.drawn}D</span>
          <span className="badge-loss">{tally.lost}L</span>
          <span className="simul-score__sub">{tally.decided}/{slots.length} decided</span>
        </div>
        <button className="btn btn--sm btn--gold" onClick={nextBoard} disabled={tally.yours === 0}>
          ⤼ Next board needing you{tally.yours ? ` (${tally.yours})` : ""}
        </button>
      </div>

      {allDone && (
        <div className="simul-done">
          🏁 Exhibition complete — {tally.won} wins, {tally.drawn} draws, {tally.lost} losses.
        </div>
      )}

      <div className="simul-grid">
        {slots.map((sp) =>
          sp.type === "chess" ? (
            <ChessSlot
              key={sp.id}
              slotId={sp.id}
              level={level}
              focused={focusId === sp.id}
              size={size}
              onStatus={onStatus}
              onFocus={onFocus}
            />
          ) : (
            <GenericSlot
              key={sp.id}
              slotId={sp.id}
              gameId={sp.type}
              level={level}
              focused={focusId === sp.id}
              size={size}
              onStatus={onStatus}
              onFocus={onFocus}
            />
          )
        )}
      </div>
    </div>
  );
}
