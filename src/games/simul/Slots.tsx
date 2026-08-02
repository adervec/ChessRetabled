import { useEffect, useRef } from "react";
import { Board } from "../../components/board/Board";
import { GameBoard } from "../ui/GameBoard";
import { useGenericGame } from "../ui/useGenericGame";
import { useSimulChess } from "./useSimulChess";
import { getGame } from "../registry";
import { chessLevel, difficultyIndex, type SimulLevel } from "./types";
import { useArchive, newId } from "../../state/useArchive";
import { START_FEN } from "../../chess/types";

export interface SlotStatus {
  over: boolean;
  outcome: "win" | "loss" | "draw" | null;
  yourTurn: boolean;
}

interface SlotProps {
  slotId: string;
  level: SimulLevel;
  focused: boolean;
  size: number;
  onStatus: (slotId: string, s: SlotStatus) => void;
  onFocus: (slotId: string) => void;
}

function SlotFrame({
  title,
  icon,
  status,
  yourTurn,
  over,
  focused,
  onFocus,
  children,
}: {
  title: string;
  icon: string;
  status: string;
  yourTurn: boolean;
  over: boolean;
  focused: boolean;
  onFocus: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focused]);
  const cls = ["simul-slot"];
  if (yourTurn) cls.push("is-yours");
  if (over) cls.push("is-over");
  if (focused) cls.push("is-focused");
  return (
    <div className={cls.join(" ")} ref={ref} onClick={onFocus}>
      <div className="simul-slot__bar">
        <span className="simul-slot__icon">{icon}</span>
        <span className="simul-slot__name">{title}</span>
        <span className="simul-slot__status">{status}</span>
      </div>
      {children}
    </div>
  );
}

function statusText(over: boolean, outcome: SlotStatus["outcome"], thinking: boolean, yours: boolean): string {
  if (over) return outcome === "draw" ? "Draw" : outcome === "win" ? "You won 🏆" : "You lost";
  if (thinking) return "thinking…";
  return yours ? "your move" : "waiting";
}

export function ChessSlot({ slotId, level, focused, size, onStatus, onFocus }: SlotProps) {
  const s = useSimulChess("w", chessLevel(level));
  const addRecord = useArchive((a) => a.add);
  const reportedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const r = s.game.result;
  const outcome = r.over ? (r.winner == null ? "draw" : r.winner === "w" ? "win" : "loss") : null;

  useEffect(() => {
    onStatus(slotId, { over: r.over, outcome, yourTurn: s.isHumanTurn });
    if (r.over && !reportedRef.current) {
      reportedRef.current = true;
      addRecord({
        id: newId(),
        gameId: "chess",
        gameName: "Chess",
        startedISO: startedRef.current,
        endedISO: new Date().toISOString(),
        outcome: outcome!,
        humanSide: "w",
        opponent: `Simul · ${level}`,
        difficulty: level,
        moveCount: s.game.history().length,
        moves: s.game.history(),
        reason: r.reason ?? undefined,
        startFen: START_FEN,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.over, r.winner, s.isHumanTurn]);

  return (
    <SlotFrame
      title="Chess"
      icon="♟"
      status={statusText(r.over, outcome, s.thinking, s.isHumanTurn)}
      yourTurn={s.isHumanTurn}
      over={r.over}
      focused={focused}
      onFocus={() => onFocus(slotId)}
    >
      <Board
        placed={s.game.placed}
        orientation="white"
        interactive={s.isHumanTurn}
        selected={s.selected}
        targets={s.targets}
        lastMove={s.game.lastMove}
        checkSquare={s.game.checkSquare}
        maxWidth={size}
      />
    </SlotFrame>
  );
}

export function GenericSlot({
  slotId,
  level,
  focused,
  size,
  onStatus,
  onFocus,
  gameId,
}: SlotProps & { gameId: string }) {
  const def = getGame(gameId)!;
  const diff = def.difficulties[difficultyIndex(level)] ?? def.difficulties[0];
  const game = useGenericGame(def, 0, diff);
  const addRecord = useArchive((a) => a.add);
  const reportedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const st = game.status;
  const outcome = st.over ? (st.winner == null ? "draw" : st.winner === 0 ? "win" : "loss") : null;

  useEffect(() => {
    onStatus(slotId, { over: st.over, outcome, yourTurn: game.isHumanTurn });
    if (st.over && !reportedRef.current) {
      reportedRef.current = true;
      addRecord({
        id: newId(),
        gameId: def.id,
        gameName: def.name,
        startedISO: startedRef.current,
        endedISO: new Date().toISOString(),
        outcome: outcome!,
        humanSide: "0",
        opponent: `Simul · ${level}`,
        difficulty: diff.id,
        moveCount: game.moveLog.length,
        moves: game.moveLog,
        reason: st.over ? st.reason : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.over, game.isHumanTurn]);

  return (
    <SlotFrame
      title={def.name}
      icon={def.icon}
      status={statusText(st.over, outcome, game.thinking, game.isHumanTurn)}
      yourTurn={game.isHumanTurn}
      over={st.over}
      focused={focused}
      onFocus={() => onFocus(slotId)}
    >
      <div style={{ ["--board-max" as string]: `${size}px` } as React.CSSProperties}>
        <GameBoard game={game} />
      </div>
    </SlotFrame>
  );
}
