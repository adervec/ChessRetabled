import { useState } from "react";
import { CARD_GAMES } from "../cards/registry";
import { Blackjack } from "../cards/games/blackjack/Blackjack";
import { CrazyEights } from "../cards/games/crazy-eights/CrazyEights";
import { Hearts } from "../cards/games/hearts/Hearts";
import { Klondike } from "../cards/games/klondike/Klondike";
import "./Cards.css";

export function Cards() {
  const [gameId, setGameId] = useState<string | null>(null);
  const exit = () => setGameId(null);

  if (gameId) {
    return (
      <div className="page">
        {gameId === "blackjack" && <Blackjack onExit={exit} />}
        {gameId === "crazy-eights" && <CrazyEights onExit={exit} />}
        {gameId === "hearts" && <Hearts onExit={exit} />}
        {gameId === "klondike" && <Klondike onExit={exit} />}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="arcade__head">
        <h1 className="arcade__title">Card Room</h1>
        <p className="arcade__sub">
          A deck of classics — solitaire, blackjack, and card games against the AI.
          Shuffles are seeded, so every hand is recorded and replayable.
        </p>
      </header>
      <div className="arcade__grid">
        {CARD_GAMES.map((g) => (
          <button key={g.id} className="arcade-card" onClick={() => setGameId(g.id)}>
            <span className="arcade-card__icon">{g.icon}</span>
            <span className="arcade-card__name">{g.name}</span>
            <span className="arcade-card__blurb">{g.blurb}</span>
            <span className="card-players">{g.players}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
