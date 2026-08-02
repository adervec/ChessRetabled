type Props = { size?: number; title?: boolean };

/** Cel-shaded knight badge used as the app mark. */
export function Logo({ size = 40, title = true }: Props) {
  return (
    <div className="row gap-s" style={{ gap: 12 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="ChessRetabled"
      >
        {/* badge */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="16"
          fill="var(--violet)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="16"
          fill="url(#lg-shade)"
        />
        <defs>
          <linearGradient id="lg-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="0.5" stopColor="rgba(255,255,255,0)" />
            <stop offset="0.5" stopColor="rgba(0,0,0,0.16)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.16)" />
          </linearGradient>
        </defs>
        {/* knight silhouette */}
        <path
          d="M24 50 C22 41 24 39 27 36 C22 37 19 34 20 29 C21 24 25 23 27 20 L25 16 L30 17 L32 13 C40 14 46 21 46 32 L46 50 Z"
          fill="var(--paper)"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M46 32 C46 21 40 14 32 13 L33 18 C39 21 41 26 41 33 L41 50 L46 50 Z"
          fill="rgba(0,0,0,0.18)"
        />
        <circle cx="27" cy="25" r="2.1" fill="var(--ink)" />
        <rect
          x="20"
          y="50"
          width="28"
          height="6"
          rx="3"
          fill="var(--gold)"
          stroke="var(--ink)"
          strokeWidth="3"
        />
      </svg>
      {title && (
        <span
          className="toon-title"
          style={{ fontSize: "1.4rem", lineHeight: 1 }}
        >
          Chess<span style={{ color: "var(--gold)" }}>Retabled</span>
        </span>
      )}
    </div>
  );
}
