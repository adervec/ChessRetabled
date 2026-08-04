import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Board } from "../components/board/Board";
import { PromotionDialog } from "../components/board/PromotionDialog";
import { BotPicker } from "../components/play/BotPicker";
import { PlayerCard } from "../components/play/PlayerCard";
import { MoveList } from "../components/game/MoveList";
import { EvalBar } from "../components/game/EvalBar";
import { GameOverModal } from "../components/game/GameOverModal";
import { useBotGame, capturedFromHistory } from "../chess/useBotGame";
import { getEngine } from "../engine";
import { useProgress } from "../state/useProgress";
import { useArchive, newId } from "../state/useArchive";
import { PIECE_VALUE, START_FEN, type Color } from "../chess/types";
import { BOTS } from "../content/bots";
import type { Bot } from "../content/bots";
import "./Play.css";
import { useActiveGame } from "../state/activeGame";
import { useGameSession } from "../state/useGameSession";
import { useSessions } from "../state/useSessions";

type Setup = { bot: Bot; color: Color; key: number; resumeSan?: string[] };

export function Play() {
  useActiveGame("chess");
  const [setup, setSetup] = useState<Setup | null>(null);
  const saved = useSessions((s) => s.sessions.find((x) => x.gameId === "chess"));
  const savedSan = saved?.resume?.san ?? [];
  const savedBot = BOTS.find((b) => b.id === saved?.resume?.setup?.bot);

  useEffect(() => {
    // warm up the engine as soon as the user is on the Play page
    getEngine().init();
  }, []);

  if (!setup) {
    return (
      <div className="page">
        {saved && savedSan.length > 0 && savedBot && (
          <div className="arcade-setup__resume">
            <p>
              You have a game against {savedBot.name} going — {savedSan.length} moves in.
            </p>
            <button
              className="btn btn--mint"
              onClick={() =>
                setSetup({
                  bot: savedBot,
                  color: (saved.resume?.setup?.colour === "b" ? "b" : "w") as Color,
                  key: 0,
                  resumeSan: savedSan,
                })
              }
            >
              ▶ Pick it back up
            </button>
          </div>
        )}
        <BotPicker
          onStart={(bot, color) => setSetup({ bot, color, key: 0 })}
        />
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link to="/guide/chess" className="btn btn--sm btn--ghost">
            📖 Chess strategy guide
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <BotGame
        key={setup.key}
        bot={setup.bot}
        humanColor={setup.color}
        resumeSan={setup.resumeSan}
        onRematch={() => setSetup((s) => (s ? { ...s, key: s.key + 1, resumeSan: undefined } : s))}
        onNewOpponent={() => setSetup(null)}
      />
    </div>
  );
}

function BotGame({
  bot,
  humanColor,
  resumeSan,
  onRematch,
  onNewOpponent,
}: {
  bot: Bot;
  humanColor: Color;
  resumeSan?: string[];
  onRematch: () => void;
  onNewOpponent: () => void;
}) {
  const g = useBotGame(bot, humanColor, undefined, resumeSan);
  // Survives a reload: the bottom bar offers this game back until it resolves.
  useGameSession({
    gameId: "chess",
    gameName: "Chess",
    icon: "♟",
    route: "/play",
    moveCount: g.history.length,
    over: g.result.over,
    assisted: g.hintUsed,
    resume: { san: g.history.map((m) => m.san), setup: { bot: bot.id, colour: humanColor } },
  });
  const recordGame = useProgress((s) => s.recordGame);
  const addRecord = useArchive((s) => s.add);
  const recordedRef = useRef(false);
  const startedRef = useRef(new Date().toISOString());
  const [showModal, setShowModal] = useState(false);
  const [backend, setBackend] = useState("");

  useEffect(() => {
    getEngine()
      .init()
      .then(() => {
        const e = getEngine();
        setBackend(e.usingFallback ? "Built-in AI (offline)" : e.backendName);
      });
  }, []);

  useEffect(() => {
    if (g.gameOver && !recordedRef.current) {
      recordedRef.current = true;
      const w = g.result.winner;
      const outcome = w == null ? "draw" : w === humanColor ? "win" : "loss";
      recordGame(outcome);
      addRecord({
        id: newId(),
        gameId: "chess",
        gameName: "Chess",
        startedISO: startedRef.current,
        endedISO: new Date().toISOString(),
        outcome,
        humanSide: humanColor,
        opponent: `${bot.name} · ${bot.rating}`,
        difficulty: bot.id,
        moveCount: g.history.length,
        moves: g.history,
        reason: g.result.reason ?? undefined,
        startFen: START_FEN,
        assisted: g.hintUsed || undefined,
      });
      setShowModal(true);
    }
  }, [g.gameOver, g.result, g.history, g.hintUsed, humanColor, bot, recordGame, addRecord]);

  const botColor: Color = humanColor === "w" ? "b" : "w";
  const { byWhite, byBlack } = capturedFromHistory(g.history);
  const matWhite = byWhite.reduce((s, t) => s + PIECE_VALUE[t as "p"], 0);
  const matBlack = byBlack.reduce((s, t) => s + PIECE_VALUE[t as "p"], 0);
  const whiteAdv = matWhite - matBlack;
  const humanAdv = humanColor === "w" ? whiteAdv : -whiteAdv;

  const humanCaptured = humanColor === "w" ? byWhite : byBlack;
  const botCaptured = humanColor === "w" ? byBlack : byWhite;

  const cp = g.evalScore.cp;
  const mate = g.evalScore.mate;
  const whiteCp = cp == null ? undefined : humanColor === "w" ? cp : -cp;
  const whiteMate = mate == null ? undefined : humanColor === "w" ? mate : -mate;

  const myTurn = g.game.turn === humanColor && !g.gameOver;
  const interactive = myTurn && !g.thinking;

  return (
    <div className="game">
      <div className="game__main">
        <div className="game__topbar">
          <button className="btn btn--sm btn--ghost" onClick={onNewOpponent}>
            ← Opponents
          </button>
          <span className="tag" style={{ borderColor: "var(--ink)" }}>
            {bot.avatar} {bot.name} · {bot.rating}
          </span>
          <span className="spacer" />
          <button className="btn btn--sm btn--ghost" onClick={g.flip}>
            ⇅ Flip
          </button>
        </div>

        <PlayerCard
          name={bot.name}
          title={bot.title}
          rating={bot.rating}
          avatar={bot.avatar}
          accent={bot.accent}
          color={botColor}
          captured={botCaptured}
          advantage={Math.max(0, -humanAdv)}
          active={g.game.turn === botColor && !g.gameOver}
          thinking={g.thinking}
        />

        <div className="game__boardwrap" style={{ marginTop: 12 }}>
          <div className="game__evalcol">
            <EvalBar
              cp={whiteCp}
              mate={whiteMate}
              orientation={g.orientation}
              loading={g.thinking}
            />
          </div>
          <div className="game__board">
            <Board
              placed={g.game.placed}
              orientation={g.orientation}
              interactive={interactive}
              selected={g.controller.selected}
              targets={g.controller.targets}
              lastMove={g.game.lastMove}
              checkSquare={g.game.checkSquare}
              hintSquares={
                g.hint
                  ? g.hint.stage === 1
                    ? [g.hint.from]
                    : [g.hint.from, g.hint.to]
                  : []
              }
              onSquareClick={g.controller.onSquareClick}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <PlayerCard
            name="You"
            avatar={humanColor === "w" ? "🙂" : "😎"}
            color={humanColor}
            accent="var(--mint)"
            captured={humanCaptured}
            advantage={Math.max(0, humanAdv)}
            active={myTurn}
          />
        </div>
      </div>

      <aside className="game__side">
        <div className="game__status">
          <span className={"dot " + g.game.turn} />
          {g.gameOver
            ? "Game over"
            : g.thinking
            ? `${bot.name} is thinking…`
            : myTurn
            ? g.game.inCheck
              ? "Your move — you're in check!"
              : "Your move"
            : `${bot.name} to move`}
        </div>

        <MoveList history={g.history} />

        <div className="game__controls">
          <button
            className="btn btn--sm btn--sky"
            onClick={g.requestHint}
            disabled={!myTurn || g.hintBusy || g.hint?.stage === 2}
            title="Progressive hint — using it marks this game as assisted"
          >
            {g.hintBusy ? "…" : g.hint?.stage === 1 ? "💡 Reveal move" : "💡 Hint"}
          </button>
          <button
            className="btn btn--sm"
            onClick={g.takeback}
            disabled={g.thinking || g.history.length === 0}
          >
            ↩ Takeback
          </button>
          <button
            className="btn btn--sm"
            onClick={() => {
              if (!g.offerDraw()) alert(`${bot.name} declines the draw.`);
            }}
            disabled={g.gameOver}
          >
            🤝 Draw
          </button>
          <button
            className="btn btn--sm btn--coral"
            onClick={g.resign}
            disabled={g.gameOver}
          >
            🏳 Resign
          </button>
          <button className="btn btn--sm" onClick={onRematch}>
            ↻ Rematch
          </button>
          <button className="btn btn--sm btn--ghost" onClick={onNewOpponent}>
            New foe
          </button>
        </div>

        <div className="game__enginebadge">
          {backend ? `engine: ${backend}` : "loading engine…"}
        </div>
      </aside>

      {g.controller.promotion && (
        <PromotionDialog
          color={g.controller.promotion.color}
          onChoose={g.controller.choosePromotion}
          onCancel={g.controller.cancelPromotion}
        />
      )}

      {showModal && g.result.over && (
        <GameOverModal
          winner={g.result.winner}
          reason={g.result.reason}
          humanColor={humanColor}
          botName={bot.name}
          onRematch={() => {
            setShowModal(false);
            onRematch();
          }}
          onNewOpponent={onNewOpponent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
