import { useState } from "react";
import { Link } from "react-router-dom";
import { CARD_GAMES } from "../cards/registry";
import { Blackjack } from "../cards/games/blackjack/Blackjack";
import { CrazyEights } from "../cards/games/crazy-eights/CrazyEights";
import { Hearts } from "../cards/games/hearts/Hearts";
import { Klondike } from "../cards/games/klondike/Klondike";
import { Pyramid } from "../cards/games/pyramid/Pyramid";
import { Golf } from "../cards/games/golf/Golf";
import { War } from "../cards/games/war/War";
import { GoFish } from "../cards/games/gofish/GoFish";
import { Memory } from "../cards/games/memory/Memory";
import { Poker } from "../cards/games/poker/Poker";
import { Holdem } from "../cards/games/holdem/Holdem";
import { Gin } from "../cards/games/gin/Gin";
import { OldMaid } from "../cards/games/oldmaid/OldMaid";
import { Briscola } from "../cards/games/briscola/Briscola";
import { Scopa } from "../cards/games/scopa/Scopa";
import { Cribbage } from "../cards/games/cribbage/Cribbage";
import { Durak } from "../cards/games/durak/Durak";
import { Euchre } from "../cards/games/euchre/Euchre";
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
        {gameId === "pyramid" && <Pyramid onExit={exit} />}
        {gameId === "golf" && <Golf onExit={exit} />}
        {gameId === "poker" && <Poker onExit={exit} />}
        {gameId === "gofish" && <GoFish onExit={exit} />}
        {gameId === "memory" && <Memory onExit={exit} />}
        {gameId === "war" && <War onExit={exit} />}
        {gameId === "holdem" && <Holdem onExit={exit} />}
        {gameId === "gin" && <Gin onExit={exit} />}
        {gameId === "oldmaid" && <OldMaid onExit={exit} />}
        {gameId === "briscola" && <Briscola onExit={exit} />}
        {gameId === "scopa" && <Scopa onExit={exit} />}
        {gameId === "cribbage" && <Cribbage onExit={exit} />}
        {gameId === "durak" && <Durak onExit={exit} />}
        {gameId === "euchre" && <Euchre onExit={exit} />}
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
        <Link to="/guide" className="btn btn--sm btn--ghost" style={{ marginTop: "0.5rem", display: "inline-block" }}>
          📖 Read the game guides
        </Link>
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
