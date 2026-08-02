import type { EngineLevel } from "../engine/types";

export type Bot = {
  id: string;
  name: string;
  title: string;
  rating: number;
  avatar: string; // emoji
  accent: string; // css color var
  blurb: string;
  level: EngineLevel;
  /** Probability of playing a random legal move instead of an engine move. */
  blunder: number;
};

/**
 * A roster of opponents from absolute beginner to grandmaster. Sub-1320 bots use
 * Stockfish "Skill Level" (UCI_Elo has a 1320 floor); stronger bots use UCI_Elo.
 * The lowest tiers add random blunders on top so they feel human-beginner.
 */
export const BOTS: Bot[] = [
  {
    id: "pixel",
    name: "Pixel",
    title: "Hatchling",
    rating: 250,
    avatar: "🐣",
    accent: "var(--mint)",
    blurb: "Just learned how the pieces move. Will hang the queen — happily.",
    level: { skill: 0, depth: 1, movetimeMs: 200 },
    blunder: 0.6,
  },
  {
    id: "bolt",
    name: "Bolt",
    title: "Tin Can",
    rating: 450,
    avatar: "🤖",
    accent: "var(--sky)",
    blurb: "A clunky little robot. Sees one move ahead, sometimes.",
    level: { skill: 1, depth: 2, movetimeMs: 250 },
    blunder: 0.4,
  },
  {
    id: "coco",
    name: "Coco",
    title: "Cheeky Monkey",
    rating: 650,
    avatar: "🐵",
    accent: "var(--gold)",
    blurb: "Loves grabbing free pieces but forgets to defend.",
    level: { skill: 3, movetimeMs: 300 },
    blunder: 0.25,
  },
  {
    id: "daisy",
    name: "Daisy",
    title: "Garden Club",
    rating: 850,
    avatar: "🌼",
    accent: "var(--rose)",
    blurb: "Solid casual play. Punishes obvious mistakes.",
    level: { skill: 5, movetimeMs: 350 },
    blunder: 0.12,
  },
  {
    id: "brick",
    name: "Rook E.",
    title: "The Wall",
    rating: 1050,
    avatar: "🧱",
    accent: "var(--coral)",
    blurb: "Stubborn and defensive. Hard to break down.",
    level: { skill: 7, movetimeMs: 400 },
    blunder: 0.05,
  },
  {
    id: "nova",
    name: "Nova",
    title: "Rising Star",
    rating: 1250,
    avatar: "✨",
    accent: "var(--gold)",
    blurb: "Sharp tactics and growing confidence.",
    level: { skill: 9, movetimeMs: 450 },
    blunder: 0,
  },
  {
    id: "vesper",
    name: "Vesper",
    title: "Night Owl",
    rating: 1450,
    avatar: "🦉",
    accent: "var(--violet)",
    blurb: "Patient, positional, and wise.",
    level: { elo: 1450, movetimeMs: 600 },
    blunder: 0,
  },
  {
    id: "leo",
    name: "Leo",
    title: "Club Champion",
    rating: 1650,
    avatar: "🦁",
    accent: "var(--gold)",
    blurb: "A strong club player who rarely slips.",
    level: { elo: 1650, movetimeMs: 700 },
    blunder: 0,
  },
  {
    id: "sera",
    name: "Seraphina",
    title: "The Eagle",
    rating: 1900,
    avatar: "🦅",
    accent: "var(--sky)",
    blurb: "Swoops on the smallest inaccuracy.",
    level: { elo: 1900, movetimeMs: 800 },
    blunder: 0,
  },
  {
    id: "titan",
    name: "Titan",
    title: "Calculator",
    rating: 2150,
    avatar: "⚙️",
    accent: "var(--mint)",
    blurb: "Relentless calculation. Expert strength.",
    level: { elo: 2150, movetimeMs: 1000 },
    blunder: 0,
  },
  {
    id: "drak",
    name: "Drak",
    title: "The Dragon",
    rating: 2450,
    avatar: "🐉",
    accent: "var(--coral)",
    blurb: "Master-level fire. Few survive the middlegame.",
    level: { elo: 2450, movetimeMs: 1200 },
    blunder: 0,
  },
  {
    id: "vex",
    name: "Vex",
    title: "Grandmaster",
    rating: 2850,
    avatar: "👑",
    accent: "var(--violet)",
    blurb: "Full-strength Stockfish. Abandon all hope.",
    level: { depth: 18, movetimeMs: 1500 },
    blunder: 0,
  },
];

export function getBot(id: string): Bot | undefined {
  return BOTS.find((b) => b.id === id);
}
