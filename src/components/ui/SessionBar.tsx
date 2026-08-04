import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessions, otherSessions, type Session } from "../../state/useSessions";
import { useActiveGameStore } from "../../state/activeGame";
import { useArchive, newId } from "../../state/useArchive";
import { judgeAbandon, abandonLabel } from "../../state/abandon";
import { catalogEntry } from "../../catalog";
import "./SessionBar.css";

// A bar along the bottom for games you have open somewhere else. It only appears
// when there is something to come back to, and it never covers the game you are
// actually playing.

export function SessionBar() {
  const sessions = useSessions((s) => s.sessions);
  const end = useSessions((s) => s.end);
  const activeGameId = useActiveGameStore((s) => s.id);
  const addRecord = useArchive((a) => a.add);
  const nav = useNavigate();
  const [confirming, setConfirming] = useState<Session | null>(null);

  const open = otherSessions(sessions, activeGameId);
  if (open.length === 0 && !confirming) return null;

  const abandon = (s: Session) => {
    const entry = catalogEntry(s.gameId);
    const verdict = judgeAbandon({
      moveCount: s.moveCount,
      elapsedMs: Date.parse(s.updatedISO) - Date.parse(s.startedISO),
      kind: entry?.kind ?? "versus",
      losing: s.losing,
    });

    if (verdict.outcome !== "discard") {
      addRecord({
        id: newId(),
        gameId: s.gameId,
        gameName: s.gameName,
        startedISO: s.startedISO,
        endedISO: new Date().toISOString(),
        outcome: verdict.outcome === "loss" ? "loss" : "abandoned",
        humanSide: "—",
        opponent: "—",
        moveCount: s.moveCount,
        moves: s.resume?.moves ?? s.resume?.san ?? [],
        reason: verdict.outcome === "loss" ? "Resigned by leaving" : "Left unfinished",
        assisted: s.assisted,
      });
    }
    end(s.gameId);
    setConfirming(null);
  };

  return (
    <>
      {confirming && (
        <AbandonDialog
          session={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={() => abandon(confirming)}
        />
      )}
      <div className="sessionbar" role="region" aria-label="Games still open">
        <span className="sessionbar__lbl">Still going</span>
        <div className="sessionbar__items">
          {open.map((s) => (
            <div className="sessionbar__item" key={s.gameId}>
              <button
                className="sessionbar__resume"
                onClick={() => nav(s.route)}
                title={`Resume ${s.gameName} — ${s.moveCount} moves in`}
              >
                <span aria-hidden>{s.icon}</span>
                <span className="sessionbar__name">{s.gameName}</span>
                <span className="sessionbar__moves">{s.moveCount}</span>
              </button>
              <button
                className="sessionbar__drop"
                aria-label={`Leave ${s.gameName}`}
                title={`Leave ${s.gameName}`}
                onClick={() => setConfirming(s)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AbandonDialog({
  session,
  onCancel,
  onConfirm,
}: {
  session: Session;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const entry = catalogEntry(session.gameId);
  const verdict = judgeAbandon({
    moveCount: session.moveCount,
    elapsedMs: Date.parse(session.updatedISO) - Date.parse(session.startedISO),
    kind: entry?.kind ?? "versus",
    losing: session.losing,
  });

  return (
    <div className="sessionbar__scrim" onClick={onCancel}>
      <div className="sessionbar__dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Leave {session.gameName}?</h3>
        <p className="text-dim">{verdict.reason}</p>
        <div className="sessionbar__dialog-actions">
          <button className="btn btn--sm" onClick={onCancel}>Keep playing</button>
          <button
            className={"btn btn--sm" + (verdict.outcome === "loss" ? " btn--danger" : "")}
            onClick={onConfirm}
          >
            {abandonLabel(verdict)}
          </button>
        </div>
      </div>
    </div>
  );
}
