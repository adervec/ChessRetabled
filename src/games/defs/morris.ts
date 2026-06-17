import type { CellView, GameDefinition, GameMove, GameStatus, Player } from "../core/types.ts";

// Nine Men's Morris. 24 points on three nested squares. Three phases per player:
// place 9 men, then slide along lines, then "fly" anywhere once down to 3 men.
// Forming a mill (three in a line) removes one enemy man.
const MEN = 9;
const IDLE_DRAW = 60; // movement-phase plies without a capture => draw

export interface MorrisState {
  nodes: (Player | null)[]; // length 24
  turn: Player;
  placed: [number, number]; // men placed so far by each player
  idle: number;
}

// Node positions on a 600×600 board: outer ring 0-7, middle 8-15, inner 16-23,
// each ordered TL, TM, TR, RM, BR, BM, BL, LM.
const POINTS: { x: number; y: number }[] = [
  { x: 50, y: 50 }, { x: 300, y: 50 }, { x: 550, y: 50 }, { x: 550, y: 300 },
  { x: 550, y: 550 }, { x: 300, y: 550 }, { x: 50, y: 550 }, { x: 50, y: 300 },
  { x: 150, y: 150 }, { x: 300, y: 150 }, { x: 450, y: 150 }, { x: 450, y: 300 },
  { x: 450, y: 450 }, { x: 300, y: 450 }, { x: 150, y: 450 }, { x: 150, y: 300 },
  { x: 250, y: 250 }, { x: 300, y: 250 }, { x: 350, y: 250 }, { x: 350, y: 300 },
  { x: 350, y: 350 }, { x: 300, y: 350 }, { x: 250, y: 350 }, { x: 250, y: 300 },
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
  [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
  [1, 9], [9, 17], [3, 11], [11, 19], [5, 13], [13, 21], [7, 15], [15, 23],
];

const MILLS: number[][] = [
  [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
  [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
  [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
  [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23],
];

const ADJ: number[][] = (() => {
  const a: number[][] = Array.from({ length: 24 }, () => []);
  for (const [u, v] of EDGES) { a[u].push(v); a[v].push(u); }
  return a;
})();

function other(p: Player): Player {
  return p === 0 ? 1 : 0;
}
function onBoard(nodes: (Player | null)[], p: Player): number {
  let n = 0;
  for (const x of nodes) if (x === p) n++;
  return n;
}
/** Does a completed mill for `player` pass through `node`? */
function millAt(nodes: (Player | null)[], node: number, player: Player): boolean {
  for (const mill of MILLS) {
    if (!mill.includes(node)) continue;
    if (mill.every((i) => nodes[i] === player)) return true;
  }
  return false;
}
/** Opponent men that may be captured: those outside a mill, or any if all are in mills. */
function removable(nodes: (Player | null)[], opp: Player): number[] {
  const all: number[] = [];
  const free: number[] = [];
  for (let i = 0; i < 24; i++) {
    if (nodes[i] !== opp) continue;
    all.push(i);
    if (!millAt(nodes, i, opp)) free.push(i);
  }
  return free.length ? free : all;
}

function genMoves(s: MorrisState): GameMove[] {
  const p = s.turn;
  const opp = other(p);
  const moves: GameMove[] = [];

  const addWithMill = (base: Omit<GameMove, "id">, after: (Player | null)[], to: number, tag: string) => {
    if (millAt(after, to, p)) {
      const targets = removable(after, opp);
      if (targets.length) {
        for (const rt of targets) moves.push({ ...base, id: `${tag}x${rt}`, remove: rt });
        return;
      }
    }
    moves.push({ ...base, id: tag });
  };

  if (s.placed[p] < MEN) {
    for (let n = 0; n < 24; n++) {
      if (s.nodes[n] !== null) continue;
      const after = s.nodes.slice();
      after[n] = p;
      addWithMill({ to: n }, after, n, `P${n}`);
    }
    return moves;
  }

  const flying = onBoard(s.nodes, p) === 3;
  for (let f = 0; f < 24; f++) {
    if (s.nodes[f] !== p) continue;
    const dests = flying
      ? [...Array(24).keys()].filter((i) => s.nodes[i] === null)
      : ADJ[f].filter((i) => s.nodes[i] === null);
    for (const t of dests) {
      const after = s.nodes.slice();
      after[f] = null;
      after[t] = p;
      addWithMill({ from: f, to: t }, after, t, `${f}-${t}`);
    }
  }
  return moves;
}

export const nineMensMorris: GameDefinition<MorrisState> = {
  id: "nine-mens-morris",
  name: "Nine Men's Morris",
  icon: "🔵",
  blurb: "Form mills to capture. An ancient game of lines and traps.",
  players: ["Blue", "Orange"],
  geometry: { kind: "points", width: 600, height: 600, points: POINTS, edges: EDGES },
  interaction: "place",
  interactionFor: (s) => (s.placed[s.turn] < MEN ? "place" : "select"),
  rules:
    "Phase 1: take turns placing your nine men on empty points. Phase 2: slide a man along a line to an adjacent empty point. Line up three along a marked line to form a mill and remove one enemy man (not one already in a mill, unless all are). Reduce your opponent to two men, or leave them with no move, to win. With exactly three men left you may 'fly' to any empty point.",

  initial: () => ({ nodes: Array(24).fill(null), turn: 0, placed: [0, 0], idle: 0 }),
  currentPlayer: (s) => s.turn,

  legalMoves: (s) => genMoves(s),

  applyMove(s, m) {
    const nodes = s.nodes.slice();
    const placed: [number, number] = [s.placed[0], s.placed[1]];
    if (m.from === undefined) {
      nodes[m.to] = s.turn;
      placed[s.turn] += 1;
    } else {
      nodes[m.from] = null;
      nodes[m.to] = s.turn;
    }
    let idle = s.idle + 1;
    if (m.remove !== undefined) { nodes[m.remove] = null; idle = 0; }
    if (m.from === undefined) idle = 0; // placing still changes the material picture
    return { nodes, turn: other(s.turn), placed, idle };
  },

  status(s): GameStatus {
    const bothPlaced = s.placed[0] === MEN && s.placed[1] === MEN;
    if (bothPlaced) {
      if (onBoard(s.nodes, s.turn) < 3) {
        return { over: true, winner: other(s.turn), reason: "reduced to two men" };
      }
      if (genMoves(s).length === 0) {
        return { over: true, winner: other(s.turn), reason: "no moves left" };
      }
      if (s.idle >= IDLE_DRAW) return { over: true, winner: null, reason: "no captures" };
    }
    return { over: false };
  },

  evaluate(s, player) {
    const opp = other(player);
    const inHand = (p: Player) => MEN - s.placed[p];
    const total = (p: Player) => onBoard(s.nodes, p) + inHand(p);
    let score = (total(player) - total(opp)) * 100;

    let mills = 0;
    for (const mill of MILLS) {
      if (mill.every((i) => s.nodes[i] === player)) mills++;
      else if (mill.every((i) => s.nodes[i] === opp)) mills--;
    }
    score += mills * 30;

    // near-mills: two of mine + an empty third
    let potential = 0;
    for (const mill of MILLS) {
      const mine = mill.filter((i) => s.nodes[i] === player).length;
      const theirs = mill.filter((i) => s.nodes[i] === opp).length;
      const empty = mill.filter((i) => s.nodes[i] === null).length;
      if (mine === 2 && empty === 1) potential += 1;
      if (theirs === 2 && empty === 1) potential -= 1;
    }
    score += potential * 12;
    return score;
  },

  cells(s) {
    return s.nodes.map<CellView | null>((owner) =>
      owner === null ? null : { owner, glyph: owner === 0 ? "🔵" : "🟠" }
    );
  },

  difficulties: [
    { id: "easy", name: "Easy", depth: 2, randomness: 0.4, timeMs: 300 },
    { id: "medium", name: "Medium", depth: 4, randomness: 0.12, timeMs: 800 },
    { id: "hard", name: "Hard", depth: 6, randomness: 0, timeMs: 1600 },
  ],
};
