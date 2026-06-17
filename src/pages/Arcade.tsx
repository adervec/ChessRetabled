import { useState } from "react";
import { GAMES } from "../games/registry";
import { GameBoard } from "../games/ui/GameBoard";
import { useGenericGame } from "../games/ui/useGenericGame";
import type { Difficulty, GameDefinition, Player } from "../games/core/types";
import "./Arcade.css";

type Setup = { difficulty: Difficulty; humanPlayer: Player; key: number };

export function Arcade() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [picked, setPicked] = useState<GameDefinition<any> | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);

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
  const aiPlayer: Player = humanPlayer === 0 ? 1 : 0;
  const { status } = game;

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

      <div className="arcade-game__board">
        <GameBoard game={game} />
      </div>

      <div className="arcade-game__controls">
        <button className="btn btn--sm" onClick={game.undo} disabled={!game.canUndo}>
          ↩ Undo
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
