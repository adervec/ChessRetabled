import { Fragment } from "react";
import type { BoardView, Token } from "./boardView";
import { GamePiece } from "./GamePiece";
import { useSettings } from "../../state/useSettings";
import "./GameBoard.css";

export function GameBoard({ game }: { game: BoardView }) {
  const tilt = useSettings((s) => s.boardTilt);
  if (game.def.geometry.kind === "points") return <PointsBoard game={game} flat={!tilt} />;
  return <GridBoard game={game} flat={!tilt} />;
}

function GridBoard({ game, flat }: { game: BoardView; flat: boolean }) {
  const { def } = game;
  const geo = def.geometry;
  if (geo.kind !== "grid") return null;
  const { cols, rows, checkered, darkOnly } = geo;
  const cellPct = 100 / cols;

  const cells = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const dark = (col + row) % 2 === 1;
    const isVoid = darkOnly === true && !dark;
    const classes = ["gcell"];
    if (checkered) classes.push(dark ? "dark" : "light");
    if (isVoid) classes.push("void");
    if (game.lastMoveCells.includes(i)) classes.push("last");
    if (game.selected === i) classes.push("sel");
    if (game.removalTargets.includes(i)) classes.push("removal");
    const clickable = game.isHumanTurn && !isVoid;
    cells.push(
      <button
        key={i}
        type="button"
        className={classes.join(" ")}
        disabled={!clickable}
        aria-label={`cell ${i}`}
        onClick={clickable ? () => game.onCellClick(i) : undefined}
      >
        <span className="gcell__hl" />
      </button>
    );
  }

  const sorted = [...game.tokens].sort((a, b) => Math.floor(a.cell / cols) - Math.floor(b.cell / cols));

  return (
    <div
      className={"gboard-scene gb--" + def.id + (flat ? " flat" : "")}
      style={{ ["--cell" as string]: `${cellPct}%`, ["--cols" as string]: cols } as React.CSSProperties}
    >
      <div className="gboard3d" style={{ aspectRatio: `${cols} / ${rows}` }}>
        <div className="gboard3d__slab" />
        <div className="gboard3d__frame" />
        <div className="gboard3d__grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {cells}
        </div>

        <div className="gpieces">
          {sorted.map((t) => {
            const col = t.cell % cols;
            const row = Math.floor(t.cell / cols);
            return (
              <div
                key={t.id}
                className="gpiece"
                style={{ ["--tx" as string]: `${col * 100}%`, ["--ty" as string]: `${row * 100}%` } as React.CSSProperties}
              >
                <span className="gpiece__shadow" />
                <span className="gpiece__sprite">
                  <GamePiece
                    shape={def.pieceShape}
                    color={def.pieceColors[t.owner]}
                    player={t.owner}
                    crowned={t.crowned}
                  />
                </span>
              </div>
            );
          })}
        </div>

        {game.isHumanTurn && game.targets.length > 0 && (
          <div className="gtargets">
            {game.targets.map((i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              return (
                <div
                  key={i}
                  className="gtarget"
                  style={{ ["--tx" as string]: `${col * 100}%`, ["--ty" as string]: `${row * 100}%` } as React.CSSProperties}
                  onClick={() => game.onCellClick(i)}
                >
                  <span className="gtarget__dot" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Graveyard game={game} />
    </div>
  );
}

function PointsBoard({ game, flat }: { game: BoardView; flat: boolean }) {
  const { def } = game;
  const geo = def.geometry;
  if (geo.kind !== "points") return null;
  const { width, height, points, edges } = geo;

  return (
    <div className={"gpoints gb--" + def.id + (flat ? " flat" : "")}>
      <svg viewBox={`0 0 ${width} ${height}`} className="gpoints__svg" role="img">
        <g className="gpoints__edges">
          {edges.map(([a, b], i) => (
            <line key={i} x1={points[a].x} y1={points[a].y} x2={points[b].x} y2={points[b].y} />
          ))}
        </g>
        {points.map((p, i) => {
          const isTarget = game.targets.includes(i);
          const isSel = game.selected === i;
          const clickable = game.isHumanTurn;
          return (
            <Fragment key={i}>
              <circle cx={p.x} cy={p.y} r={20} className="gpoints__base" />
              {isTarget && <circle cx={p.x} cy={p.y} r={13} className="gpoints__dot" />}
              {isSel && <circle cx={p.x} cy={p.y} r={30} className="gpoints__sel" />}
              {clickable && (
                <circle cx={p.x} cy={p.y} r={32} className="gpoints__hit" onClick={() => game.onCellClick(i)} />
              )}
            </Fragment>
          );
        })}
        {game.tokens.map((t) => {
          const p = points[t.cell];
          const removal = game.removalTargets.includes(t.cell);
          return (
            <PointToken
              key={t.id}
              x={p.x}
              y={p.y}
              color={def.pieceColors[t.owner]}
              removal={removal}
            />
          );
        })}
      </svg>
      <Graveyard game={game} />
    </div>
  );
}

function PointToken({ x, y, color, removal }: { x: number; y: number; color: string; removal: boolean }) {
  return (
    <g className={"gpoints__token" + (removal ? " removal" : "")} style={{ ["--cx" as string]: x, ["--cy" as string]: y } as React.CSSProperties}>
      <circle cx={x} cy={y} r={24} fill={color} stroke="#160f29" strokeWidth={5} />
      <circle cx={x - 7} cy={y - 7} r={7} fill="rgba(255,255,255,0.45)" />
    </g>
  );
}

function Graveyard({ game }: { game: BoardView }) {
  const { def, graveyard } = game;
  if (graveyard.length === 0) return null;
  const byOwner: [Token[], Token[]] = [[], []];
  for (const t of graveyard) byOwner[t.owner].push(t);
  return (
    <div className="ggrave">
      {([1, 0] as const).map((owner) =>
        byOwner[owner].length ? (
          <div className="ggrave__tray" key={owner}>
            <span className="ggrave__label">{def.players[owner]} lost</span>
            <div className="ggrave__pieces">
              {byOwner[owner].map((t) => (
                <span className="ggrave__piece" key={t.id}>
                  <GamePiece shape={def.pieceShape} color={def.pieceColors[owner]} player={owner} crowned={t.crowned} />
                </span>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}
