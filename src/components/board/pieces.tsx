import { useId } from "react";
import type { Color, PieceSymbol } from "../../chess/types";

/**
 * Cel-shaded chess pieces, built from chunky primitives with a hard-edged
 * two-tone "cel" split (via a hard-stop gradient), a thick ink outline, and a
 * team-colored base. Each piece is an upright, front-facing silhouette designed
 * to "stand" on the 2.5D board.
 */

type Palette = {
  light: string;
  shade: string;
  hi: string;
  rim: string;
  base: string;
  baseShade: string;
  ink: string;
};

const WHITE: Palette = {
  light: "#f7efda",
  shade: "#d6c6a0",
  hi: "#fffdf6",
  rim: "#fffaf0",
  base: "#f0b94e",
  baseShade: "#cf9326",
  ink: "#1a1330",
};

const BLACK: Palette = {
  light: "#403a72",
  shade: "#221d46",
  hi: "#6a62ad",
  rim: "#7d74c4",
  base: "#9a6cf0",
  baseShade: "#6a40c0",
  ink: "#0c0a1c",
};

export function PieceArt({
  type,
  color,
  className,
}: {
  type: PieceSymbol;
  color: Color;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const p = color === "w" ? WHITE : BLACK;
  const body = `url(#body-${uid})`;
  const baseFill = `url(#base-${uid})`;

  return (
    <svg
      viewBox="0 0 90 122"
      className={className}
      width="100%"
      height="100%"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* hard-stop cel split (light left, shade right) */}
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={p.light} />
          <stop offset="0.54" stopColor={p.light} />
          <stop offset="0.54" stopColor={p.shade} />
          <stop offset="1" stopColor={p.shade} />
        </linearGradient>
        <linearGradient id={`base-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={p.base} />
          <stop offset="0.54" stopColor={p.base} />
          <stop offset="0.54" stopColor={p.baseShade} />
          <stop offset="1" stopColor={p.baseShade} />
        </linearGradient>
      </defs>

      {/* common base / plinth */}
      <g
        stroke={p.ink}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <Body type={type} body={body} ink={p.ink} hi={p.hi} rim={p.rim} />
        {/* base drawn last so it sits in front of the body's bottom */}
        <path
          d="M20,118 Q16,118 16,113 Q16,107 24,105 L66,105 Q74,107 74,113 Q74,118 70,118 Z"
          fill={baseFill}
        />
        <ellipse cx="45" cy="104" rx="24" ry="5.5" fill={baseFill} />
      </g>
    </svg>
  );
}

function Body({
  type,
  body,
  ink,
  hi,
  rim,
}: {
  type: PieceSymbol;
  body: string;
  ink: string;
  hi: string;
  rim: string;
}) {
  switch (type) {
    case "p":
      return (
        <g>
          <path
            d="M31,106 Q30,84 38,72 L52,72 Q60,84 59,106 Z"
            fill={body}
          />
          <ellipse cx="45" cy="71" rx="15" ry="5" fill={body} />
          <circle cx="45" cy="49" r="15" fill={body} />
          <circle cx="39" cy="44" r="4.5" fill={rim} stroke="none" />
        </g>
      );
    case "r":
      return (
        <g>
          <path d="M30,106 L33,64 L57,64 L60,106 Z" fill={body} />
          <ellipse cx="45" cy="64" rx="16" ry="5" fill={body} />
          <path
            d="M27,64 L27,44 L34,44 L34,51 L41,51 L41,44 L49,44 L49,51 L56,51 L56,44 L63,44 L63,64 Z"
            fill={body}
          />
          <rect x="38" y="40" width="14" height="5" rx="2" fill={rim} stroke="none" />
        </g>
      );
    case "b":
      return (
        <g>
          <path
            d="M30,106 Q31,80 40,68 L50,68 Q59,80 60,106 Z"
            fill={body}
          />
          <ellipse cx="45" cy="67" rx="15" ry="4.5" fill={body} />
          <path
            d="M45,30 Q60,42 56,56 Q51,63 45,63 Q39,63 34,56 Q30,42 45,30 Z"
            fill={body}
          />
          <path d="M45,38 L45,52" stroke={ink} strokeWidth="3.5" />
          <circle cx="45" cy="26" r="5.5" fill={body} />
          <circle cx="40" cy="44" r="3.5" fill={hi} stroke="none" />
        </g>
      );
    case "n":
      return (
        <g>
          {/* stylized horse head facing left */}
          <path
            d="M40,106
               Q36,92 36,84
               Q30,86 27,82
               Q24,76 30,72
               L40,64
               Q41,58 39,53
               Q43,50 47,53
               L52,44
               Q56,34 64,34
               Q70,35 71,44
               Q72,58 66,72
               Q62,82 62,92
               L63,106 Z"
            fill={body}
          />
          {/* mane */}
          <path
            d="M64,36 Q72,42 70,58 Q68,68 64,74 L60,70 Q66,58 62,44 Z"
            fill={ink}
            stroke="none"
            opacity="0.22"
          />
          {/* eye */}
          <circle cx="58" cy="48" r="3.2" fill={ink} stroke="none" />
          {/* nostril */}
          <circle cx="33" cy="74" r="2.2" fill={ink} stroke="none" />
        </g>
      );
    case "q":
      return (
        <g>
          <path
            d="M28,106 Q30,76 41,60 L49,60 Q60,76 62,106 Z"
            fill={body}
          />
          <ellipse cx="45" cy="60" rx="17" ry="5" fill={body} />
          {/* crown zig-zag */}
          <path
            d="M30,58 L27,32 L37,48 L45,28 L53,48 L63,32 L60,58 Z"
            fill={body}
          />
          <circle cx="27" cy="30" r="5" fill={body} />
          <circle cx="45" cy="25" r="5.5" fill={body} />
          <circle cx="63" cy="30" r="5" fill={body} />
          <ellipse cx="45" cy="58" rx="17" ry="4" fill={hi} stroke="none" opacity="0.5" />
        </g>
      );
    case "k":
      return (
        <g>
          <path
            d="M28,106 Q30,74 41,58 L49,58 Q60,74 62,106 Z"
            fill={body}
          />
          <ellipse cx="45" cy="58" rx="17" ry="5" fill={body} />
          <path d="M33,58 L33,40 Q33,34 45,34 Q57,34 57,40 L57,58 Z" fill={body} />
          {/* crown cross */}
          <rect x="41.5" y="14" width="7" height="22" rx="2.5" fill={body} />
          <rect x="35" y="20" width="20" height="7" rx="2.5" fill={body} />
        </g>
      );
    default:
      return null;
  }
}
