import { Fragment } from "react";
import type { GenericGame } from "./useGenericGame";
import "./GameBoard.css";

export function GameBoard({ game }: { game: GenericGame<unknown> }) {
  const { def } = game;
  if (def.geometry.kind === "points") return <PointsBoard game={game} />;
  return <GridBoard game={game} />;
}

function cellClasses(
  game: GenericGame<unknown>,
  index: number,
  extra: string[] = []
): string {
  const cls = [...extra];
  if (game.targets.includes(index)) cls.push("is-target");
  if (game.selected === index) cls.push("is-selected");
  if (game.lastMoveCells.includes(index)) cls.push("is-last");
  if (game.removalTargets.includes(index)) cls.push("is-removal");
  return cls.join(" ");
}

function GridBoard({ game }: { game: GenericGame<unknown> }) {
  const { def, cells } = game;
  const geo = def.geometry;
  if (geo.kind !== "grid") return null;
  const { cols, rows, checkered, darkOnly } = geo;
  const items = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const dark = (col + row) % 2 === 1;
    const isVoid = darkOnly === true && !dark;
    const extra = ["gb-cell"];
    if (checkered) extra.push(dark ? "is-dark" : "is-light");
    if (isVoid) extra.push("is-void");
    const view = cells[i];
    const clickable = game.isHumanTurn && !isVoid;
    items.push(
      <button
        key={i}
        type="button"
        className={cellClasses(game, i, extra)}
        disabled={!clickable}
        aria-label={`cell ${i}`}
        onClick={clickable ? () => game.onCellClick(i) : undefined}
      >
        {view && (
          <span className={"gb-piece" + (view.crowned ? " is-crowned" : "")}>
            <span className="gb-piece__glyph">{view.glyph}</span>
            {view.crowned && <span className="gb-piece__crown">♛</span>}
          </span>
        )}
        {!view && game.targets.includes(i) && <span className="gb-dot" />}
      </button>
    );
  }
  return (
    <div
      className={`gb-grid gb--${def.id}`}
      style={
        {
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          aspectRatio: `${cols} / ${rows}`,
          "--cols": cols,
        } as React.CSSProperties
      }
    >
      {items}
    </div>
  );
}

function PointsBoard({ game }: { game: GenericGame<unknown> }) {
  const { def, cells } = game;
  const geo = def.geometry;
  if (geo.kind !== "points") return null;
  const { width, height, points, edges } = geo;

  return (
    <div className={`gb-points gb--${def.id}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="gb-svg" role="img">
        <g className="gb-edges">
          {edges.map(([a, b], i) => (
            <line
              key={i}
              x1={points[a].x}
              y1={points[a].y}
              x2={points[b].x}
              y2={points[b].y}
            />
          ))}
        </g>
        {points.map((p, i) => {
          const view = cells[i];
          const isTarget = game.targets.includes(i);
          const isSel = game.selected === i;
          const isLast = game.lastMoveCells.includes(i);
          const isRemoval = game.removalTargets.includes(i);
          const clickable = game.isHumanTurn;
          const cls = [
            "gb-node",
            view ? `is-p${view.owner}` : "is-empty",
            isTarget ? "is-target" : "",
            isSel ? "is-selected" : "",
            isLast ? "is-last" : "",
            isRemoval ? "is-removal" : "",
            clickable ? "is-clickable" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <Fragment key={i}>
              <circle cx={p.x} cy={p.y} r={22} className="gb-node__base" />
              {view && <circle cx={p.x} cy={p.y} r={22} className={cls} />}
              {!view && (isTarget || isSel) && (
                <circle cx={p.x} cy={p.y} r={12} className={"gb-node__dot " + cls} />
              )}
              {clickable && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={30}
                  className="gb-node__hit"
                  onClick={() => game.onCellClick(i)}
                />
              )}
            </Fragment>
          );
        })}
      </svg>
    </div>
  );
}
