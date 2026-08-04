import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GAMES } from "../games/registry";
import { GameBoard } from "../games/ui/GameBoard";
import { useGenericGame } from "../games/ui/useGenericGame";
import type { Difficulty, GameDefinition, Player } from "../games/core/types";
import { useArchive, newId } from "../state/useArchive";
import { useProgress } from "../state/useProgress";
import { useActiveGame } from "../state/activeGame";
import { useGameSession } from "../state/useGameSession";
import "./Arcade.css";

type Setup = { difficulty: Difficulty; humanPlayer: Player; key: number };

export function Arcade() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [picked, setPicked] = useState<GameDefinition<any> | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  useActiveGame(picked && setup ? picked.id : null);

  if (picked && setup) {
    return (
      <div className="page">
        <GameScreen
          key={setup.key}
          def={picked}
          difficulty={setup.difficulty}
          humanPlayer={setup.humanPlayer}
          onRematch={() => setSetup((s) => (s ? { ...s, key: s.key + 1 } : s))}
          onBack={() => setSetup(null)}
          onExit={() => {
            setSetup(null);
            setPicked(null);
          }}
        />
      </div>
    );
  }

  if (picked) {
    return (
      <div className="page">
        <GameSetup
          def={picked}
          onStart={(difficulty, humanPlayer) => setSetup({ difficulty, humanPlayer, key: 0 })}
          onBack={() => setPicked(null)}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="arcade__head">
        <h1 className="arcade__title">Games Cabinet</h1>
        <p className="arcade__sub">
          A growing set of perfect-information strategy games — every one playable
          against a built-in AI, all offline.
        </p>
        <Link to="/guide" className="btn btn--sm btn--ghost" style={{ marginTop: "0.5rem", display: "inline-block" }}>
          📖 Read the game guides
        </Link>
      </header>
      <div className="arcade__grid">
        {GAMES.map((g) => (
          <button key={g.id} className="arcade-card" onClick={() => setPicked(g)}>
            <span className="arcade-card__icon">{g.icon}</span>
            <span className="arcade-card__name">{g.name}</span>
            <span className="arcade-card__blurb">{g.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GameSetup({
  def,
  onStart,
  onBack,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: GameDefinition<any>;
  onStart: (d: Difficulty, p: Player) => void;
  onBack: () => void;
}) {
  const [diff, setDiff] = useState<Difficulty>(def.difficulties[1] ?? def.difficulties[0]);
  const [first, setFirst] = useState(true); // human moves first?

  return (
    <div className="arcade-setup">
      <button className="btn btn--sm btn--ghost" onClick={onBack}>
        ← All games
      </button>
      <div className="arcade-setup__head">
        <span className="arcade-setup__icon">{def.icon}</span>
        <div>
          <h1 className="arcade__title">{def.name}</h1>
          <p className="arcade__sub">{def.blurb}</p>
        </div>
      </div>

      <p className="arcade-setup__rules">{def.rules}</p>

      <Link to={`/guide/${def.id}`} className="btn btn--sm btn--ghost" style={{ display: "inline-block", marginBottom: "0.5rem" }}>
        📖 Full strategy guide
      </Link>

      <div className="arcade-setup__group">
        <h3>Difficulty</h3>
        <div className="arcade-setup__opts">
          {def.difficulties.map((d) => (
            <button
              key={d.id}
              className={"chip-btn" + (d.id === diff.id ? " is-on" : "")}
              onClick={() => setDiff(d)}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      <div className="arcade-setup__group">
        <h3>You play</h3>
        <div className="arcade-setup__opts">
          <button
            className={"chip-btn" + (first ? " is-on" : "")}
            onClick={() => setFirst(true)}
          >
            {def.players[0]} · first
          </button>
          <button
            className={"chip-btn" + (!first ? " is-on" : "")}
            onClick={() => setFirst(false)}
          >
            {def.players[1]} · second
          </button>
        </div>
      </div>

      <button className="btn btn--lg btn--mint" onClick={() => onStart(diff, first ? 0 : 1)}>
        ▶ Start game
      </button>
    </div>
  );
}

function GameScreen({
  def,
  difficulty,
  humanPlayer,
  onRematch,
  onBack,
  onExit,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: GameDefinition<any>;
  difficulty: Difficulty;
  humanPlayer: Player;
  onRematch: () => void;
  onBack: () => void;
  onExit: () => void;
}) {
  const game = useGenericGame(def, humanPlayer, difficulty);
  // Keeps this game in the bottom bar until it resolves, so closing the tab
  // mid-game no longer loses it silently.
  useGameSession({
    gameId: def.id,
    gameName: def.name,
    icon: def.icon,
    route: "/games",
    moveCount: game.moveLog.length,
    over: game.status.over,
    assisted: game.hintUsed,
    resume: { moves: game.moveLog, setup: { difficulty: difficulty.id, humanPlayer } },
  });
  const aiPlayer: Player = humanPlayer === 0 ? 1 : 0;
  const { status } = game;

  const addRecord = useArchive((s) => s.add);
  const addXp = useProgress((s) => s.addXp);
  const startedRef = useRef(new Date().toISOString());
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!status.over || recordedRef.current) return;
    recordedRef.current = true;
    const outcome =
      status.winner == null ? "draw" : status.winner === humanPlayer ? "win" : "loss";
    addRecord({
      id: newId(),
      gameId: def.id,
      gameName: def.name,
      startedISO: startedRef.current,
      endedISO: new Date().toISOString(),
      outcome,
      humanSide: String(humanPlayer),
      opponent: `AI · ${difficulty.name}`,
      difficulty: difficulty.id,
      moveCount: game.moveLog.length,
      moves: game.moveLog,
      reason: status.reason,
      assisted: game.hintUsed || undefined,
    });
    addXp(outcome === "win" ? 20 : outcome === "draw" ? 8 : 4);
  }, [status, humanPlayer, def, difficulty, game.moveLog, game.hintUsed, addRecord, addXp]);

  const turnNote = status.over
    ? resultText(def, status, humanPlayer)
    : game.thinking
    ? "Thinking…"
    : game.isHumanTurn
    ? game.interactionModel === "select" && game.selected === null
      ? "Your move — pick a piece"
      : game.removalTargets.length
      ? "Mill! Remove an enemy piece"
      : "Your move"
    : `${def.players[aiPlayer]} to move`;

  return (
    <div className="arcade-game">
      <div className="arcade-game__topbar">
        <button className="btn btn--sm btn--ghost" onClick={onExit}>
          ← Games
        </button>
        <span className="tag tag--gold">
          {def.icon} {def.name}
        </span>
        <span className="tag tag--violet">{difficulty.name}</span>
        {game.hintUsed && (
          <span className="tag" title="A hint was used — this game counts as assisted">
            💡 assisted
          </span>
        )}
      </div>

      <div className="arcade-game__legend">
        <span className={"arcade-who" + (game.isHumanTurn ? " is-active" : "")}>
          You · {def.players[humanPlayer]}
        </span>
        <span className="arcade-who__vs">vs</span>
        <span className={"arcade-who" + (!game.isHumanTurn && !status.over ? " is-active" : "")}>
          AI · {def.players[aiPlayer]}
        </span>
      </div>

      <div className={"arcade-status" + (status.over ? " is-over" : "")}>{turnNote}</div>
      {game.hintNote && !status.over && (
        <div className="arcade-hintnote">💡 {game.hintNote}</div>
      )}

      <div className="arcade-game__board">
        <GameBoard game={game} />
      </div>

      <div className="arcade-game__controls">
        <button className="btn btn--sm" onClick={game.undo} disabled={!game.canUndo}>
          ↩ Undo
        </button>
        <button
          className="btn btn--sm btn--gold"
          onClick={game.requestHint}
          disabled={!game.canHint || status.over}
          title="Progressive hint — using it marks this game as assisted"
        >
          💡 {game.hintStage === 1 ? "Reveal move" : "Hint"}
        </button>
        <button className="btn btn--sm btn--sky" onClick={onRematch}>
          ↻ New game
        </button>
        <button className="btn btn--sm btn--ghost" onClick={onBack}>
          ⚙ Settings
        </button>
      </div>

      {status.over && (
        <div className="arcade-over">
          <div className="arcade-over__card">
            <div className="arcade-over__emoji">{resultEmoji(status, humanPlayer)}</div>
            <h2>{resultText(def, status, humanPlayer)}</h2>
            <p className="arcade-over__reason">{status.reason}</p>
            <div className="arcade-over__btns">
              <button className="btn btn--mint" onClick={onRematch}>
                ↻ Rematch
              </button>
              <button className="btn btn--ghost" onClick={onExit}>
                Pick another game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function resultText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: GameDefinition<any>,
  status: Extract<ReturnType<GameDefinition["status"]>, { over: true }>,
  humanPlayer: Player
): string {
  if (status.winner === null) return "Draw";
  return status.winner === humanPlayer ? "You win! 🎉" : `${def.players[status.winner]} wins`;
}

function resultEmoji(
  status: Extract<ReturnType<GameDefinition["status"]>, { over: true }>,
  humanPlayer: Player
): string {
  if (status.winner === null) return "🤝";
  return status.winner === humanPlayer ? "🏆" : "😵";
}
