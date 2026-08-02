// Tiny hex-colour helpers for deriving cel shades from a single base colour.

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parse(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => clamp(x).toString(16).padStart(2, "0")).join("");
}

/** Mix toward black by factor f (0..1). */
export function darken(hex: string, f: number): string {
  const [r, g, b] = parse(hex);
  return toHex(r * (1 - f), g * (1 - f), b * (1 - f));
}

/** Mix toward white by factor f (0..1). */
export function lighten(hex: string, f: number): string {
  const [r, g, b] = parse(hex);
  return toHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
}

/** Perceived luminance 0..255 — used to pick an ink/light detail colour. */
export function luminance(hex: string): number {
  const [r, g, b] = parse(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
