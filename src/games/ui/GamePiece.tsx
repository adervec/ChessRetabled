import { useId } from "react";
import { darken, lighten, luminance } from "./color";

// A cel-shaded game piece for the 2.5D boards — the generic counterpart to the
// chess PieceArt. Discs (checkers/reversi/connect-four/morris) render as short
// cylinders; "stone" as a domed go stone; "mark" as a Tic-Tac-Toe X or O.
// Shapes are drawn upright in their own SVG; the board counter-rotates them so
// they "stand" on the tilted surface, exactly like the chess sprites.

export type PieceShape = "disc" | "stone" | "mark";

export function GamePiece({
  shape,
  color,
  player,
  crowned,
  className,
}: {
  shape: PieceShape;
  color: string;
  player: 0 | 1;
  crowned?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const light = lighten(color, 0.18);
  const shade = darken(color, 0.28);
  const edge = darken(color, 0.46);
  const ink = "#160f29";
  const detail = luminance(color) > 150 ? darken(color, 0.55) : lighten(color, 0.55);

  if (shape === "mark") {
    return (
      <svg viewBox="0 0 100 100" className={className} width="100%" height="100%" style={{ overflow: "visible" }}>
        {player === 0 ? (
          <g stroke={color} strokeWidth="16" strokeLinecap="round" fill="none">
            <path d="M26,26 L74,74" />
            <path d="M74,26 L26,74" />
            <g stroke={ink} strokeWidth="3" opacity="0.5">
              <path d="M26,26 L74,74" />
              <path d="M74,26 L26,74" />
            </g>
          </g>
        ) : (
          <g>
            <circle cx="50" cy="50" r="26" fill="none" stroke={color} strokeWidth="16" />
            <circle cx="50" cy="50" r="26" fill="none" stroke={ink} strokeWidth="3" opacity="0.5" />
          </g>
        )}
      </svg>
    );
  }

  // disc / stone: an elliptical token with a side rim for thickness
  const domed = shape === "stone";
  return (
    <svg viewBox="0 0 100 70" className={className} width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`face-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={light} />
          <stop offset="0.52" stopColor={light} />
          <stop offset="0.52" stopColor={shade} />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
      </defs>
      {/* side wall (thickness) */}
      <path
        d={`M6,34 L6,46 Q6,58 50,58 Q94,58 94,46 L94,34 Z`}
        fill={edge}
        stroke={ink}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* top face */}
      <ellipse
        cx="50"
        cy={domed ? "32" : "34"}
        rx="44"
        ry={domed ? "20" : "22"}
        fill={`url(#face-${uid})`}
        stroke={ink}
        strokeWidth="3.5"
      />
      {/* highlight */}
      <ellipse cx="36" cy={domed ? "26" : "28"} rx="14" ry="6" fill={lighten(color, 0.4)} opacity="0.6" />
      {/* king ring / crown */}
      {crowned && (
        <g>
          <ellipse cx="50" cy="34" rx="22" ry="10" fill="none" stroke={detail} strokeWidth="3" />
          <path
            d="M38,34 L42,26 L46,32 L50,24 L54,32 L58,26 L62,34 Z"
            fill="#ffce4f"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </g>
      )}
      {/* a center pip for plain discs so they read clearly */}
      {!crowned && !domed && (
        <ellipse cx="50" cy="34" rx="24" ry="11" fill="none" stroke={detail} strokeWidth="2.5" opacity="0.5" />
      )}
    </svg>
  );
}
