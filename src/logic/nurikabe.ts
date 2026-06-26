import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Nurikabe. Shade cells into a single connected "sea" so that the unshaded cells
// form islands: each numbered clue sits on an island of exactly that many cells,
// islands never touch orthogonally, the sea is all connected, and no 2×2 block
// is entirely sea. Generation grows non-touching islands and checks the leftover
// sea is legal; the solver places each clue's island as an exact-size polyomino
// and confirms the configuration is forced (unique).

export interface Clue { cell: number; size: number }
export interface Puzzle {
  rows: number;
  cols: number;
  clues: Clue[];
  solution: boolean[]; // true = sea (shaded)
}

function neighbors4(i: number, rows: number, cols: number): number[] {
  const r = Math.floor(i / cols), c = i % cols, out: number[] = [];
  if (r > 0) out.push(i - cols);
  if (r < rows - 1) out.push(i + cols);
  if (c > 0) out.push(i - 1);
  if (c < cols - 1) out.push(i + 1);
  return out;
}

/** Sea = the cells flagged true; is it one connected group with no 2×2 pool? */
function seaIsLegal(sea: boolean[], rows: number, cols: number): boolean {
  const cells: number[] = [];
  for (let i = 0; i < rows * cols; i++) if (sea[i]) cells.push(i);
  if (cells.length === 0) return false;
  const seen = new Set<number>([cells[0]]);
  const st = [cells[0]];
  while (st.length) { const i = st.pop()!; for (const nb of neighbors4(i, rows, cols)) if (sea[nb] && !seen.has(nb)) { seen.add(nb); st.push(nb); } }
  if (seen.size !== cells.length) return false; // sea must be one piece
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
    const i = r * cols + c;
    if (sea[i] && sea[i + 1] && sea[i + cols] && sea[i + cols + 1]) return false; // 2×2 pool
  }
  return true;
}

export function countSolutions(clues: Clue[], rows: number, cols: number, limit = 2): number {
  const n = rows * cols;
  const owner = new Array<number>(n).fill(-1); // -1 = unassigned, else clue index
  const clueAt = new Map<number, number>();
  clues.forEach((cl, i) => clueAt.set(cl.cell, i));
  let count = 0, steps = 0, capped = false;

  // A cell may join the island being grown for clue `ci` if it is free, not
  // another clue, and not orthogonally adjacent to any other island or clue.
  const addable = (cell: number, ci: number): boolean => {
    if (owner[cell] !== -1) return false;
    if (clueAt.has(cell) && clueAt.get(cell) !== ci) return false;
    for (const nb of neighbors4(cell, rows, cols)) {
      if (owner[nb] !== -1 && owner[nb] !== ci) return false;
      if (clueAt.has(nb) && clueAt.get(nb) !== ci) return false;
    }
    return true;
  };

  const place = (ci: number): void => {
    if (count >= limit || capped) return;
    if (++steps > 800000) { capped = true; return; }
    if (ci === clues.length) {
      const sea = owner.map((o) => o === -1);
      if (seaIsLegal(sea, rows, cols)) count++;
      return;
    }
    const seed = clues[ci].cell, size = clues[ci].size;
    // enumerate exact-size islands containing the seed via ordered-frontier growth
    const inSet = new Set<number>([seed]);
    const grow = (frontier: number[]): void => {
      if (count >= limit || capped) return;
      if (inSet.size === size) {
        for (const x of inSet) owner[x] = ci;
        place(ci + 1);
        for (const x of inSet) owner[x] = -1;
        return;
      }
      for (let i = 0; i < frontier.length; i++) {
        const cell = frontier[i];
        if (!addable(cell, ci) || inSet.has(cell)) continue;
        inSet.add(cell);
        const rest = frontier.slice(i + 1);
        const nf = rest.slice();
        for (const nb of neighbors4(cell, rows, cols)) if (!inSet.has(nb) && !nf.includes(nb) && addable(nb, ci)) nf.push(nb);
        grow(nf);
        inSet.delete(cell);
        if (count >= limit || capped) return;
      }
    };
    const f0: number[] = [];
    for (const nb of neighbors4(seed, rows, cols)) if (addable(nb, ci)) f0.push(nb);
    grow(f0);
  };
  place(0);
  return capped ? limit : count;
}

/** Would the sea (owner === -1 cells) stay connected if `remove` were turned into land? */
function seaConnectedIfRemove(owner: number[], rows: number, cols: number, remove: number): boolean {
  const isSea = (i: number) => owner[i] === -1 && i !== remove;
  let start = -1;
  for (let i = 0; i < owner.length; i++) if (isSea(i)) { start = i; break; }
  if (start < 0) return false; // need some sea left
  const seen = new Set<number>([start]); const st = [start];
  while (st.length) { const i = st.pop()!; for (const nb of neighbors4(i, rows, cols)) if (isSea(nb) && !seen.has(nb)) { seen.add(nb); st.push(nb); } }
  let total = 0;
  for (let i = 0; i < owner.length; i++) if (isSea(i)) total++;
  return seen.size === total;
}

function generateSolution(rows: number, cols: number, rng: Rng): { clues: Clue[]; owner: number[] } | null {
  const n = rows * cols;
  const owner = new Array<number>(n).fill(-1);
  const clues: Clue[] = [];
  const maxSize = Math.min(5, Math.max(3, Math.round(n / 10)));
  const otherIslandNear = (cell: number, ci: number) =>
    neighbors4(cell, rows, cols).some((nb) => owner[nb] !== -1 && owner[nb] !== ci);

  // Grow non-touching islands, but only ever take a cell from the sea if the sea
  // stays connected — so the sea never gets pinched into separate pockets.
  for (const seed of shuffle([...Array(n).keys()], rng)) {
    if (owner[seed] !== -1 || otherIslandNear(seed, -2) || !seaConnectedIfRemove(owner, rows, cols, seed)) continue;
    const ci = clues.length;
    owner[seed] = ci;
    const set = [seed];
    const target = 1 + rng.int(maxSize);
    while (set.length < target) {
      const cands: number[] = [];
      for (const cell of set) for (const nb of neighbors4(cell, rows, cols))
        if (owner[nb] === -1 && !cands.includes(nb) && !otherIslandNear(nb, ci) && seaConnectedIfRemove(owner, rows, cols, nb)) cands.push(nb);
      if (cands.length === 0) break;
      const pick = cands[rng.int(cands.length)];
      owner[pick] = ci;
      set.push(pick);
    }
    clues.push({ cell: seed, size: set.length });
  }

  // Break any remaining 2×2 sea pool by turning one of its cells into land,
  // keeping the sea connected and islands non-touching.
  for (let pass = 0; pass < n; pass++) {
    let pool = -1;
    for (let r = 0; r < rows - 1 && pool < 0; r++) for (let c = 0; c < cols - 1; c++) {
      const i = r * cols + c;
      if (owner[i] === -1 && owner[i + 1] === -1 && owner[i + cols] === -1 && owner[i + cols + 1] === -1) { pool = i; break; }
    }
    if (pool < 0) break;
    const sq = [pool, pool + 1, pool + cols, pool + cols + 1];
    let fixed = false;
    for (const cell of sq) {
      const adj = [...new Set(neighbors4(cell, rows, cols).map((nb) => owner[nb]).filter((o) => o !== -1))];
      if (adj.length >= 2 || !seaConnectedIfRemove(owner, rows, cols, cell)) continue;
      if (adj.length === 1) { owner[cell] = adj[0]; clues[adj[0]].size++; } else { owner[cell] = clues.length; clues.push({ cell, size: 1 }); }
      fixed = true;
      break;
    }
    if (!fixed) return null; // a pool we cannot break without splitting the sea
  }

  if (clues.length < 2) return null;
  const sea = owner.map((o) => o === -1);
  if (!seaIsLegal(sea, rows, cols)) return null;
  return { clues, owner };
}

export function generate(seed: number, rows = 6, cols = 6): Puzzle {
  const rng = makeRng(seed);
  let lastLegal: { clues: Clue[]; owner: number[] } | null = null;
  for (let attempt = 0; attempt < 500; attempt++) {
    const g = generateSolution(rows, cols, rng);
    if (!g) continue;
    lastLegal = g;
    if (countSolutions(g.clues, rows, cols, 2) === 1) {
      return { rows, cols, clues: g.clues, solution: g.owner.map((o) => o === -1) };
    }
  }
  // Fallback: a legal (if not strictly unique) board so the puzzle is always playable.
  if (lastLegal) return { rows, cols, clues: lastLegal.clues, solution: lastLegal.owner.map((o) => o === -1) };
  const clues: Clue[] = [{ cell: 0, size: 1 }];
  const solution = new Array<boolean>(rows * cols).fill(true);
  solution[0] = false;
  return { rows, cols, clues, solution };
}

/** Does the player's shading solve the puzzle? `sea[i]` true = shaded. */
export function isSolved(sea: boolean[], clues: Clue[], rows: number, cols: number): boolean {
  const n = rows * cols;
  if (!seaIsLegal(sea, rows, cols)) return false;
  const clueAt = new Map<number, number>();
  clues.forEach((cl) => clueAt.set(cl.cell, cl.size));
  // every white (island) cell belongs to a component with exactly one clue of matching size
  const seen = new Array<boolean>(n).fill(false);
  let islands = 0;
  for (let i = 0; i < n; i++) {
    if (sea[i] || seen[i]) continue;
    islands++;
    const comp: number[] = [];
    const st = [i]; seen[i] = true;
    while (st.length) { const j = st.pop()!; comp.push(j); for (const nb of neighbors4(j, rows, cols)) if (!sea[nb] && !seen[nb]) { seen[nb] = true; st.push(nb); } }
    const clued = comp.filter((c) => clueAt.has(c));
    if (clued.length !== 1) return false; // exactly one clue per island
    if (comp.length !== clueAt.get(clued[0])) return false; // island size matches its clue
  }
  return islands === clues.length;
}
