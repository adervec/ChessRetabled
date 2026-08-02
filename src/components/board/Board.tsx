import { useMemo } from "react";
import {
  type Orientation,
  type Square,
  displayCoords,
  isLightSquare,
  squareFrom,
} from "../../chess/types";
import type { PlacedPiece } from "../../chess/useChessGame";
import { PieceArt } from "./pieces";
import "./Board.css";

export type BoardProps = {
  placed: PlacedPiece[];
  orientation?: Orientation;
  interactive?: boolean;
  selected?: Square | null;
  targets?: Square[];
  lastMove?: { from: Square; to: Square } | null;
  checkSquare?: Square | null;
  hintSquares?: Square[];
  flat?: boolean;
  tilt?: number;
  maxWidth?: number;
  showCoords?: boolean;
  onSquareClick?: (sq: Square) => void;
};

function squareAt(col: number, row: number, orientation: Orientation): Square {
  if (orientation === "white") return squareFrom(col, 7 - row);
  return squareFrom(7 - col, row);
}

export function Board({
  placed,
  orientation = "white",
  interactive = false,
  selected = null,
  targets = [],
  lastMove = null,
  checkSquare = null,
  hintSquares = [],
  flat = false,
  tilt = 46,
  maxWidth = 560,
  showCoords = true,
  onSquareClick,
}: BoardProps) {
  const occupied = useMemo(() => {
    const set = new Set<string>();
    placed.forEach((p) => set.add(p.square));
    return set;
  }, [placed]);

  const hintSet = useMemo(() => new Set(hintSquares), [hintSquares]);

  const cells = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq = squareAt(col, row, orientation);
      const light = isLightSquare(sq);
      const classes = ["sq", light ? "light" : "dark"];
      if (selected === sq) classes.push("selected");
      if (lastMove && (lastMove.from === sq || lastMove.to === sq))
        classes.push("last");
      if (checkSquare === sq) classes.push("check");
      if (hintSet.has(sq)) classes.push("hint");
      cells.push(
        <button
          key={sq}
          type="button"
          className={classes.join(" ")}
          aria-label={sq}
          tabIndex={interactive ? 0 : -1}
          onClick={interactive ? () => onSquareClick?.(sq) : undefined}
        >
          <span className="sq__hl" />
          {showCoords && row === 7 && (
            <span className="sq__coord file">{sq[0]}</span>
          )}
          {showCoords && col === 0 && (
            <span className="sq__coord rank">{sq[1]}</span>
          )}
        </button>
      );
    }
  }

  const sortedPieces = useMemo(
    () =>
      [...placed].sort(
        (a, b) =>
          displayCoords(a.square, orientation).row -
          displayCoords(b.square, orientation).row
      ),
    [placed, orientation]
  );

  return (
    <div
      className={"board3d-scene" + (flat ? " flat" : "")}
      style={
        {
          "--tilt": `${tilt}deg`,
          "--board-max": `${maxWidth}px`,
        } as React.CSSProperties
      }
    >
      <div className={"board3d" + (interactive ? " interactive" : "")}>
        <div className="board3d__slab" />
        <div className="board3d__frame" />
        <div className="board3d__grid">{cells}</div>

        <div className="pieces">
          {sortedPieces.map((p) => {
            const { col, row } = displayCoords(p.square, orientation);
            return (
              <div
                key={p.id}
                className="piece"
                style={
                  {
                    "--tx": `${col * 100}%`,
                    "--ty": `${row * 100}%`,
                  } as React.CSSProperties
                }
              >
                <span className="piece__shadow" />
                <PieceArt type={p.type} color={p.color} className="piece__sprite" />
              </div>
            );
          })}
        </div>

        {interactive && targets.length > 0 && (
          <div className="targets">
            {targets.map((sq) => {
              const { col, row } = displayCoords(sq, orientation);
              const capture = occupied.has(sq);
              return (
                <div
                  key={sq}
                  className={"target" + (capture ? " capture" : "")}
                  style={
                    {
                      "--tx": `${col * 100}%`,
                      "--ty": `${row * 100}%`,
                    } as React.CSSProperties
                  }
                  onClick={() => onSquareClick?.(sq)}
                >
                  <span className="target__dot" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
